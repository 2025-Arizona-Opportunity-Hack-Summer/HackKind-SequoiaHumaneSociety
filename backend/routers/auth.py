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

REFRESH_TOKEN_COOKIE = "refresh_token"
COOKIE_CONFIG = {
    "path": "/api",
    "secure": settings.DEBUG is False,
    "httponly": True,
    "samesite": "strict" if settings.DEBUG else "none",
    "max_age": int(settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60),
    "domain": "localhost" if settings.DEBUG else None,
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
    from  main import CSRFMiddleware
    
    if csrftoken:
        return {"csrftoken": csrftoken}
    
    new_token = secrets.token_urlsafe(32)
    
    response.set_cookie(
        key="csrftoken",
        value=new_token,
        httponly=False,
        secure=not settings.DEBUG,
        samesite="lax",
        max_age=60 * 60 * 24 * 7,
        path="/",
    )
    
    return {"csrftoken": new_token}

def get_cors_headers(request=None):
    origin = request.headers.get('origin') if request else None
    allowed_origins = [
        "https://petmatch-hackkind.vercel.app",
        "https://hackkind-sequoiahumanesociety.vercel.app",
        "http://localhost:3000",
        "http://localhost:3001"
    ]
    
    origin = origin if origin in allowed_origins else allowed_origins[0]
    
    return {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS, DELETE",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-CSRF-Token",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "600",
    }

def _set_refresh_token_cookie(response: Response, token: str, expires: datetime) -> None:
    """Set the refresh token in an HTTP-only cookie."""
    cookie_config = COOKIE_CONFIG.copy()
    
    if settings.DEBUG:
        cookie_config.update({
            "secure": False,
            "samesite": "lax",
            "domain": None,
        })
    
    cookie_config["path"] = "/"
    
    try:
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
    cors_headers = get_cors_headers(request)
    for key, value in cors_headers.items():
        response.headers[key] = value
    
    user = db.query(User).filter(User.email == credentials["email"]).first()
    if not user or not verify_password(credentials["password"], user.password_hash):
        raise AuthenticationError("Invalid email or password")
    
    access_token, access_expires = create_access_token(str(user.id))
    refresh_token, refresh_expires = create_refresh_token(str(user.id))
    
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
@router.options("/refresh")
async def refresh_token(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    """
    Refresh access token using a valid refresh token.
    The refresh token should be provided in an HTTP-only cookie.
    """
    cors_headers = get_cors_headers(request)
    for key, value in cors_headers.items():
        response.headers[key] = value
    
    if request.method == "OPTIONS":
        response.headers.update({
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
            "Access-Control-Max-Age": "600",
        })
        return Response(status_code=204, headers=dict(response.headers))
    
    refresh_token = request.cookies.get(REFRESH_TOKEN_COOKIE)
    
    if not refresh_token:
        response.status_code = status.HTTP_401_UNAUTHORIZED
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={"detail": "Refresh token is missing. Please log in again."},
            headers=dict(response.headers)
        )
    
    try:
        user_id = get_subject_from_token(refresh_token, "refresh")
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise AuthenticationError("User not found")
        
        access_token, access_expires = create_access_token(str(user.id))
        new_refresh_token, refresh_expires = create_refresh_token(str(user.id))
        
        _set_refresh_token_cookie(response, new_refresh_token, refresh_expires)
        
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
        response.delete_cookie(
            key=REFRESH_TOKEN_COOKIE,
            path=COOKIE_CONFIG["path"],
            secure=COOKIE_CONFIG["secure"],
            httponly=COOKIE_CONFIG["httponly"],
            samesite=COOKIE_CONFIG["samesite"]
        )
        
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
@router.options("/logout")
async def logout(
    request: Request,
    response: Response
):
    """
    Log out the user by clearing the refresh token cookie.
    Handles CORS and ensures secure cookie deletion.
    """
    cors_headers = get_cors_headers(request)
    for key, value in cors_headers.items():
        response.headers[key] = value
    
    if request.method == "OPTIONS":
        return Response(status_code=204, headers=dict(response.headers))
    
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
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise Conflict("Email already registered")
    
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        phone_number=user_data.phone_number,
        password_hash=hashed_password,
        role='adopter'
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