from datetime import datetime
from pydantic import BaseModel, EmailStr
from typing import Optional
from pydantic import ConfigDict

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None

class UserOut(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    phone_number: Optional[str]
    role: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
