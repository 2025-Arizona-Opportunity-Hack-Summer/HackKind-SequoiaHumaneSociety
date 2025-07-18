from sqlalchemy import Column, Integer, TIMESTAMP, ForeignKey, ARRAY, Float
from  core.database import Base
from sqlalchemy.sql import func

class PetVector(Base):
    __tablename__ = "pet_vectors"
    pet_id = Column(Integer, ForeignKey("pets.id"), primary_key=True)
    vector = Column(ARRAY(Float), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now())
