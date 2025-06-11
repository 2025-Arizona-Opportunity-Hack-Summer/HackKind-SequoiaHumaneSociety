from sqlalchemy import Column, Integer, TIMESTAMP, ForeignKey, ARRAY, Float
from backend.core.database import Base

class AdopterVector(Base):
    __tablename__ = "adopter_vectors"
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    vector = Column(ARRAY(Float), nullable=False)
    updated_at = Column(TIMESTAMP)
