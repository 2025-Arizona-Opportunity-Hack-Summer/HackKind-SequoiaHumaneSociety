from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from  core.database import get_db
from  models.user import User
from  core.dependencies import get_current_user
from  schemas.user_schema import UserUpdate, UserOut
from  schemas.user_schema import UserWithPreferences
from  models.user_preferences import UserPreferences

router = APIRouter(prefix="/users/me", tags=["User Profile"])

@router.get("", response_model=UserWithPreferences)
def get_profile_with_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    preferences = db.query(UserPreferences).filter(UserPreferences.user_id == current_user.id).first()
    return {
        **current_user.__dict__,
        "preferences": preferences
    }

@router.put("", response_model=UserOut)
def update_profile(
    update_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if update_data.email and update_data.email != current_user.email:
        if db.query(User).filter(User.email == update_data.email).first():
            raise HTTPException(status_code=400, detail="Email already taken")

    for attr, value in update_data.dict(exclude_unset=True).items():
        setattr(current_user, attr, value)

    db.commit()
    db.refresh(current_user)
    return current_user

@router.delete("", response_model=dict)
def delete_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db.delete(current_user)
    db.commit()
    return {"message": "Account deleted successfully"}
