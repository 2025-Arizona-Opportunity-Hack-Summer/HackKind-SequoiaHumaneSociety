from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from  core.database import get_db
from  core.dependencies import get_current_user
from  models.pet_training_traits import PetTrainingTrait, TrainingTrait
from  models.user import UserRole
from fastapi import Body


router = APIRouter(prefix="/pets", tags=["Pet Training Traits"])

@router.get("/{pet_id}/training-traits", response_model=list[TrainingTrait])
def get_training_traits(
    pet_id: int,
    db: Session = Depends(get_db),
):
    traits = db.query(PetTrainingTrait).filter(PetTrainingTrait.pet_id == pet_id).all()
    return [t.trait for t in traits]

@router.post("/{pet_id}/training-traits")
def add_training_trait(
    pet_id: int,
    trait: TrainingTrait = Body(...),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    if user.role != UserRole.Admin:
        raise HTTPException(status_code=403, detail="Only admins can add traits")
    db.add(PetTrainingTrait(pet_id=pet_id, trait=trait))
    db.commit()
    return {"message": "Trait added"}

@router.delete("/{pet_id}/training-traits/{trait}")
def remove_training_trait(
    pet_id: int,
    trait: TrainingTrait,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    if user.role != UserRole.Admin:
        raise HTTPException(status_code=403, detail="Only admins can remove traits")
    deleted = db.query(PetTrainingTrait).filter(
        PetTrainingTrait.pet_id == pet_id,
        PetTrainingTrait.trait == trait
    ).delete()
    db.commit()
    if not deleted:
        raise HTTPException(status_code=404, detail="Trait not found")
    return {"message": "Trait removed"}

pet_training_traits_router = router
