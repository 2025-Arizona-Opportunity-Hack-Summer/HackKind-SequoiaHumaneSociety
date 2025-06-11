from sqlalchemy import Column, Integer, TIMESTAMP, Enum, ForeignKey
from backend.core.database import Base
import enum
from sqlalchemy.sql import func


class VisitRequestStatus(str, enum.Enum):
    Pending = "Pending"
    Confirmed = "Confirmed"
    Cancelled = "Cancelled"

class VisitRequest(Base):
    __tablename__ = "visit_requests"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    pet_id = Column(Integer, ForeignKey("pets.id"))
    requested_at = Column(TIMESTAMP, nullable=False)
    status = Column(Enum(VisitRequestStatus), default=VisitRequestStatus.Pending)
    created_at = Column(TIMESTAMP, server_default=func.now())

