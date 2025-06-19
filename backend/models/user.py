from sqlalchemy import Column, Integer, String, Text, Enum, TIMESTAMP
from sqlalchemy.orm import relationship
from backend.core.database import Base
import enum
from sqlalchemy.sql import func

class UserRole(str, enum.Enum):
    Adopter = "Adopter"
    Admin = "Admin"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    full_name = Column(String)
    phone_number = Column(String(20))
    role = Column(Enum(UserRole), default=UserRole.Adopter)
    created_at = Column(TIMESTAMP, server_default=func.now())
    
    # Relationships
    visit_requests = relationship("VisitRequest", back_populates="user")
    
    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"
