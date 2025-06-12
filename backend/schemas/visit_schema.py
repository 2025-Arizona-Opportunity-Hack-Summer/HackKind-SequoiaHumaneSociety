import datetime
from datetime import datetime, timezone
from typing import List
from pydantic import BaseModel, ConfigDict, field_validator
from backend.models.visit_request import VisitRequestStatus

class VisitRequestCreate(BaseModel):
    requested_at: datetime

    @field_validator("requested_at")
    @classmethod
    def check_future_datetime(cls, v: datetime) -> datetime:
        # Ensure v is timezone-aware
        if v.tzinfo is None:
            v = v.replace(tzinfo=timezone.utc)
        # Now safe to compare
        if v <= datetime.now(timezone.utc):
            raise ValueError("Visit time must be in the future.")
        return v

class VisitStatusUpdate(BaseModel):
    new_status: VisitRequestStatus

class VisitRequestSchema(BaseModel):
    id: int
    user_id: int
    pet_id: int
    requested_at: datetime
    status: str

    model_config = ConfigDict(from_attributes=True)