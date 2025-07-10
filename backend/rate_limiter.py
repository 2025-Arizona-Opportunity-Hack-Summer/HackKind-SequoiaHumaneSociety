from typing import Optional, Dict, Any, Callable, Awaitable, List, Tuple
from fastapi import Request, HTTPException, status, Depends
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.extension import _rate_limit_exceeded_handler
from functools import wraps
import os
import time
from redis import Redis
from redis.asyncio import Redis as AsyncRedis
from  core.config import settings

# Initialize Redis connection
redis_url = settings.REDIS_URL
redis_client = AsyncRedis.from_url(redis_url, decode_responses=True)

# Initialize rate limiter
limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=redis_url,
    storage_options={"socket_connect_timeout": 30},
    headers_enabled=True,
    in_memory_fallback_enabled=True
)

def get_user_identifier(request: Request) -> str:
    """
    Get user identifier from JWT token if authenticated, otherwise use IP address.
    """
    # First try to get the user ID from the request state (set by auth middleware)
    user_id = request.state.user_id if hasattr(request.state, 'user_id') else None
    
    # If no user ID, fall back to IP address
    if not user_id:
        return get_remote_address(request)
    return f"user:{user_id}"

# Custom rate limit exceeded handler
async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={"detail": "Too many requests, please try again later."},
        headers={"Retry-After": str(exc.retry_after) if hasattr(exc, 'retry_after') else '60'},
    )

# Rate limit storage
rate_limits = {}

def check_rate_limit(identifier: str, limit: str) -> bool:
    """Check if the request is within rate limit."""
    now = time.time()
    window = 60  # 1 minute window
    
    try:
        count, last_time = rate_limits.get(identifier, (0, 0))
    except Exception:
        count, last_time = 0, 0
    
    # Reset counter if window has passed
    if now - last_time > window:
        count = 0
    
    # Check if limit is exceeded
    max_requests = int(limit.split('/')[0])
    if count >= max_requests:
        return False
    
    # Update counter
    rate_limits[identifier] = (count + 1, now)
    return True

def apply_rate_limiting(app):
    """Apply rate limiting to the FastAPI application."""
    # Override the default rate limit exceeded handler
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)
    
    # Apply global rate limiting to all endpoints
    @app.middleware("http")
    async def rate_limit_middleware(request: Request, call_next):
        # Skip rate limiting for the OpenAPI docs
        if request.url.path in ["/docs", "/openapi.json"]:
            return await call_next(request)
        
        # Get the appropriate rate limit
        limit = "100"  # Default limit per minute
        identifier = get_user_identifier(request)
        
        # Apply stricter rate limits to auth endpoints
        if request.url.path in ["/api/auth/login", "/api/auth/register"]:
            limit = "10"  # Stricter limit for auth endpoints
            identifier = get_remote_address(request)  # Use IP for auth endpoints
        
        # Check rate limit
        if not check_rate_limit(f"{request.url.path}:{identifier}", limit):
            return await rate_limit_exceeded_handler(
                request, 
                RateLimitExceeded("Rate limit exceeded")
            )
        
        return await call_next(request)
    
    return app
