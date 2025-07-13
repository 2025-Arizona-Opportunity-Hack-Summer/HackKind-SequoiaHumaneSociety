import re
from datetime import datetime, timedelta
from typing import Dict, Optional, Union

from fastapi import APIRouter, Depends, Request, Response, status, Cookie
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from  core.config import settings
from  core.database import get_db
from  core.exceptions import (
    AuthenticationError,
    BadRequest,
    Conflict,
    InvalidTokenError,
    TokenExpiredError,
)
from  core.security import (
    create_access_token,
    create_refresh_token,
    get_password_hash,
    get_subject_from_token,
    verify_password,
)
from  models.user import User
from  schemas.auth_schema import TokenResponse, UserCreate, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()

# Cookie configuration for refresh token
REFRESH_TOKEN_COOKIE = "refresh_token"
COOKIE_CONFIG = {
    "path": "/api",  # Only send cookie to API routes
    "secure": settings.DEBUG is False,  # True in production with HTTPS, False in development
    "httponly": True,  # Protect against XSS
    "samesite": "strict" if settings.DEBUG else "none",  # Strict in development, None in production for cross-site
    "max_age": int(settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60),  # in seconds
    "domain": "localhost" if settings.DEBUG else None,  # Explicitly set domain for development
}

@router.get("/csrf/")
async def get_csrf_token(
    request: Request,
    response: Response,
    csrftoken: Optional[str] = Cookie(None),
):
    """
    Get a CSRF token. If no valid token exists in cookies, a new one will be generated.
    The token is set in both a cookie and returned in the response.
    """
    from  main import CSRFMiddleware  # Import here to avoid circular import
    
    # If we already have a valid token, return it
    if csrftoken:
        return {"csrftoken": csrftoken}
    
    # Generate a new token
    new_token = secrets.token_urlsafe(32)
    
    # Set the token in a cookie
    response.set_cookie(
        key="csrftoken",
        value=new_token,
        httponly=False,  # Allow JavaScript to read the cookie
        secure=not settings.DEBUG,
        samesite="lax",
        max_age=60 * 60 * 24 * 7,  # 7 days
        path="/",
    )
    
    return {"csrftoken": new_token}

# CORS settings for auth endpoints
def get_cors_headers(request=None):
    origin = request.headers.get('origin') if request else None
    allowed_origins = [
        "https://petmatch-hackkind.vercel.app",
        "https://hackkind-sequoiahumanesociety.vercel.app",
        "http://localhost:3000",
        "http://localhost:3001"
    ]
    
    # If request origin is in allowed origins, use it, otherwise use the first allowed origin
    origin = origin if origin in allowed_origins else allowed_origins[0]
    
    return {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS, DELETE",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-CSRF-Token",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "600",  # 10 minutes
    }

def _set_refresh_token_cookie(response: Response, token: str, expires: datetime) -> None:
    """Set the refresh token in an HTTP-only cookie."""
    # Create a copy of the config to avoid modifying the original
    cookie_config = COOKIE_CONFIG.copy()
    
    # In development, use more permissive settings
    if settings.DEBUG:
        cookie_config.update({
            "secure": False,  # Allow non-HTTPS in development
            "samesite": "lax",  # More permissive for local development
            "domain": None,  # Don't set domain for localhost
        })
    
    # Ensure path is always set
    cookie_config["path"] = "/"
    
    try:
        # Set the cookie
        response.set_cookie(
            key=REFRESH_TOKEN_COOKIE,
            value=token,
            expires=expires,
            **{k: v for k, v in cookie_config.items() if v is not None}
        )
        
    except Exception as e:
        raise

