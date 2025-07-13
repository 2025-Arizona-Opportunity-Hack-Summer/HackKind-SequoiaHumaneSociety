import os
import secrets
from typing import Union
from fastapi import FastAPI, Request, Response, status
from fastapi.openapi.utils import get_openapi
from fastapi.security import OAuth2PasswordBearer
from fastapi.middleware import Middleware
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.types import ASGIApp, Message, Receive, Scope, Send
from starlette.datastructures import MutableHeaders
from starlette.responses import Response as StarletteResponse

from logic.scheduler import start_scheduler
from rate_limiter import apply_rate_limiting
from core.config import settings
from routers import (
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
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
            "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
            "X-XSS-Protection": "1; mode=block",
            "Cross-Origin-Embedder-Policy": "require-corp",
            "Cross-Origin-Opener-Policy": "same-origin",
            "Cross-Origin-Resource-Policy": "same-site"
        }

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response = await call_next(request)
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
        if not csrf_token:
            csrf_token = secrets.token_urlsafe(32)

        if request.method in self.safe_methods:
            return await self._process_request(scope, receive, send, csrf_token)

        header_token = request.headers.get(self.header_name)
        form_data = await request.form()
        form_token = form_data.get("csrf_token")

        if not (header_token and header_token == csrf_token) and not (form_token and form_token == csrf_token):
            response = StarletteResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content="CSRF token validation failed"
            )
            await response(scope, receive, send)
            return

        return await self._process_request(scope, receive, send, csrf_token)

    async def _process_request(self, scope: Scope, receive: Receive, send: Send, csrf_token: str) -> None:
        async def send_with_csrf_cookie(message: Message) -> None:
            if message["type"] == "http.response.start":
                headers = MutableHeaders(scope=message)
                headers.append("Set-Cookie", self._get_csrf_cookie(csrf_token))
            await send(message)

        await self.app(scope, receive, send_with_csrf_cookie)

    def _get_csrf_cookie(self, token: str) -> str:
        cookie_parts = [
            f"{self.cookie_name}={token}",
            f"Max-Age={60 * 60 * 24 * 7}",
            "Path=/",
        ]
        if self.cookie_secure:
            cookie_parts.append("Secure")
        if self.cookie_http_only:
            cookie_parts.append("HttpOnly")
        if self.cookie_same_site:
            cookie_parts.append(f"SameSite={self.cookie_same_site}")
        return "; ".join(cookie_parts)

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
    "/api/pets/",
    "/api/users/me/preferences"
}

class CSRFExemptMiddleware(CSRFMiddleware):
    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] == "http":
            path = scope.get("path", "")
            if path in csrf_exempt_paths or path.startswith("/api/pets"):
                await self.app(scope, receive, send)
                return
        await super().__call__(scope, receive, send)

allowed_origins = [
    "https://petmatch-hackkind.vercel.app",
    "https://hackkind-sequoiahumanesociety.vercel.app",
    "http://localhost:3000",
    "http://localhost:3001"
]

middleware = [
    Middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    ),
    Middleware(SecurityHeadersMiddleware),
    Middleware(
        CSRFExemptMiddleware,
        cookie_secure=not settings.DEBUG,
        cookie_same_site="lax",
        cookie_http_only=False,
        safe_methods={"GET", "HEAD", "OPTIONS", "TRACE"},
    ),
]

app = FastAPI(middleware=middleware)
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

# Routers
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
