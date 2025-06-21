from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Response, Form
from typing import List, Optional
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
from backend.core.dependencies import get_optional_user, get_current_user
from backend.models.user import User, UserRole
from backend.models.pet import Pet
from backend.models.pet_vector import PetVector
from backend.models.match import Match
from backend.logic.matching_logic import build_pet_vector
from backend.models.pet_training_traits import PetTrainingTrait


router = APIRouter(prefix="/pets", tags=["Pets"])

@router.get("/", response_model=List[PetResponse])
def read_pets(
    skip: int = 0, 
    limit: int = 100,  # Increased default limit to return more pets
    status: str = None,  # Optional status filter
    db: Session = Depends(get_db),
    current_user: User = Depends(get_optional_user)
):
    query = db.query(models.Pet)
    
    # If status is provided, filter by status
    if status:
        query = query.filter(models.Pet.status == status)
    # If no status provided and user is not admin (or not logged in), show only available pets
    elif current_user is None or current_user.role != UserRole.Admin:
        query = query.filter(models.Pet.status == "Available")
    
    # Apply pagination
    return query.offset(skip).limit(limit).all()

@router.get("/{pet_id}", response_model=PetResponse)
def read_pet(pet_id: int, db: Session = Depends(get_db)):
    pet = db.query(models.Pet).filter(models.Pet.id == pet_id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    return pet

@router.post("/", response_model=PetResponse)
async def create_pet(
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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if user is admin
    if current_user.role != UserRole.Admin:
        raise HTTPException(status_code=403, detail="Only admins can create pets")
    
    try:
        # Handle file upload if present
        image_url = None
        if image and image.filename:
            try:
                # Ensure we're at the start of the file
                await image.seek(0)
                # Upload the image
                image_url = await upload_pet_photo_local(image, 0, image.filename)  # 0 is a temporary ID
                # Close the file
                await image.close()
            except Exception as e:
                print(f"Error uploading image: {str(e)}")
                # Continue without image if upload fails
        
        # Create pet data dictionary
        pet_data = {
            "name": name,
            "age_group": age_group,
            "sex": sex,
            "species": species,
            "size": size,
            "energy_level": energy_level,
            "experience_level": experience_level,
            "hair_length": hair_length,
            "breed": breed,
            "allergy_friendly": allergy_friendly,
            "special_needs": special_needs,
            "kid_friendly": kid_friendly,
            "pet_friendly": pet_friendly,
            "shelter_notes": shelter_notes,
            "status": status,
            "image_url": image_url
        }
        
        # Create the pet
        db_pet = models.Pet(**{k: v for k, v in pet_data.items() if v is not None})
        db.add(db_pet)
        db.commit()
        db.refresh(db_pet)
        
        # If we have an image URL, update the pet with the correct ID in the URL
        if image_url and "0" in image_url:
            new_image_url = image_url.replace("pet_0_", f"pet_{db_pet.id}_")
            db_pet.image_url = new_image_url
            db.commit()
            db.refresh(db_pet)
        
        try:
            # Create pet vector
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
        
    except Exception as e:
        db.rollback()
        print(f"Error creating pet: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create pet: {str(e)}")

@router.put("/{pet_id}", response_model=PetResponse)
async def update_pet(
    pet_id: int,
    name: str = Form(None),
    age_group: str = Form(None),
    sex: str = Form(None),
    species: str = Form(None),
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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if user is admin
    if current_user.role != UserRole.Admin:
        raise HTTPException(status_code=403, detail="Only admins can update pets")
    
    pet = db.query(models.Pet).filter(models.Pet.id == pet_id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    try:
        # Handle file upload if present
        if image and image.filename:
            try:
                await image.seek(0)
                image_url = await upload_pet_photo_local(image, pet_id, image.filename)
                await image.close()
                pet.image_url = image_url
            except Exception as e:
                print(f"Error updating pet image: {str(e)}")
                # Continue without updating the image if upload fails
        
        # Update pet fields
        update_data = {
            "name": name,
            "age_group": age_group,
            "sex": sex,
            "species": species,
            "size": size,
            "energy_level": energy_level,
            "experience_level": experience_level,
            "hair_length": hair_length,
            "breed": breed,
            "allergy_friendly": allergy_friendly,
            "special_needs": special_needs,
            "kid_friendly": kid_friendly,
            "pet_friendly": pet_friendly,
            "shelter_notes": shelter_notes,
            "status": status
        }
        
        # Only update fields that were provided
        for key, value in update_data.items():
            if value is not None:
                setattr(pet, key, value)
        
        db.commit()
        db.refresh(pet)
        
        # Update pet vector
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
        
    except Exception as e:
        db.rollback()
        print(f"Error updating pet: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update pet: {str(e)}")
    
    return pet

@router.delete("/{pet_id}", response_model=PetResponse)
def delete_pet(pet_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role.lower() != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete pets")
        
    pet = db.query(models.Pet).filter(models.Pet.id == pet_id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    # Delete related records first
    db.query(models.PetTrainingTrait).filter(models.PetTrainingTrait.pet_id == pet_id).delete()
    db.query(models.PetVector).filter(models.PetVector.pet_id == pet_id).delete()
    db.query(models.Match).filter(models.Match.pet_id == pet_id).delete()
    
    # Now delete the pet
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
async def upload_pet_photo(
    pet_id: int, 
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) 
):
    pet = db.query(models.Pet).filter(models.Pet.id == pet_id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    if current_user.role != UserRole.Admin:
        raise HTTPException(status_code=403, detail="Only admins can upload pet photos")
    
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    try:
        # Read the file content once
        file_content = await file.read()
        
        # Create a BytesIO object from the content
        from io import BytesIO
        file_obj = BytesIO(file_content)
        
        # Upload the file using our local function
        file_url = upload_pet_photo_local(file_obj, pet_id, file.filename)
        
        # Update the pet record
        pet.image_url = file_url
        db.commit()
        db.refresh(pet)
        
        return {"message": "Photo uploaded successfully", "image_url": file_url}
        
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        db.rollback()
        error_detail = "Failed to process the uploaded file. Please try again with a different image."
        if hasattr(e, 'detail'):
            error_detail = str(e.detail)
        elif hasattr(e, 'args') and e.args:
            error_detail = str(e.args[0])
        
        raise HTTPException(
            status_code=500 if not isinstance(e, HTTPException) else e.status_code,
            detail=error_detail
        )

@router.patch("/{pet_id}", response_model=PetResponse)
def update_pet(
    pet_id: int,
    pet_update: PetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role.lower() != "admin":
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


