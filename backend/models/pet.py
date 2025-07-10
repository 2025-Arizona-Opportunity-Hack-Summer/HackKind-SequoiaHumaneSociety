from sqlalchemy import Column, Integer, String, Boolean, Text, Enum, TIMESTAMP, ForeignKey
from sqlalchemy.orm import relationship
from  core.database import Base
import enum
from sqlalchemy.sql import func

class PetSpecies(str, enum.Enum):
    Dog = "Dog"
    Cat = "Cat"

class PetAgeGroup(str, enum.Enum):
    NoPreference = "NoPreference"
    Baby = "Baby"
    Young = "Young"
    Adult = "Adult"
    Senior = "Senior"

class PetSex(str, enum.Enum):
    Male = "Male"
    Female = "Female"

class PetSize(str, enum.Enum):
    Small = "Small"
    Medium = "Medium"
    Large = "Large"
    ExtraLarge = "ExtraLarge"

class PetEnergyLevel(str, enum.Enum):
    LapPet = "LapPet"
    Calm = "Calm"
    Moderate = "Moderate"
    VeryActive = "VeryActive"

class ExperienceLevel(str, enum.Enum):
    Beginner = "Beginner"
    Intermediate = "Intermediate"
    Advanced = "Advanced"

class HairLength(str, enum.Enum):
    Short = "Short"
    Medium = "Medium"
    Long = "Long"

class PetStatus(str, enum.Enum):
    Available = "Available"
    Pending = "Pending"
    Adopted = "Adopted"

class Pet(Base):
    __tablename__ = "pets"
    
    visit_requests = relationship("VisitRequest", back_populates="pet")
    
    def __repr__(self):
        return f"<Pet(id={self.id}, name={self.name}, species={self.species})>"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    species = Column(Enum(PetSpecies), nullable=False)
    breed = Column(String)
    age_group = Column(Enum(PetAgeGroup), nullable=False)
    sex = Column(Enum(PetSex), nullable=False)
    size = Column(Enum(PetSize))
    energy_level = Column(Enum(PetEnergyLevel))
    experience_level = Column(Enum(ExperienceLevel))
    hair_length = Column(Enum(HairLength))
    allergy_friendly = Column(Boolean)
    special_needs = Column(Boolean)
    kid_friendly = Column(Boolean)
    pet_friendly = Column(Boolean)
    shelter_notes = Column(Text)
    image_url = Column(Text)
    summary = Column(Text)
    status = Column(Enum(PetStatus), default=PetStatus.Available)
    created_at = Column(TIMESTAMP, server_default=func.now())