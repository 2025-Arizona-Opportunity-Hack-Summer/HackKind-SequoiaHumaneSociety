from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.models.user_preferences import UserPreferences
from backend.core.dependencies import get_current_user
from backend.models.user import User
from backend.schemas.preferences_schema import PreferencesSchema

router = APIRouter(prefix="/users/me/preferences", tags=["User Preferences"])
    
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
def upsert_user_preferences(
    preferences: PreferencesSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = db.query(UserPreferences).filter(UserPreferences.user_id == current_user.id).first()

    if existing:
        for attr, value in preferences.dict(exclude_unset=True).items():
            setattr(existing, attr, value)
    else:
        existing = UserPreferences(user_id=current_user.id, **preferences.model_dump())
        db.add(existing)

    db.commit()
    db.refresh(existing)
    return existing
