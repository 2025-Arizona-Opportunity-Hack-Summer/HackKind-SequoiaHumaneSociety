from sqlalchemy import Column, Integer, Float, TIMESTAMP, ForeignKey, UniqueConstraint
from backend.core.database import Base
from sqlalchemy.sql import func

class Match(Base):
    __tablename__ = "matches"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    pet_id = Column(Integer, ForeignKey("pets.id"))
    match_score = Column(Float, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    __table_args__ = (
        UniqueConstraint("user_id", "pet_id"),
    )
