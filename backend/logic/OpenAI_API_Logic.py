from typing import Dict, Any
from openai import OpenAI
import os
from fastapi import HTTPException

class PetAIService:
    def __init__(self, openai_api_key: str = None):
        self.client = OpenAI(api_key=openai_api_key or os.getenv("OPENAI_API_KEY", ""))
        if not self.client.api_key:
            raise ValueError("OpenAI API key is required")

    def get_pet_characteristics(self, pet_data: Dict[str, Any]) -> str:
        """Format pet data into a descriptive string for the AI."""
        characteristics = []
        
        if pet_data.get('name'):
            characteristics.append(f"name: {pet_data['name']}")
        if pet_data.get('species'):
            characteristics.append(f"species: {pet_data['species']}")
        if pet_data.get('breed'):
            characteristics.append(f"breed: {pet_data['breed']}")
        if pet_data.get('age_group'):
            characteristics.append(f"age group: {pet_data['age_group']}")
        if pet_data.get('sex'):
            characteristics.append(f"sex: {pet_data['sex']}")
        if pet_data.get('size'):
            characteristics.append(f"size: {pet_data['size']}")
        if pet_data.get('energy_level'):
            characteristics.append(f"energy level: {pet_data['energy_level']}")
        if pet_data.get('experience_level'):
            characteristics.append(f"experience level: {pet_data['experience_level']}")
        if pet_data.get('hair_length'):
            characteristics.append(f"hair length: {pet_data['hair_length']}")
        
        if pet_data.get('allergy_friendly') is not None:
            characteristics.append("allergy friendly" if pet_data['allergy_friendly'] else "not allergy friendly")
        if pet_data.get('special_needs') is not None:
            characteristics.append("has special needs" if pet_data['special_needs'] else "no special needs")
        if pet_data.get('kid_friendly') is not None:
            characteristics.append("kid friendly" if pet_data['kid_friendly'] else "not kid friendly")
        if pet_data.get('pet_friendly') is not None:
            characteristics.append("pet friendly" if pet_data['pet_friendly'] else "not pet friendly")
                
        return ", ".join(characteristics)

    async def generate_pet_summary(self, pet_data: Dict[str, Any]) -> str:
        """Generate an AI summary for a pet."""
        try:
            characteristics = self.get_pet_characteristics(pet_data)
            
            completion = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a friendly assistant helping an animal shelter write short, engaging pet summaries (max 50 words) to attract potential adopters. Based on the pet's traits, write warm, human-sounding descriptions that highlight their personality and suitability for adoption. Use clear, everyday language. Avoid repeating trait labels or using overly formal or fancy words like 'luxurious' or 'regal.' Instead, use relatable words like 'soft,' 'playful,' 'gentle,' or 'friendly.' Make each summary feel natural, adoptable, and heartfelt."
                    },
                    {
                        "role": "user",
                        "content": f"These are the pet characteristics: {characteristics}"
                    }
                ],
                temperature=0.7,
                max_tokens=200
            )
            
            return completion.choices[0].message.content.strip()
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to generate pet summary: {str(e)}"
            )

pet_ai_service = PetAIService()