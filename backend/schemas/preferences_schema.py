from pydantic import BaseModel, ConfigDict
from backend.models.user_preferences import (
    PetSpecies,
    PetEnergyLevel,
    PetAgeGroup,
    HairLength,
    PetPurpose,
    OwnershipExperience,
    PreferredSex,
    PreferredSize
)

class PreferencesSchema(BaseModel):
    preferred_species: PetSpecies
    pet_purpose: PetPurpose
    has_children: bool
    has_dogs: bool
    has_cats: bool
    ownership_experience: OwnershipExperience
    preferred_age: PetAgeGroup
    preferred_sex: PreferredSex
    preferred_size: PreferredSize
    preferred_energy_level: PetEnergyLevel
    preferred_hair_length: HairLength
    wants_allergy_friendly: bool
    accepts_special_needs: bool

    model_config = ConfigDict(from_attributes=True)