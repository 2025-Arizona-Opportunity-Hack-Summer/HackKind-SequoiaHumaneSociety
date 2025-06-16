from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import Union
from fastapi.openapi.utils import get_openapi
from fastapi.security import OAuth2PasswordBearer
from backend.logic.scheduler import start_scheduler  # Changed from backend.logic.scheduler
from fastapi.staticfiles import StaticFiles
import os
from backend.routers import (  # Changed from backend.routers
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

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Default React port
        "http://localhost:3001",  # Common alternate React port
        "http://127.0.0.1:3000", # Localhost IP
        "http://127.0.0.1:3001",
        # Add your production domain here when ready
        # "https://your-production-domain.com"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["Content-Length", "X-Foo", "X-Bar"],
    max_age=600,  # Cache preflight requests for 10 minutes
)

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

# Include all API routes with /api prefix
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
def read_root():
    return {"Hello": "World"}

@app.get("/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}    

app.mount("/static", StaticFiles(directory=os.path.join("backend", "static")), name="static")

start_scheduler()