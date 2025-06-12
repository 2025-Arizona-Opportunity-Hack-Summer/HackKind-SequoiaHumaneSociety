from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from typing import List, Optional
from pydantic import BaseModel
from enum import Enum
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend import models
from pydantic import BaseModel, ConfigDict


router = APIRouter(prefix="/pets", tags=["Pets"])

# Enums to match your SQLAlchemy model
class PetSpecies(str, Enum):
    Dog = "Dog"
    Cat = "Cat"

class PetAgeGroup(str, Enum):
    NoPreference = "NoPreference"
    Puppy = "Puppy"
    Kitten = "Kitten"
    Young = "Young"
    Adult = "Adult"
    Senior = "Senior"

class PetSex(str, Enum):
    Male = "Male"
    Female = "Female"

class PetSize(str, Enum):
    Small = "Small"
    Medium = "Medium"
    Large = "Large"
    ExtraLarge = "ExtraLarge"

class PetEnergyLevel(str, Enum):
    LapPet = "LapPet"
    Calm = "Calm"
    Moderate = "Moderate"
    VeryActive = "VeryActive"

class ExperienceLevel(str, Enum):
    Beginner = "Beginner"
    Intermediate = "Intermediate"
    Advanced = "Advanced"

class HairLength(str, Enum):
    Short = "Short"
    Medium = "Medium"
    Long = "Long"

class PetStatus(str, Enum):
    Available = "Available"
    Pending = "Pending"
    Adopted = "Adopted"

# Pydantic Schemas
class PetBase(BaseModel):
    name: str
    age_group: PetAgeGroup
    sex: PetSex
    species: PetSpecies
    size: Optional[PetSize] = None
    energy_level: Optional[PetEnergyLevel] = None
    experience_level: Optional[ExperienceLevel] = None
    hair_length: Optional[HairLength] = None
    breed: Optional[str] = None
    allergy_friendly: Optional[bool] = None
    special_needs: Optional[bool] = None
    kid_friendly: Optional[bool] = None
    pet_friendly: Optional[bool] = None
    shelter_notes: Optional[str] = None
    image_url: Optional[str] = None
    status: Optional[PetStatus] = PetStatus.Available

class PetCreate(PetBase):
    pass

class PetResponse(PetBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# Routes
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
    db_pet = models.Pet(**pet.model_dump())
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

# Uploading pet photos logic

from backend.logic.image_uploader import upload_pet_photo_local

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