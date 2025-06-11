from sqlalchemy import Column, Integer, Enum, TIMESTAMP, ForeignKey
from backend.core.database import Base
import enum
from sqlalchemy.sql import func


class TrainingTrait(str, enum.Enum):
    HouseTrained = "HouseTrained"
    LitterTrained = "LitterTrained"

class PetTrainingTrait(Base):
    __tablename__ = "pet_training_traits"
    pet_id = Column(Integer, ForeignKey("pets.id"), primary_key=True)
    trait = Column(Enum(TrainingTrait), primary_key=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

