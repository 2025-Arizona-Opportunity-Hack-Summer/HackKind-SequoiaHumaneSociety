from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.core.dependencies import get_current_user
from backend.logic.matching import rank_matches, calculate_match_score  

router = APIRouter(prefix="/match", tags=["Matching"])

@router.get("/", response_model=list[dict])
def get_ranked_matches(
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    return rank_matches(user.id, db)

@router.get("/{pet_id}", response_model=dict)
def get_match_score(
    pet_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    score = calculate_match_score(user.id, pet_id, db)
    return {"score": score}
