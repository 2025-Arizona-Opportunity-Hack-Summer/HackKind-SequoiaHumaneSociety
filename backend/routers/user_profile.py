from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.models.user import User
from backend.core.dependencies import get_current_user
from backend.schemas.user_schema import UserUpdate, UserOut

router = APIRouter(prefix="/users/me", tags=["User Profile"])

@router.get("", response_model=UserOut)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user

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
