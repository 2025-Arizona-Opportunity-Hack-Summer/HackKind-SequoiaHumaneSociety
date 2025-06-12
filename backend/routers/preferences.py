from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from backend.core.database import get_db
from backend.models.user_preferences import UserPreferences
from backend.core.dependencies import get_current_user
from backend.models.user import User
from pydantic import ConfigDict


router = APIRouter(prefix="/users/me/preferences", tags=["User Preferences"])

class PreferencesSchema(BaseModel):
    preferred_species: str
    pet_purpose: str
    has_children: bool 
    has_dogs: bool 
    has_cats: bool 
    ownership_experience: str
    preferred_age: str
    preferred_sex: str
    preferred_size: str
    preferred_energy_level: str
    preferred_hair_length: str
    wants_allergy_friendly: bool
    accepts_special_needs: bool
    
    model_config = ConfigDict(from_attributes=True)


@router.get("/", response_model=PreferencesSchema)
def get_user_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    preferences = db.query(UserPreferences).filter(UserPreferences.user_id == current_user.id).first()
    if not preferences:
        raise HTTPException(status_code=404, detail="Preferences not found")
    return preferences

@router.post("/", response_model=PreferencesSchema)
def create_user_preferences(
    preferences: PreferencesSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if db.query(UserPreferences).filter(UserPreferences.user_id == current_user.id).first():
        raise HTTPException(status_code=400, detail="Preferences already exist")

    new_preferences = UserPreferences(user_id=current_user.id, **preferences.model_dump())
    db.add(new_preferences)
    db.commit()
    db.refresh(new_preferences)
    return new_preferences

@router.put("/", response_model=PreferencesSchema)
def update_user_preferences(
    preferences: PreferencesSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(UserPreferences).filter(UserPreferences.user_id == current_user.id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Preferences not found")

    for attr, value in preferences.dict(exclude_unset=True).items():
        setattr(existing, attr, value)

    db.commit()
    db.refresh(existing)
    return existing
