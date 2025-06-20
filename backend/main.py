from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import Union
from fastapi.openapi.utils import get_openapi
from fastapi.security import OAuth2PasswordBearer
from backend.logic.scheduler import start_scheduler  
from fastapi.staticfiles import StaticFiles
import os
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

app = FastAPI()

# CRITICAL: CORS must be added BEFORE routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  
        "http://localhost:3001",  
        "http://127.0.0.1:3000", 
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,  # CRITICAL for cookies
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
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

app.openapi = custom_openapi

# Router registration - keep existing order
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