from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple

from jose import jwt, JWTError
from passlib.context import CryptContext

from backend.core.config import settings
from backend.core.exceptions import InvalidTokenError, TokenExpiredError

# Password hashing configuration
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Token configurations
ACCESS_TOKEN_EXPIRE_MINUTES = 15  # 15 minutes
REFRESH_TOKEN_EXPIRE_DAYS = 7  # 7 days
ALGORITHM = "HS256"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Generate password hash."""
    return pwd_context.hash(password)

def create_token(
    subject: str,
    expires_delta: timedelta,
    token_type: str = "access"
) -> str:
    """
    Create a JWT token with the given subject and expiration time.
    
    Args:
        subject: The subject of the token (usually user ID)
        expires_delta: Time until the token expires
        token_type: Type of token ('access' or 'refresh')
        
    Returns:
        str: Encoded JWT token
    """
    now = datetime.now(timezone.utc)
    expire = now + expires_delta
    to_encode = {
        "sub": str(subject),
        "type": token_type,
        "exp": expire,
        "iat": now,
    }
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=ALGORITHM
    )
    return encoded_jwt

def create_access_token(subject: str) -> Tuple[str, datetime]:
    """Create an access token that expires in 15 minutes."""
    expires_delta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    token = create_token(subject, expires_delta, "access")
    expires = datetime.now(timezone.utc) + expires_delta
    return token, expires

def create_refresh_token(subject: str) -> Tuple[str, datetime]:
    """Create a refresh token that expires in 7 days."""
    expires_delta = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    # Ensure we use timezone-aware datetime for cookie expiration
    token = create_token(subject, expires_delta, "refresh")
    expires = datetime.now(timezone.utc) + expires_delta
    return token, expires

def verify_token(token: str, token_type: str = "access") -> dict:
    """
    Verify a JWT token and return its payload if valid.
    
    Args:
        token: The JWT token to verify
        token_type: Expected token type ('access' or 'refresh')
        
    Returns:
        dict: The decoded token payload
        
    Raises:
        InvalidTokenError: If token is invalid or of wrong type
        TokenExpiredError: If token has expired
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[ALGORITHM],
            options={"require": ["exp", "iat", "sub", "type"]}
        )
        
        if payload["type"] != token_type:
            raise InvalidTokenError(f"Invalid token type. Expected {token_type}")
            
        return payload
        
    except jwt.ExpiredSignatureError:
        raise TokenExpiredError("Token has expired")
    except JWTError as e:
        raise InvalidTokenError(f"Invalid token: {str(e)}")

def get_subject_from_token(token: str, token_type: str = "access") -> str:
    """Extract subject from a token after validation."""
    payload = verify_token(token, token_type)
    return payload["sub"]