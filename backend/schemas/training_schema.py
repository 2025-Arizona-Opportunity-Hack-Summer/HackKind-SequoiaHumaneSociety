from pydantic import BaseModel
from  models.user_training_preferences import TrainingTrait

class TraitInput(BaseModel):
    trait: TrainingTrait