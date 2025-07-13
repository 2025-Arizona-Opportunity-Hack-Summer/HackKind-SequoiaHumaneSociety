from datetime import datetime
from typing import Annotated, Optional

import phonenumbers
from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    constr,
    field_validator,
    model_validator,
)

from  models.user import UserRole

__all__ = [
    'TokenBase',
    'TokenResponse',
    'UserBase',
    'UserCreate',
    'UserLogin',
    'UserResponse',
    'RefreshTokenRequest',
]

PASSWORD_MIN_LENGTH = 8
PASSWORD_MAX_LENGTH = 128
PASSWORD_PATTERN = r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]"

NAME_MIN_LENGTH = 2
NAME_MAX_LENGTH = 100

PHONE_MIN_LENGTH = 10
PHONE_MAX_LENGTH = 20


class TokenBase(BaseModel):
    """Base token model with common fields."""
    access_token: str
    token_type: str = "bearer"
    expires_at: datetime


class TokenResponse(TokenBase):
    """Response model for authentication endpoints."""
    user: dict


class UserBase(BaseModel):
    """Base user model with common fields."""
    email: EmailStr = Field(..., description="User's email address")
    full_name: Annotated[
        str,
        constr(
            strip_whitespace=True,
            min_length=NAME_MIN_LENGTH,
            max_length=NAME_MAX_LENGTH,
        ),
    ]
    phone_number: Annotated[
        str,
        constr(
            strip_whitespace=True,
            min_length=PHONE_MIN_LENGTH,
            max_length=PHONE_MAX_LENGTH,
        ),
    ]

    @field_validator("phone_number")
    @classmethod
    def validate_phone_number(cls, v: str) -> str:
        """Validate and format phone number using phonenumbers library."""
        try:
            parsed = phonenumbers.parse(v, "US")
            if not phonenumbers.is_valid_number(parsed):
                raise ValueError("Invalid phone number")
            return phonenumbers.format_number(
                parsed, phonenumbers.PhoneNumberFormat.E164
            )
        except phonenumbers.NumberParseException as e:
            raise ValueError(
                "Invalid phone number format. Include area code or use +country format."
            ) from e


class UserCreate(UserBase):
    """Schema for creating a new user."""
    password: Annotated[
        str,
        constr(
            min_length=PASSWORD_MIN_LENGTH,
            max_length=PASSWORD_MAX_LENGTH,
            pattern=PASSWORD_PATTERN,
        ),
    ] = Field(
        ...,
        description=(
            "Password must be 8-128 characters long and include "
            "at least one uppercase letter, one lowercase letter, "
            "one number and one special character (@$!%*?&)"
        ),
    )
    role: UserRole = Field(
        default=UserRole.Adopter,
        description="User role (default: adopter)",
    )

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        """Sanitize and validate full name."""
        sanitized = "".join(c for c in v if c.isalpha() or c.isspace() or c in "'-.")
        sanitized = " ".join(sanitized.split()) 
        if len(sanitized) < NAME_MIN_LENGTH:
            raise ValueError("Name is too short")
        if len(sanitized) > NAME_MAX_LENGTH:
            sanitized = sanitized[:NAME_MAX_LENGTH].rstrip()
        return sanitized


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: Annotated[
        str,
        constr(
            min_length=PASSWORD_MIN_LENGTH,
            max_length=PASSWORD_MAX_LENGTH,
        ),
    ]

    @model_validator(mode="after")
    def validate_credentials(self) -> "UserLogin":
        """Additional validation for login credentials."""
        return self


class UserResponse(UserBase):
    """Response model for user data (without sensitive information)."""
    id: int
    role: UserRole
    message: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class RefreshTokenRequest(BaseModel):
    """Schema for refresh token request."""
    refresh_token: str
