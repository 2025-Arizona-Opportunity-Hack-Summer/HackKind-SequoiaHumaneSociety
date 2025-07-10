from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from  core.database import get_db
from  models.user_preferences import UserPreferences
from  core.dependencies import get_current_user
from  models.user import User
from  schemas.preferences_schema import PreferencesSchema
from  logic.matching_logic import save_adopter_vector
from  models.user_training_preferences import UserTrainingPreference  
from  schemas.training_schema import TraitInput

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
        for attr, value in preferences.model_dump(exclude_unset=True).items():
            setattr(existing, attr, value)
    else:
        existing = UserPreferences(user_id=current_user.id, **preferences.model_dump())
        db.add(existing)

    db.commit()
    db.refresh(existing)
    
    training_traits_records = db.query(UserTrainingPreference).filter(UserTrainingPreference.user_id == current_user.id).all()
    training_traits = [TraitInput(trait=t.trait) for t in training_traits_records]
    save_adopter_vector(current_user.id, existing, training_traits, db)

    return existing