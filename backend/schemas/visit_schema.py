import datetime
from datetime import datetime, timezone
from pydantic import BaseModel, ConfigDict, field_validator
from  models.visit_request import VisitRequestStatus

class VisitRequestCreate(BaseModel):
    requested_at: datetime

    @field_validator("requested_at")
    @classmethod
    def check_future_datetime(cls, v: datetime) -> datetime:
        if v.tzinfo is None:
            v = v.replace(tzinfo=timezone.utc)
        if v <= datetime.now(timezone.utc):
            raise ValueError("Visit time must be in the future.")
        return v

class VisitStatusUpdate(BaseModel):
    new_status: VisitRequestStatus

class UserInfo(BaseModel):
    id: int
    full_name: str | None = None
    email: str | None = None
    phone_number: str | None = None

class PetInfo(BaseModel):
    id: int
    name: str
    breed: str | None = None
    image_url: str | None = None

class VisitRequestSchema(BaseModel):
    id: int
    user_id: int
    pet_id: int
    requested_at: datetime
    status: str
    user: UserInfo | None = None
    pet: PetInfo | None = None

    model_config = ConfigDict(from_attributes=True)