from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Response
from typing import List
import requests
from sqlalchemy.orm import Session
from fastapi.responses import FileResponse
from pathlib import Path
import os

from backend.core.database import get_db
from backend import models
from backend.logic.image_uploader import upload_pet_photo_local
from backend.schemas.pet_schema import PetCreate, PetResponse, PetUpdate
from pydantic.networks import HttpUrl
from backend.core.dependencies import get_current_user
from backend.models.user import User
from backend.models.pet import Pet
from backend.models.pet_vector import PetVector
from backend.models.match import Match
from backend.logic.matching_logic import build_pet_vector
from backend.models.pet_training_traits import PetTrainingTrait


router = APIRouter(prefix="/pets", tags=["Pets"])

@router.get("/", response_model=List[PetResponse])
def read_pets(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    return db.query(models.Pet).filter(models.Pet.status == "Available").offset(skip).limit(limit).all()

@router.get("/{pet_id}", response_model=PetResponse)
def read_pet(pet_id: int, db: Session = Depends(get_db)):
    pet = db.query(models.Pet).filter(models.Pet.id == pet_id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    return pet

@router.post("/", response_model=PetResponse)
def create_pet(pet: PetCreate, db: Session = Depends(get_db)):
    data = pet.model_dump()
    if isinstance(data.get("image_url"), HttpUrl):
        data["image_url"] = str(data["image_url"])
    db_pet = models.Pet(**data)
    db.add(db_pet)
    db.commit()
    db.refresh(db_pet)
    
    try:
        traits = db.query(PetTrainingTrait).filter_by(pet_id=db_pet.id).all()
        trait_enums = [t.trait for t in traits]
        pet_response = PetResponse(**{k: v for k, v in db_pet.__dict__.items() if not k.startswith("_")})
        vector = build_pet_vector(pet_response, trait_enums)
        
        pet_vector = PetVector(pet_id=db_pet.id, vector=vector.tolist())
        db.add(pet_vector)
        db.commit()
        print(f"✅ Auto-created vector for {db_pet.name}")
    except Exception as e:
        print(f"❌ Vector creation failed for {db_pet.name}: {e}")
    
    return db_pet

@router.put("/{pet_id}", response_model=PetResponse)
def update_pet(pet_id: int, pet_update: PetCreate, db: Session = Depends(get_db)):
    pet = db.query(models.Pet).filter(models.Pet.id == pet_id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    for key, value in pet_update.model_dump().items():
        setattr(pet, key, value)
    db.commit()
    db.refresh(pet)
    
    try:
        traits = db.query(PetTrainingTrait).filter_by(pet_id=pet_id).all()
        trait_enums = [t.trait for t in traits]
        pet_response = PetResponse(**{k: v for k, v in pet.__dict__.items() if not k.startswith("_")})
        vector = build_pet_vector(pet_response, trait_enums)
        
        existing_vector = db.query(PetVector).filter_by(pet_id=pet_id).first()
        if existing_vector:
            existing_vector.vector = vector.tolist()
        else:
            pet_vector = PetVector(pet_id=pet_id, vector=vector.tolist())
            db.add(pet_vector)
        db.commit()
        print(f"✅ Auto-updated vector for {pet.name}")
    except Exception as e:
        print(f"❌ Vector update failed for {pet.name}: {e}")
    
    return pet

@router.delete("/{pet_id}", response_model=PetResponse)
def delete_pet(pet_id: int, db: Session = Depends(get_db)):
    pet = db.query(models.Pet).filter(models.Pet.id == pet_id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    db.delete(pet)
    db.commit()
    return pet

@router.get("/{pet_id}/photo")
async def get_pet_photo(pet_id: int, db: Session = Depends(get_db)):
    try:
        pet = db.query(models.Pet).filter(models.Pet.id == pet_id).first()
        if not pet or not pet.image_url:
            raise HTTPException(status_code=404, detail="Pet or photo not found")
        
        if not (pet.image_url.startswith('http') or pet.image_url.startswith('https')):
            file_path = Path(pet.image_url)
            if not file_path.exists():
                uploads_path = Path("uploads") / pet.image_url
                if not uploads_path.exists():
                    raise HTTPException(status_code=404, detail="Photo file not found")
                file_path = uploads_path
            
            return FileResponse(
                file_path,
                media_type="image/jpeg",
                headers={
                    "Cache-Control": "public, max-age=86400", 
                    "Access-Control-Allow-Origin": "*"  
                }
            )
        
        try:
            response = requests.get(pet.image_url, stream=True, timeout=10)
            response.raise_for_status()
            
            content_type = response.headers.get('content-type', 'image/jpeg')
            
            return Response(
                content=response.content,  
                media_type=content_type,
                headers={
                    "Cache-Control": "public, max-age=86400",  
                    "Access-Control-Allow-Origin": "*"  
                }
            )
        except requests.exceptions.RequestException as e:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to fetch external image: {str(e)}"
            )
    except Exception as e:
        print(f"Error in get_pet_photo: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while processing the image"
        )

@router.post("/{pet_id}/photo")
async def upload_pet_photo(pet_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    pet = db.query(models.Pet).filter(models.Pet.id == pet_id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    file_path = upload_pet_photo_local(file.file, pet_id)
    
    pet.image_url = file_path
    db.commit()
    
    return {"message": "Photo uploaded successfully", "image_url": file_path}

@router.patch("/{pet_id}", response_model=PetResponse)
def update_pet(
    pet_id: int,
    pet_update: PetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Only admins can update pets")

    pet = db.query(Pet).filter_by(id=pet_id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    current_image_url = pet.image_url
    
    update_data = pet_update.model_dump(exclude_unset=True)
    
    if 'image_url' in update_data and update_data['image_url'] is not None:
        update_data['image_url'] = str(update_data['image_url'])
    
    for key, value in update_data.items():
        setattr(pet, key, value)
    
    if 'image_url' not in update_data and current_image_url:
        pet.image_url = current_image_url

    if pet_update.status and pet_update.status != "Available":
        db.query(PetVector).filter_by(pet_id=pet_id).delete()

    db.commit()
    db.refresh(pet)

    if pet.status == "Adopted":
        db.query(Match).filter_by(pet_id=pet_id).delete()
        db.commit()
        
    return pet

    return pet

