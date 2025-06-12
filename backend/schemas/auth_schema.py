import phonenumbers
from pydantic import BaseModel, EmailStr, field_validator, ConfigDict, constr
from typing import Annotated
from backend.models.user import UserRole

class MyModel(BaseModel):
    some_field: str

    @field_validator("some_field")
    @classmethod
    def check(cls, v):
        return v 

class UserCreate(BaseModel):
    full_name: Annotated[str, constr(strip_whitespace=True, min_length=2, max_length=100)]
    email: EmailStr
    phone_number: Annotated[str, constr(strip_whitespace=True, min_length=10, max_length=20)]
    password: Annotated[str, constr(min_length=8)]
    role: UserRole

    @field_validator("phone_number")
    @classmethod
    def validate_phone_number(cls, v):
        try:
            parsed = phonenumbers.parse(v, "US")
            if not phonenumbers.is_valid_number(parsed):
                raise ValueError("Invalid phone number")
            return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
        except phonenumbers.NumberParseException:
            raise ValueError("Invalid phone number format. Include area code or use +country format.")

    model_config = ConfigDict(from_attributes=True)

class UserLogin(BaseModel):
    email: EmailStr
    password: Annotated[str, constr(min_length=8)]

    model_config = ConfigDict(from_attributes=True)
