import os
from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from typing import Union
from fastapi.openapi.utils import get_openapi
from fastapi.security import OAuth2PasswordBearer
from logic.scheduler import start_scheduler
from fastapi.staticfiles import StaticFiles
from  rate_limiter import apply_rate_limiting
from  core.config import settings
import secrets
from fastapi.middleware import Middleware
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.types import ASGIApp, Message
from starlette.datastructures import MutableHeaders
from starlette.responses import Response as StarletteResponse
from starlette.types import ASGIApp, Receive, Scope, Send
from  routers import (
    auth_router,
    user_profile_router,
    preferences_router,
    training_traits_router,
    pets_router,
    pet_training_traits_router,
    matching_router,
    visit_requests_router,
    admin_visit_requests_router
)

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.security_headers = {
            # Prevent MIME type sniffing
            "X-Content-Type-Options": "nosniff",
            # Prevent clickjacking
            "X-Frame-Options": "DENY",
            # Enforce secure connections (HTTPS)
            "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
            # Content Security Policy
            "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;",
            # Control referrer information
            "Referrer-Policy": "strict-origin-when-cross-origin",
            # Feature policy
            "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
            # XSS protection (legacy but still useful for older browsers)
            "X-XSS-Protection": "1; mode=block",
            # Prevent browsers from embedding resources from this site in other sites
            "Cross-Origin-Embedder-Policy": "require-corp",
            "Cross-Origin-Opener-Policy": "same-origin",
            "Cross-Origin-Resource-Policy": "same-site"
        }

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response = await call_next(request)
        # Don't override headers if they're already set
        for header, value in self.security_headers.items():
            if header not in response.headers:
                response.headers[header] = value
        return response


class CSRFMiddleware:
    def __init__(
        self,
        app: ASGIApp,
        secret: str = None,
        cookie_name: str = "csrftoken",
        header_name: str = "X-CSRF-Token",
        safe_methods: set = None,
        cookie_secure: bool = True,
        cookie_http_only: bool = True,
        cookie_same_site: str = "lax",
    ) -> None:
        self.app = app
        self.secret = secret or settings.SECRET_KEY
        self.cookie_name = cookie_name
        self.header_name = header_name
        self.safe_methods = safe_methods or {"GET", "HEAD", "OPTIONS", "TRACE"}
        self.cookie_secure = cookie_secure
        self.cookie_http_only = cookie_http_only
        self.cookie_same_site = cookie_same_site

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            return await self.app(scope, receive, send)

        request = Request(scope, receive)
        csrf_token = request.cookies.get(self.cookie_name)

        # Generate new CSRF token if not present
        if not csrf_token:
            csrf_token = secrets.token_urlsafe(32)

        # Skip CSRF check for safe methods
        if request.method in self.safe_methods:
            return await self._process_request(scope, receive, send, csrf_token)

        # Get token from header or form data
        header_token = request.headers.get(self.header_name)
        form_data = await request.form()
        form_token = form_data.get("csrf_token")
        
        # Verify CSRF token
        if not (header_token and header_token == csrf_token) and not (form_token and form_token == csrf_token):
            response = StarletteResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content="CSRF token validation failed"
            )
            await response(scope, receive, send)
            return

        # Process the request if CSRF check passes
        return await self._process_request(scope, receive, send, csrf_token)

    async def _process_request(self, scope: Scope, receive: Receive, send: Send, csrf_token: str) -> None:
        async def send_with_csrf_cookie(message: Message) -> None:
            if message["type"] == "http.response.start":
                if "set-cookie" not in message.get("headers", {}):
                    headers = MutableHeaders(scope=message)
                    headers.append(
                        "Set-Cookie",
                        self._get_csrf_cookie(csrf_token)
                    )
            await send(message)

        await self.app(scope, receive, send_with_csrf_cookie)

    def _get_csrf_cookie(self, token: str) -> str:
        cookie_parts = [
            f"{self.cookie_name}={token}",
            f"Max-Age={60 * 60 * 24 * 7}",  # 7 days
            f"Path=/",
        ]
        
        if self.cookie_secure:
            cookie_parts.append("Secure")
        if self.cookie_http_only:
            cookie_parts.append("HttpOnly")
        if self.cookie_same_site:
            cookie_parts.append(f"SameSite={self.cookie_same_site}")
            
        return "; ".join(cookie_parts)

# Configure CORS
cors_origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    # Add production domains here
]

# Ensure all origins are properly formatted
cors_origins = [origin.rstrip('/') for origin in cors_origins]

# Add regex pattern for localhost with any port
cors_origin_regex = r"^https?://(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$"

# List of paths that should be excluded from CSRF protection
csrf_exempt_paths = {
    "/api/auth/login",
    "/api/auth/refresh",
    "/api/auth/register",
    "/api/auth/logout",
    "/api/docs",
    "/api/openapi.json",
    "/api/redoc",
    "/openapi.json",
    "/api/pets",
    "/api/pets/"
}

class CSRFExemptMiddleware(CSRFMiddleware):
    """Extends CSRFMiddleware to exclude certain paths."""
    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] == "http":
            # Skip CSRF for excluded paths
            path = scope.get("path", "")
            if path in csrf_exempt_paths or path.startswith("/api/pets"):
                await self.app(scope, receive, send)
                return
        await super().__call__(scope, receive, send)

# Configure middleware
middleware = [
    # CORS middleware should be first to handle OPTIONS requests
    Middleware(
        CORSMiddleware,
        allow_origins=["https://hackkind-shs-copy.vercel.app/"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    ),
    
    # Security headers middleware
    Middleware(SecurityHeadersMiddleware),
    
    # CSRF protection (must come after CORS)
    Middleware(
        CSRFExemptMiddleware,
        cookie_secure=not settings.DEBUG,  # Only send over HTTPS in production
        cookie_same_site="lax",  # Use 'lax' for both dev and prod for better compatibility
        cookie_http_only=False,  # Allow JavaScript to access the cookie
        safe_methods={"GET", "HEAD", "OPTIONS", "TRACE"},
    ),
]

app = FastAPI(middleware=middleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app = apply_rate_limiting(app)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title="Pet Matchmaker API",
        version="1.0.0",
        description="API For Sequoia Humane Society Matchmaking App",
        routes=app.routes,
    )
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT"
        }
    }
    for path in openapi_schema["paths"].values():
        for method in path.values():
            method.setdefault("security", [{"BearerAuth": []}])
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

app.include_router(auth_router, prefix="/api")
app.include_router(user_profile_router, prefix="/api")
app.include_router(preferences_router, prefix="/api")
app.include_router(training_traits_router, prefix="/api")
app.include_router(pets_router, prefix="/api")
app.include_router(pet_training_traits_router, prefix="/api")
app.include_router(matching_router, prefix="/api")
app.include_router(visit_requests_router, prefix="/api")
app.include_router(admin_visit_requests_router, prefix="/api")

@app.get("/")
async def read_root():
    return {"Hello": "World"}

@app.get("/items/{item_id}")
async def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}    

app.mount("/static", StaticFiles(directory=os.path.join("backend", "static")), name="static")

start_scheduler()