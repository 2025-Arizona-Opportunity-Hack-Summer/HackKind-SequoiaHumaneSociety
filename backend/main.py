from fastapi import FastAPI
from typing import Union
from fastapi.openapi.utils import get_openapi
from fastapi.security import OAuth2PasswordBearer
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

app.include_router(auth_router)
app.include_router(user_profile_router)
app.include_router(preferences_router)
app.include_router(training_traits_router)
app.include_router(pets_router)
app.include_router(pet_training_traits_router)
app.include_router(matching_router)
app.include_router(visit_requests_router)
app.include_router(admin_visit_requests_router)

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}    

