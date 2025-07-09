from typing import Dict, Any
from openai import OpenAI
import os
from fastapi import HTTPException

class PetAIService:
    def __init__(self):
        # OpenAI logic is paused
        pass

    def get_pet_characteristics(self, pet_data: dict) -> str:
        # Temporarily disable OpenAI logic
        return self._fallback_summary(pet_data)

    async def generate_pet_summary(self, pet_data: dict) -> str:
        # Temporarily disable OpenAI logic
        return self._fallback_summary(pet_data)

    def _fallback_summary(self, pet_data: dict) -> str:
        # Generate a simple summary from pet_data fields
        name = pet_data.get('name', 'This pet')
        species = pet_data.get('species', 'pet')
        breed = pet_data.get('breed', '')
        age_group = pet_data.get('age_group', '')
        sex = pet_data.get('sex', '')
        size = pet_data.get('size', '')
        energy = pet_data.get('energy_level', '')
        traits = []
        if pet_data.get('allergy_friendly'):
            traits.append('allergy-friendly')
        if pet_data.get('special_needs'):
            traits.append('special needs')
        if pet_data.get('kid_friendly'):
            traits.append('kid-friendly')
        if pet_data.get('pet_friendly'):
            traits.append('pet-friendly')
        trait_str = ', '.join(traits)
        summary = f"{name} is a {age_group.lower()} {sex.lower()} {species.lower()} {('of breed ' + breed) if breed else ''}. "
        if size:
            summary += f"Size: {size.lower()}. "
        if energy:
            summary += f"Energy level: {energy.lower()}. "
        if trait_str:
            summary += f"Traits: {trait_str}. "
        summary += "Looking for a loving home!"
        return summary.strip()

pet_ai_service = PetAIService()