from enum import Enum
from typing import Optional
from pydantic import BaseModel, ConfigDict, constr, HttpUrl
from typing_extensions import Annotated
from pydantic import field_validator

class PetSpecies(str, Enum):
    Dog = "Dog"
    Cat = "Cat"

class PetAgeGroup(str, Enum):
    NoPreference = "NoPreference"
    Baby = "Baby"
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

class PetBase(BaseModel):
    name: Annotated[str, constr(strip_whitespace=True, min_length=1, max_length=100)]
    age_group: PetAgeGroup
    sex: PetSex
    species: PetSpecies
    size: Optional[PetSize] = None
    energy_level: Optional[PetEnergyLevel] = None
    experience_level: Optional[ExperienceLevel] = None
    hair_length: Optional[HairLength] = None
    breed: Optional[Annotated[str, constr(strip_whitespace=True, min_length=1, max_length=100)]] = None
    allergy_friendly: Optional[bool] = None
    special_needs: Optional[bool] = None
    kid_friendly: Optional[bool] = None
    pet_friendly: Optional[bool] = None
    shelter_notes: Optional[Annotated[str, constr(strip_whitespace=True, max_length=1000)]] = None
    image_url: Optional[HttpUrl] = None
    summary: Optional[str] = None


    @field_validator("image_url", mode="before")
    @classmethod
    def convert_httpurl_to_str(cls, v):
        if v == "": 
            return None
        return str(v) if v is not None else None
    status: Optional[PetStatus] = PetStatus.Available

class PetCreate(PetBase):
    pass

class PetResponse(PetBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
    
class PetUpdate(BaseModel):
    name: Optional[str] = None
    age_group: Optional[PetAgeGroup] = None
    sex: Optional[PetSex] = None
    species: Optional[PetSpecies] = None
    size: Optional[PetSize] = None
    energy_level: Optional[PetEnergyLevel] = None
    experience_level: Optional[ExperienceLevel] = None
    hair_length: Optional[HairLength] = None
    allergy_friendly: Optional[bool] = None
    special_needs: Optional[bool] = None
    kid_friendly: Optional[bool] = None
    pet_friendly: Optional[bool] = None
    breed: Optional[str] = None
    shelter_notes: Optional[str] = None
    image_url: Optional[str] = None
    status: Optional[PetStatus] = None
