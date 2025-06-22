from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from typing import Union
from fastapi.openapi.utils import get_openapi
from fastapi.security import OAuth2PasswordBearer
from backend.logic.scheduler import start_scheduler  
from fastapi.staticfiles import StaticFiles
from backend.rate_limiter import apply_rate_limiting
import os
from fastapi.middleware import Middleware
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.types import ASGIApp
from backend.routers import (  
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
            "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
            "Content-Security-Policy": "default-src 'self'",
            "Referrer-Policy": "same-origin",
            "Permissions-Policy": "geolocation=(), microphone=()"
        }

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response = await call_next(request)
        response.headers.update(self.security_headers)
        return response

middleware = [
    Middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",  
            "http://localhost:3001",  
            "http://127.0.0.1:3000", 
            "http://127.0.0.1:3001",
        ],
        allow_credentials=True,  
        allow_methods=["*"],  
        allow_headers=["*"],  
        expose_headers=["*"],  
    ),
    Middleware(SecurityHeadersMiddleware),
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