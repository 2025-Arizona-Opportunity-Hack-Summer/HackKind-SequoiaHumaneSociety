import pandas as pd
import numpy as np
from backend.models.user_training_preferences import TrainingTrait
from backend.schemas.pet_schema import PetAgeGroup, PetSize, PetEnergyLevel, ExperienceLevel, HairLength, PetResponse
from backend.schemas.preferences_schema import PreferencesSchema
from backend.schemas.training_schema import TraitInput
from backend.models.pet_vector import PetVector
from backend.models.adopter_vector import AdopterVector
from sqlalchemy.sql import func
from typing import List, Tuple
from backend.models.match import Match
from backend.models.pet import Pet

#------Vector Building Functions------#
def build_pet_vector(pet_info: PetResponse, training_traits: list[TrainingTrait]):
    df = pd.DataFrame([{
        "age_group": pet_info.age_group.name,
        "size": pet_info.size.name,
        "energy_level": pet_info.energy_level.name,
        "experience_level": pet_info.experience_level.name,
        "hair_length": pet_info.hair_length.name,
        "sex": pet_info.sex.name,
        "species": pet_info.species.name,
        "allergy_friendly": float(pet_info.allergy_friendly),
        "special_needs": float(pet_info.special_needs),
        "kid_friendly": float(pet_info.kid_friendly),
        "pet_friendly": float(pet_info.pet_friendly)
    }])

    df["sex_encoded"] = df["sex"].map({"Female": 0, "Male": 1}).astype(float)
    df["species_encoded"] = df["species"].map({"Cat": 0, "Dog": 1}).astype(float)
    df["size_encoded"] = pd.Categorical(df["size"], categories=[e.name for e in PetSize], ordered=True).codes / (len(PetSize) - 1)
    df["energy_level_encoded"] = pd.Categorical(df["energy_level"], categories=[e.name for e in PetEnergyLevel], ordered=True).codes / (len(PetEnergyLevel) - 1)
    df["age_group_encoded"] = pd.Categorical(df["age_group"], categories=[e.name for e in PetAgeGroup], ordered=True).codes / (len(PetAgeGroup) - 1)
    df["experience_level_encoded"] = pd.Categorical(df["experience_level"], categories=[e.name for e in ExperienceLevel], ordered=True).codes / (len(ExperienceLevel) - 1)
    df["hair_length_encoded"] = pd.Categorical(df["hair_length"], categories=[e.name for e in HairLength], ordered=True).codes / (len(HairLength) - 1)

    df.drop(columns=[
        "size", "energy_level", "age_group", "experience_level",
        "hair_length", "sex", "species"
    ], inplace=True)

    all_traits = [e.name for e in TrainingTrait]
    pet_trait_names = {t.name for t in training_traits}
    trait_vector = [1.0 if trait in pet_trait_names else 0.0 for trait in all_traits]

    return np.concatenate([df.to_numpy().flatten(), np.array(trait_vector)])


def build_adopter_vector(preferences: PreferencesSchema, training_traits: list[TraitInput]):
    df = pd.DataFrame([{
        "age_group": preferences.preferred_age.name,
        "size": preferences.preferred_size.name,
        "energy_level": preferences.preferred_energy_level.name,
        "experience_level": preferences.ownership_experience.name,
        "hair_length": preferences.preferred_hair_length.name,
        "sex": preferences.preferred_sex.name,
        "species": preferences.preferred_species.name,
        "allergy_friendly": float(preferences.wants_allergy_friendly),
        "special_needs": float(preferences.accepts_special_needs),
        "kid_friendly": float(preferences.has_children),
        "pet_friendly": float(preferences.has_dogs or preferences.has_cats)
    }])
    
    experience_mapping = {
        "FirstTime": "Beginner",
        "HadBefore": "Intermediate", 
        "CurrentlyHave": "Advanced"
    }
    
    mapped_experience = experience_mapping.get(preferences.ownership_experience.name, "Beginner")
    df["experience_level"] = mapped_experience
    
    df["experience_level_encoded"] = pd.Categorical(df["experience_level"], categories=[e.name for e in ExperienceLevel], ordered=True).codes / (len(ExperienceLevel) - 1)
    df["sex_encoded"] = df["sex"].map({"Female": 0, "Male": 1, "NoPreference": 0.5}).astype(float)
    df["species_encoded"] = df["species"].map({"Cat": 0, "Dog": 1}).astype(float)
    df["size_encoded"] = pd.Categorical(df["size"], categories=[e.name for e in PetSize], ordered=True).codes / (len(PetSize) - 1)
    df["energy_level_encoded"] = pd.Categorical(df["energy_level"], categories=[e.name for e in PetEnergyLevel], ordered=True).codes / (len(PetEnergyLevel) - 1)
    df["age_group_encoded"] = pd.Categorical(df["age_group"], categories=[e.name for e in PetAgeGroup], ordered=True).codes / (len(PetAgeGroup) - 1)
    df["hair_length_encoded"] = pd.Categorical(df["hair_length"], categories=[e.name for e in HairLength], ordered=True).codes / (len(HairLength) - 1)

    df.drop(columns=[
        "size", "energy_level", "age_group", "experience_level",
        "hair_length", "sex", "species"
    ], inplace=True)

    all_traits = [e.name for e in TrainingTrait]
    selected_traits = {t.trait.name for t in training_traits}
    trait_vector = [1.0 if trait in selected_traits else 0.0 for trait in all_traits]

    return np.concatenate([df.to_numpy().flatten(), np.array(trait_vector)])

