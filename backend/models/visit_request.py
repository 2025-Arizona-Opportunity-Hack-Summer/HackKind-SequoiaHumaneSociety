from sqlalchemy import Column, Integer, TIMESTAMP, Enum, ForeignKey
from sqlalchemy.orm import relationship
from backend.core.database import Base
import enum
from sqlalchemy.sql import func
from typing import Optional


class VisitRequestStatus(str, enum.Enum):
    Pending = "Pending"
    Confirmed = "Confirmed"
    Cancelled = "Cancelled"

class VisitRequest(Base):
    __tablename__ = "visit_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    pet_id = Column(Integer, ForeignKey("pets.id"), nullable=False)
    requested_at = Column(TIMESTAMP, nullable=False)
    status = Column(Enum(VisitRequestStatus), nullable=False, default=VisitRequestStatus.Pending)
    created_at = Column(TIMESTAMP, server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="visit_requests")
    pet = relationship("Pet", back_populates="visit_requests")

    def __repr__(self):
        return f"<VisitRequest(id={self.id}, user_id={self.user_id}, pet_id={self.pet_id}, status={self.status})>"
