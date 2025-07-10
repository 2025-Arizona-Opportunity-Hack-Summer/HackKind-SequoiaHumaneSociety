from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Response, Form
from typing import List, Optional
import requests
from sqlalchemy.orm import Session
from fastapi.responses import FileResponse
from pathlib import Path
import os

from  core.database import get_db
from backend import models
from  logic.image_uploader import upload_pet_photo_local  # Now uses S3
from  schemas.pet_schema import PetResponse
from  core.dependencies import get_optional_user, get_current_user
from  models.user import User, UserRole
from  models.pet_vector import PetVector
from  models.match import Match
from  logic.matching_logic import build_pet_vector
from  models.pet_training_traits import PetTrainingTrait
from  logic.OpenAI_API_Logic import pet_ai_service
from  core.config import settings


router = APIRouter(prefix="/pets", tags=["Pets"])

def _ensure_absolute_image_url(pet):
    if pet.image_url and pet.image_url.startswith("/static/"):
        pet.image_url = f"{settings.BASE_URL}{pet.image_url}"
    return pet

@router.get("/", response_model=List[PetResponse])
def read_pets(
    skip: int = 0, 
    limit: int = 100,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    query = db.query(models.Pet)
    
    if status:
        query = query.filter(models.Pet.status == status)
    elif current_user is None or current_user.role != UserRole.Admin:
        query = query.filter(models.Pet.status == "Available")
    pets = query.order_by(models.Pet.created_at.desc()).offset(skip).limit(limit).all()
    return [_ensure_absolute_image_url(pet) for pet in pets]

@router.get("/{pet_id}", response_model=PetResponse)
def read_pet(pet_id: int, db: Session = Depends(get_db)):
    pet = db.query(models.Pet).filter(models.Pet.id == pet_id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    return _ensure_absolute_image_url(pet)

@router.get("/{pet_id}/summary")
async def get_pet_summary(
    pet_id: int,
    db: Session = Depends(get_db)
):
    pet = db.query(models.Pet).filter(models.Pet.id == pet_id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    if not pet.summary:
        raise HTTPException(
            status_code=404, 
            detail="No summary available for this pet. Please update the pet to generate a summary."
        )
    
    return {"summary": pet.summary}

@router.post("/", response_model=PetResponse)
async def create_pet(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    name: str = Form(...),
    age_group: str = Form(...),
    sex: str = Form(...),
    species: str = Form(...),
    size: Optional[str] = Form(None),
    energy_level: Optional[str] = Form(None),
    experience_level: Optional[str] = Form(None),
    hair_length: Optional[str] = Form(None),
    breed: Optional[str] = Form(None),
    allergy_friendly: Optional[bool] = Form(None),
    special_needs: Optional[bool] = Form(None),
    kid_friendly: Optional[bool] = Form(None),
    pet_friendly: Optional[bool] = Form(None),
    shelter_notes: Optional[str] = Form(None),
    status: Optional[str] = Form("Available"),
    image: Optional[UploadFile] = File(None),
):
    if current_user.role != UserRole.Admin:
        raise HTTPException(status_code=403, detail="Only admins can create pets")

    try:
        pet_data = {
            "name": name, "age_group": age_group, "sex": sex, "species": species,
            "size": size, "energy_level": energy_level, "experience_level": experience_level,
            "hair_length": hair_length, "breed": breed, "allergy_friendly": allergy_friendly,
            "special_needs": special_needs, "kid_friendly": kid_friendly,
            "pet_friendly": pet_friendly, "shelter_notes": shelter_notes, "status": status,
        }
        
        db_pet = models.Pet(**{k: v for k, v in pet_data.items() if v is not None})
        # Generate summary using fallback BEFORE commit
        summary = await pet_ai_service.generate_pet_summary({
            'name': name,
            'species': species,
            'breed': breed,
            'age_group': age_group,
            'sex': sex,
            'size': size,
            'energy_level': energy_level,
            'experience_level': experience_level,
            'hair_length': hair_length,
            'allergy_friendly': allergy_friendly,
            'special_needs': special_needs,
            'kid_friendly': kid_friendly,
            'pet_friendly': pet_friendly,
            'shelter_notes': shelter_notes,
        })
        db_pet.summary = summary  # type: ignore
        db.add(db_pet)
        db.commit()
        db.refresh(db_pet)

        if image and image.filename:
            try:
                image_url = await upload_pet_photo_local(image, db_pet.id, image.filename)
                db_pet.image_url = image_url  # type: ignore
            except Exception as e:
                print(f"Warning: Could not upload image for new pet {db_pet.id}: {e}")
            finally:
                await image.close()
        
        try:
            traits = db.query(PetTrainingTrait).filter_by(pet_id=db_pet.id).all()
            trait_enums = [t.trait for t in traits]
            pet_response = PetResponse.model_validate(db_pet, from_attributes=True)
            vector = build_pet_vector(pet_response, trait_enums)
            
            pet_vector = PetVector(pet_id=db_pet.id, vector=vector.tolist())
            db.add(pet_vector)
            db.commit()
            print(f"✅ Auto-created vector for {db_pet.name}")
        except Exception as e:
            print(f"❌ Vector creation failed for {db_pet.name}: {e}")
        
        return db_pet
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create pet: {e}")


@router.patch("/{pet_id}", response_model=PetResponse)
async def update_pet(
    pet_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    name: Optional[str] = Form(None),
    age_group: Optional[str] = Form(None),
    sex: Optional[str] = Form(None),
    species: Optional[str] = Form(None),
    size: Optional[str] = Form(None),
    energy_level: Optional[str] = Form(None),
    experience_level: Optional[str] = Form(None),
    hair_length: Optional[str] = Form(None),
    breed: Optional[str] = Form(None),
    allergy_friendly: Optional[bool] = Form(None),
    special_needs: Optional[bool] = Form(None),
    kid_friendly: Optional[bool] = Form(None),
    pet_friendly: Optional[bool] = Form(None),
    shelter_notes: Optional[str] = Form(None),
    status: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
):
    if current_user.role != UserRole.Admin:
        raise HTTPException(status_code=403, detail="Only admins can update pets")

    pet = db.query(models.Pet).filter(models.Pet.id == pet_id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    try:
        update_data = {
            "name": name, "age_group": age_group, "sex": sex, "species": species,
            "size": size, "energy_level": energy_level, "experience_level": experience_level,
            "hair_length": hair_length, "breed": breed, "allergy_friendly": allergy_friendly,
            "special_needs": special_needs, "kid_friendly": kid_friendly,
            "pet_friendly": pet_friendly, "shelter_notes": shelter_notes, "status": status,
        }
        
        summary_needs_update = False
        for key, value in update_data.items():
            if value is not None and getattr(pet, key) != value:
                setattr(pet, key, value)
                if key not in ['status']:
                    summary_needs_update = True
        
        if image and image.filename:
            try:
                image_url = await upload_pet_photo_local(image, pet_id, image.filename)
                pet.image_url = image_url
                summary_needs_update = True
            except Exception as e:
                print(f"Warning: Could not update image for pet {pet_id}: {e}")
            finally:
                await image.close()

        if summary_needs_update:
            try:
                pet_dict = {c.name: getattr(pet, c.name) for c in pet.__table__.columns if getattr(pet, c.name) is not None}
                pet.summary = await pet_ai_service.generate_pet_summary(pet_dict)
            except Exception as e:
                print(f"Warning: Failed to update AI summary for pet {pet_id}: {e}")
        
        db.commit()
        db.refresh(pet)

        try:
            traits = db.query(PetTrainingTrait).filter_by(pet_id=pet_id).all()
            trait_enums = [t.trait for t in traits]
            pet_response = PetResponse.model_validate(pet, from_attributes=True)
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

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update pet: {e}")

@router.delete("/{pet_id}", status_code=204)
def delete_pet(pet_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.Admin:
        raise HTTPException(status_code=403, detail="Only admins can delete pets")
        
    pet = db.query(models.Pet).filter(models.Pet.id == pet_id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    db.query(models.PetTrainingTrait).filter(models.PetTrainingTrait.pet_id == pet_id).delete()
    db.query(models.PetVector).filter(models.PetVector.pet_id == pet_id).delete()
    db.query(models.Match).filter(models.Match.pet_id == pet_id).delete()
    
    db.delete(pet)
    db.commit()
    return Response(status_code=204)

@router.get("/{pet_id}/photo")
async def get_pet_photo(pet_id: int, db: Session = Depends(get_db)):
    pet = db.query(models.Pet).filter(models.Pet.id == pet_id).first()
    if not pet or not pet.image_url:
        raise HTTPException(status_code=404, detail="Pet or photo not found")
    
    image_url_str = str(pet.image_url)

    if image_url_str.startswith('/static/'):
        # Handle local file
        file_path = Path("backend" + image_url_str)
        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Photo file not found on server")
        return FileResponse(file_path, media_type="image/jpeg", headers={"Cache-Control": "public, max-age=86400"})

    elif image_url_str.startswith('http'):
        # Handle external URL
        try:
            response = requests.get(image_url_str, stream=True, timeout=10)
            response.raise_for_status()
            content_type = response.headers.get('content-type', 'image/jpeg')
            return Response(content=response.content, media_type=content_type, headers={"Cache-Control": "public, max-age=86400"})
        except requests.exceptions.RequestException as e:
            raise HTTPException(status_code=400, detail=f"Failed to fetch external image: {e}")
            
    raise HTTPException(status_code=404, detail="Invalid image URL format")


