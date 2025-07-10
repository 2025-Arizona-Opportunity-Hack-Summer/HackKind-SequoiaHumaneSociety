from sqlalchemy import Column, Integer, Boolean, Enum, TIMESTAMP, ForeignKey
from  core.database import Base
import enum
from sqlalchemy.sql import func

class PetSpecies(str, enum.Enum):
    NoPreference = "NoPreference"
    Dog = "Dog"
    Cat = "Cat"

class PetPurpose(str, enum.Enum):
    Myself = "Myself"
    MyFamily = "MyFamily"

class OwnershipExperience(str, enum.Enum):
    FirstTime = "FirstTime"
    HadBefore = "HadBefore"
    CurrentlyHave = "CurrentlyHave"

class PetAgeGroup(str, enum.Enum):
    NoPreference = "NoPreference"
    Baby = "Baby"
    Young = "Young"
    Adult = "Adult"
    Senior = "Senior"

class PreferredSex(str, enum.Enum):
    NoPreference = "NoPreference"
    Female = "Female"
    Male = "Male"

class PreferredSize(str, enum.Enum):
    NoPreference = "NoPreference"
    Small = "Small"
    Medium = "Medium"
    Large = "Large"
    ExtraLarge = "ExtraLarge"

class PetEnergyLevel(str, enum.Enum):
    NoPreference = "NoPreference"
    LapPet = "LapPet"
    Calm = "Calm"
    Moderate = "Moderate"
    VeryActive = "VeryActive"

class HairLength(str, enum.Enum):
    NoPreference = "NoPreference"
    Short = "Short"
    Medium = "Medium"
    Long = "Long"

class UserPreferences(Base):
    __tablename__ = "user_preferences"
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    preferred_species = Column(Enum(PetSpecies))
    pet_purpose = Column(Enum(PetPurpose))
    has_children = Column(Boolean, default=False)
    has_dogs = Column(Boolean, default=False)
    has_cats = Column(Boolean, default=False)
    ownership_experience = Column(Enum(OwnershipExperience))
    preferred_age = Column(Enum(PetAgeGroup))
    preferred_sex = Column(Enum(PreferredSex))
    preferred_size = Column(Enum(PreferredSize))
    preferred_energy_level = Column(Enum(PetEnergyLevel))
    preferred_hair_length = Column(Enum(HairLength))
    wants_allergy_friendly = Column(Boolean)
    accepts_special_needs = Column(Boolean)
    created_at = Column(TIMESTAMP, server_default=func.now())

