from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session
from  core.database import get_db
from  core.dependencies import get_current_user
from  models.user_training_preferences import UserTrainingPreference, TrainingTrait
from  models.user import User
from typing import List
from  schemas.training_schema import TraitInput

router = APIRouter(
    prefix="/preferences/training-traits",
    tags=["Training Trait Preferences"]
)

@router.get("/", response_model=List[TrainingTrait])
def get_training_traits(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    traits = db.query(UserTrainingPreference).filter(
        UserTrainingPreference.user_id == current_user.id
    ).all()
    return [t.trait for t in traits]

@router.post("/", response_model=TrainingTrait)
def add_training_trait(
    trait_input: TraitInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    exists = db.query(UserTrainingPreference).filter(
        UserTrainingPreference.user_id == current_user.id,
        UserTrainingPreference.trait == trait_input.trait
    ).first()
    if exists:
        raise HTTPException(status_code=400, detail="Trait already added")

    new_trait = UserTrainingPreference(
        user_id=current_user.id,
        trait=trait_input.trait
    )
    db.add(new_trait)
    db.commit()
    return new_trait.trait

@router.delete("/{trait}", response_model=dict)
def delete_training_trait(
    trait: TrainingTrait = Path(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    record = db.query(UserTrainingPreference).filter(
        UserTrainingPreference.user_id == current_user.id,
        UserTrainingPreference.trait == trait
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Trait not found")

    db.delete(record)
    db.commit()
    return {"message": "Trait removed", "trait": trait}
