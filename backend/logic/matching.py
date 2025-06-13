import pandas as pd
import numpy as np
from backend.models.user_training_preferences import TrainingTrait
from backend.schemas.pet_schema import PetAgeGroup, PetSize, PetEnergyLevel, ExperienceLevel, HairLength, PetResponse
from backend.schemas.preferences_schema import PreferencesSchema
from backend.schemas.training_schema import TraitInput
from backend.models.user_preferences import OwnershipExperience


def build_encoded_pet_vector(pet_info: PetResponse, training_traits: list[TrainingTrait]):
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


def build_encoded_adopter_vector(preferences: PreferencesSchema, training_traits: list[TraitInput]):
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

    df["sex_encoded"] = df["sex"].map({"Female": 0, "Male": 1, "NoPreference": 0.5}).astype(float)
    df["species_encoded"] = df["species"].map({"Cat": 0, "Dog": 1}).astype(float)

    df["size_encoded"] = pd.Categorical(df["size"], categories=[e.name for e in PetSize], ordered=True).codes / (len(PetSize) - 1)
    df["energy_level_encoded"] = pd.Categorical(df["energy_level"], categories=[e.name for e in PetEnergyLevel], ordered=True).codes / (len(PetEnergyLevel) - 1)
    df["age_group_encoded"] = pd.Categorical(df["age_group"], categories=[e.name for e in PetAgeGroup], ordered=True).codes / (len(PetAgeGroup) - 1)
    df["experience_level_encoded"] = pd.Categorical(df["experience_level"], categories=[e.name for e in OwnershipExperience], ordered=True).codes / (len(OwnershipExperience) - 1)
    df["hair_length_encoded"] = pd.Categorical(df["hair_length"], categories=[e.name for e in HairLength], ordered=True).codes / (len(HairLength) - 1)

    df.drop(columns=[
        "size", "energy_level", "age_group", "experience_level",
        "hair_length", "sex", "species"
    ], inplace=True)

    # Multi-hot trait vector
    all_traits = [e.name for e in TrainingTrait]
    selected_traits = {t.trait.name for t in training_traits}
    trait_vector = [1.0 if trait in selected_traits else 0.0 for trait in all_traits]

    return np.concatenate([df.to_numpy().flatten(), np.array(trait_vector)])

