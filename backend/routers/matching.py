from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.core.dependencies import get_current_user
from backend.models.user import User
from backend.models.user_preferences import UserPreferences
from backend.models.user_training_preferences import UserTrainingPreference
from backend.schemas.preferences_schema import PreferencesSchema
from backend.schemas.training_schema import TraitInput
from backend.models.pet import Pet
from backend.models.pet_training_traits import PetTrainingTrait
from backend.schemas.pet_schema import PetResponse
from backend.models.match import Match
from backend.logic.matching_logic import (
    save_adopter_vector,
    save_pet_vector,
    load_adopter_vector,
    load_pet_vectors,
    get_top_pet_matches,
    save_matches_for_user
)

router = APIRouter(prefix="/match", tags=["Matching"])

# ---------- Helper Functions ----------

def get_user_preferences_and_traits(user_id: int, db: Session) -> tuple[PreferencesSchema, list[TraitInput]]:
    prefs = db.query(UserPreferences).filter_by(user_id=user_id).first()
    if not prefs:
        raise HTTPException(status_code=400, detail="Preferences not set")

    traits = db.query(UserTrainingPreference).filter_by(user_id=user_id).all()
    preferences_schema = PreferencesSchema(**prefs.__dict__)
    training_traits = [TraitInput(trait=t.trait) for t in traits]
    return preferences_schema, training_traits


def get_pet_response_and_traits(pet_id: int, db: Session) -> tuple[PetResponse, list[PetTrainingTrait]]:
    pet = db.query(Pet).filter_by(id=pet_id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    traits = db.query(PetTrainingTrait).filter_by(pet_id=pet_id).all()
    pet_response = PetResponse(**{k: v for k, v in pet.__dict__.items() if not k.startswith("_")})
    return pet_response, traits


# ---------- Routes ----------

@router.post("/refresh-vector")
def refresh_adopter_vector(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    preferences_schema, training_traits = get_user_preferences_and_traits(current_user.id, db)
    save_adopter_vector(current_user.id, preferences_schema, training_traits, db)
    return {"message": "Adopter vector successfully updated"}


@router.post("/pets/{pet_id}/refresh-vector")
def refresh_pet_vector(
    pet_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Only admins can refresh pet vectors")

    pet = db.query(Pet).filter_by(id=pet_id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")

    traits = db.query(PetTrainingTrait).filter_by(pet_id=pet_id).all()
    trait_enums = [t.trait for t in traits] 

    pet_response = PetResponse(**{k: v for k, v in pet.__dict__.items() if not k.startswith("_")})
    save_pet_vector(pet_response, trait_enums, db)

    return {"message": f"Vector for pet {pet_id} successfully updated"}



@router.get("/recommendations", response_model=list[dict])
def get_pet_recommendations(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    adopter_vector = load_adopter_vector(current_user.id, db)
    if not adopter_vector:
        raise HTTPException(status_code=400, detail="Adopter vector not found")

    pet_vectors = load_pet_vectors(db)
    if not pet_vectors:
        return []

    top_matches = get_top_pet_matches(adopter_vector, pet_vectors, top_k=5)
    background_tasks.add_task(save_matches_for_user, current_user.id, top_matches, db)

    pet_ids = [pid for pid, _ in top_matches]
    pets = db.query(Pet).filter(Pet.id.in_(pet_ids), Pet.status == "Available").all()
    pet_map = {pet.id: pet for pet in pets}

    results = []
    for pet_id, score in top_matches:
        pet = pet_map.get(pet_id)
        if pet:
            pet_data = PetResponse(**{k: v for k, v in pet.__dict__.items() if not k.startswith("_")})
            results.append({
                "pet": pet_data,
                "score": round(score, 3)
            })

    return results


@router.get("/me", response_model=list[dict])
def get_saved_matches(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    matches = (
        db.query(Match, Pet)
        .join(Pet, Match.pet_id == Pet.id)
        .filter(Match.user_id == current_user.id)
        .order_by(Match.match_score.desc())
        .all()
    )

    return [{
        "pet": PetResponse(**{k: v for k, v in pet.__dict__.items() if not k.startswith("_")}),
        "score": round(match.match_score, 3)
    } for match, pet in matches]
