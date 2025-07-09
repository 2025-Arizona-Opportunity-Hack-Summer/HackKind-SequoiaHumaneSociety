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
from fastapi import Query


router = APIRouter(prefix="/match", tags=["Matching"])

# ---------- Helper Functions ----------

def get_user_preferences_and_traits(user_id: int, db: Session):
    prefs = db.query(UserPreferences).filter_by(user_id=user_id).first()
    if not prefs:
        raise HTTPException(status_code=400, detail="Preferences not set")

    traits = db.query(UserTrainingPreference).filter_by(user_id=user_id).all()
    preferences_schema = PreferencesSchema(**prefs.__dict__)
    training_traits = [TraitInput(trait=t.trait) for t in traits]
    return preferences_schema, training_traits


def get_pet_response_and_traits(pet_id: int, db: Session):
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



@router.get("/recommendations")
def get_pet_recommendations(
    background_tasks: BackgroundTasks,
    page: int = Query(1, ge=1),
    pageSize: int = Query(10, ge=1, le=50),
    refresh: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        preferences = db.query(UserPreferences).filter(UserPreferences.user_id == current_user.id).first()
        if not preferences:
            raise HTTPException(status_code=400, detail="Please complete the questionnaire to get pet recommendations.")
        
        if refresh:
            prefs_dict, traits_list = get_user_preferences_and_traits(current_user.id, db)
            save_adopter_vector(current_user.id, prefs_dict, traits_list, db)
        
        adopter_vector = load_adopter_vector(current_user.id, db)
        if not adopter_vector:
            prefs_dict, traits_list = get_user_preferences_and_traits(current_user.id, db)
            save_adopter_vector(current_user.id, prefs_dict, traits_list, db)
            adopter_vector = load_adopter_vector(current_user.id, db)
            
            if not adopter_vector:
                raise HTTPException(status_code=400, detail="Could not generate adopter vector")

        pet_vectors = load_pet_vectors(db)
        if not pet_vectors:
            return []

        if preferences.preferred_species and preferences.preferred_species != "NoPreference":
            matching_pets = db.query(Pet.id).filter(
                Pet.species == preferences.preferred_species,
                Pet.status == "Available"
            ).all()
            matching_pet_ids = {pet_id for (pet_id,) in matching_pets}
            
            filtered_pet_vectors = [
                (pet_id, vector) for pet_id, vector in pet_vectors 
                if pet_id in matching_pet_ids
            ]
            if filtered_pet_vectors:
                pet_vectors = filtered_pet_vectors
            else:
                pass # No pets match the preferred species, falling back to all pets
        elif preferences.preferred_species == "NoPreference":
            pass # No preference for species, considering all available pets

        top_matches = get_top_pet_matches(adopter_vector, pet_vectors, top_k=50)
        
        skip = (page - 1) * pageSize
        paginated_matches = top_matches[skip:skip + pageSize]
        
        background_tasks.add_task(save_matches_for_user, current_user.id, top_matches, db)

        pet_ids = [pid for pid, _ in paginated_matches]
        pets = db.query(Pet).filter(Pet.id.in_(pet_ids), Pet.status == "Available").all()
        pet_map = {pet.id: pet for pet in pets}

        pet_traits = {}
        for pet_id in pet_ids:
            traits = db.query(PetTrainingTrait).filter(PetTrainingTrait.pet_id == pet_id).all()
            pet_traits[pet_id] = [t.trait.name for t in traits]

        results = []
        for pet_id, score in paginated_matches:
            pet = pet_map.get(pet_id)
            if pet:
                pet_data = {
                    "id": pet.id,
                    "name": pet.name,
                    "species": pet.species.value,
                    "breed": pet.breed,
                    "age_group": pet.age_group.value,
                    "sex": pet.sex.value,
                    "size": pet.size.value if pet.size else None,
                    "energy_level": pet.energy_level.value if pet.energy_level else None,
                    "experience_level": pet.experience_level.value if pet.experience_level else None,
                    "hair_length": pet.hair_length.value if pet.hair_length else None,
                    "allergy_friendly": pet.allergy_friendly,
                    "special_needs": pet.special_needs,
                    "kid_friendly": pet.kid_friendly,
                    "pet_friendly": pet.pet_friendly,
                    "shelter_notes": pet.shelter_notes,
                    "summary": pet.summary,
                    "image_url": str(pet.image_url) if pet.image_url else None,
                    "status": pet.status.value,
                    "training_traits": pet_traits.get(pet_id, []),
                    "match_score": float(score)  
                }
                results.append(pet_data)

        return results

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