#--------Saver Functions--------#
def save_pet_vector(pet, training_traits, db):
    vector = build_pet_vector(pet, training_traits)
    db_vector = PetVector(
        pet_id=pet.id,
        vector=vector.tolist(),  
        updated_at=func.now()
    )
    db.merge(db_vector)
    db.commit()


def save_adopter_vector(user_id, preferences, training_traits, db):
    vector = build_adopter_vector(preferences, training_traits)
    db_vector = AdopterVector(
        user_id=user_id,
        vector=vector.tolist(), 
        updated_at=func.now()
    )
    db.merge(db_vector)
    db.commit()

#--------Matching Functions--------#
def cosine_similarity(vec1: np.ndarray, vec2: np.ndarray):
    if vec1.size == 0 or vec2.size == 0:
        return 0.0
    
    if vec1.shape != vec2.shape:
        raise ValueError(f"Vector shape mismatch: {vec1.shape} vs {vec2.shape}")
    
    # Handle zero vectors
    norm1, norm2 = np.linalg.norm(vec1), np.linalg.norm(vec2)
    if norm1 == 0 or norm2 == 0:
        return 0.0
        
    return float(np.dot(vec1, vec2) / (norm1 * norm2))


def get_top_pet_matches(adopter_vector: List[float], pet_vectors: List[Tuple[int, List[float]]], top_k: int = 5, similarity_threshold: float = 0.6):
    adopter_vec = np.array(adopter_vector)
    similarities = []

    for pet_id, pet_vec in pet_vectors:
        pet_vec_np = np.array(pet_vec)
        score = cosine_similarity(adopter_vec, pet_vec_np)
        
        # Only include matches above the threshold
        if score >= similarity_threshold:
            similarities.append((pet_id, score))

    similarities.sort(key=lambda x: x[1], reverse=True)

    return similarities[:top_k]


def save_matches_for_user(user_id: int, matches: List[Tuple[int, float]], db):
    try:
        for pet_id, score in matches:
            match = Match(user_id=user_id, pet_id=pet_id, match_score=score)
            db.merge(match)
        db.commit()  # Single commit at the end
    except Exception:
        db.rollback()
        raise

#--------Loader Functions--------#
def load_adopter_vector(user_id: int, db):
    record = db.query(AdopterVector).filter_by(user_id=user_id).first()
    return record.vector if record else None


def load_pet_vectors(db):
    results = (
        db.query(PetVector.pet_id, PetVector.vector)
        .join(Pet, Pet.id == PetVector.pet_id)
        .filter(Pet.status == "Available")
        .all()
    )
    return [(r.pet_id, r.vector) for r in results]

#--------Match refresh function--------#
def refresh_all_matches(db):
    pet_vectors = load_pet_vectors(db)
    adopter_vectors = db.query(AdopterVector).all()

    # Optionally: clear old matches first
    db.query(Match).delete()
    db.commit()

    for adopter_vec in adopter_vectors:
        user_id = adopter_vec.user_id
        vector = adopter_vec.vector
        top_matches = get_top_pet_matches(vector, pet_vectors)
        save_matches_for_user(user_id, top_matches, db)