def _get_token_from_header(authorization: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Extract token from Authorization header."""
    if not authorization or not authorization.scheme.lower() == "bearer":
        raise AuthenticationError("Invalid authorization header")
    return authorization.credentials

@router.post("/login", response_model=TokenResponse)
async def login(
    request: Request,
    response: Response,
    credentials: dict,
    db: Session = Depends(get_db)
):
    """
    Authenticate user and return access token.
    Sets a refresh token in an HTTP-only cookie.
    """
    # Set CORS headers
    cors_headers = get_cors_headers(request)
    for key, value in cors_headers.items():
        response.headers[key] = value
    
    user = db.query(User).filter(User.email == credentials["email"]).first()
    if not user or not verify_password(credentials["password"], user.password_hash):
        raise AuthenticationError("Invalid email or password")
    
    # Create tokens
    access_token, access_expires = create_access_token(str(user.id))
    refresh_token, refresh_expires = create_refresh_token(str(user.id))
    
    # Set refresh token in HTTP-only cookie with proper CORS settings
    _set_refresh_token_cookie(response, refresh_token, refresh_expires)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_at": access_expires.isoformat(),
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "phone_number": user.phone_number,
        },
    }

@router.post("/refresh", response_model=Union[TokenResponse, Dict[str, str]])
@router.options("/refresh")  # Add OPTIONS handler for CORS preflight
async def refresh_token(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    """
    Refresh access token using a valid refresh token.
    The refresh token should be provided in an HTTP-only cookie.
    """
    # Set CORS headers first
    cors_headers = get_cors_headers(request)
    for key, value in cors_headers.items():
        response.headers[key] = value
    
    # Handle CORS preflight request
    if request.method == "OPTIONS":
        response.headers.update({
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
            "Access-Control-Max-Age": "600",  # 10 minutes
        })
        return Response(status_code=204, headers=dict(response.headers))
    
    # Check for refresh token in cookies
    refresh_token = request.cookies.get(REFRESH_TOKEN_COOKIE)
    
    if not refresh_token:
        # Return 401 with CORS headers and proper error response format
        response.status_code = status.HTTP_401_UNAUTHORIZED
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": "Refresh token is missing. Please log in again."},
            headers=dict(response.headers)
        )
    
    try:
        # Verify the refresh token
        user_id = get_subject_from_token(refresh_token, "refresh")
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise AuthenticationError("User not found")
        
        # Create new tokens
        access_token, access_expires = create_access_token(str(user.id))
        new_refresh_token, refresh_expires = create_refresh_token(str(user.id))
        
        # Update refresh token in cookie with secure settings
        _set_refresh_token_cookie(response, new_refresh_token, refresh_expires)
        
        # Add cache control headers
        response.headers["Cache-Control"] = "no-store"
        response.headers["Pragma"] = "no-cache"
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_at": access_expires.isoformat(),
            "user": {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role,
                "phone_number": user.phone_number,
            },
        }
        
    except (InvalidTokenError, TokenExpiredError) as e:
        # Clear the invalid refresh token
        response.delete_cookie(
            key=REFRESH_TOKEN_COOKIE,
            path=COOKIE_CONFIG["path"],
            secure=COOKIE_CONFIG["secure"],
            httponly=COOKIE_CONFIG["httponly"],
            samesite=COOKIE_CONFIG["samesite"]
        )
        
        # Return 401 with CORS headers and proper error response format
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": "Invalid or expired refresh token. Please log in again."},
            headers=dict(response.headers)
        )
        
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "An error occurred while refreshing the token"},
            headers=dict(response.headers)
        )
        raise AuthenticationError(str(e))

@router.post("/logout")
@router.options("/logout")  # Add OPTIONS handler for CORS preflight
async def logout(
    request: Request,
    response: Response
):
    """
    Log out the user by clearing the refresh token cookie.
    Handles CORS and ensures secure cookie deletion.
    """
    # Set CORS headers
    cors_headers = get_cors_headers(request)
    for key, value in cors_headers.items():
        response.headers[key] = value
    
    # Handle CORS preflight request
    if request.method == "OPTIONS":
        return Response(status_code=204, headers=dict(response.headers))
    
    # Clear the refresh token cookie with all necessary attributes
    response.delete_cookie(
        key=REFRESH_TOKEN_COOKIE,
        path=COOKIE_CONFIG["path"],
        secure=COOKIE_CONFIG["secure"],
        httponly=COOKIE_CONFIG["httponly"],
        samesite=COOKIE_CONFIG["samesite"]
    )
    
    return {"message": "Successfully logged out"}

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise Conflict("Email already registered")
    
    # Hash password and create user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        phone_number=user_data.phone_number,
        password_hash=hashed_password,
        role='adopter'  # Default role
    )
    
    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
    except Exception as e:
        db.rollback()
        raise BadRequest("Failed to create user") from e
    
    return {
        "id": new_user.id,
        "email": new_user.email,
        "full_name": new_user.full_name,
        "role": new_user.role,
        "phone_number": new_user.phone_number,
        "message": "User registered successfully"
    }