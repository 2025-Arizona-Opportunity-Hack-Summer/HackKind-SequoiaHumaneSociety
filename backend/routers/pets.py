from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from typing import List
from sqlalchemy.orm import Session
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
    return pet

@router.delete("/{pet_id}", response_model=PetResponse)
def delete_pet(pet_id: int, db: Session = Depends(get_db)):
    pet = db.query(models.Pet).filter(models.Pet.id == pet_id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    db.delete(pet)
    db.commit()
    return pet

@router.post("/{pet_id}/photo", response_model=PetResponse)
def upload_pet_photo(pet_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    pet = db.query(models.Pet).filter(models.Pet.id == pet_id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    if not file.filename.endswith((".jpg", ".jpeg", ".png")):
        raise HTTPException(status_code=400, detail="Invalid file type")

    image_url = upload_pet_photo_local(file.file, pet_id, file.filename)

    pet.image_url = image_url
    db.commit()
    db.refresh(pet)
    return pet

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

    for key, value in pet_update.model_dump(exclude_unset=True).items():
        setattr(pet, key, value)

    if pet_update.status and pet_update.status != "Available":
        db.query(PetVector).filter_by(pet_id=pet_id).delete()

    db.commit()
    db.refresh(pet)

    if pet.status == "Adopted":
        db.query(Match).filter_by(pet_id=pet_id).delete()
        db.commit()

    return pet

