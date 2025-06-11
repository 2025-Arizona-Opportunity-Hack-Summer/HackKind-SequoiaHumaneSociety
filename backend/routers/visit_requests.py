from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.models.visit_request import VisitRequest
from backend.core.dependencies import get_current_user
from backend.models.user import User
from datetime import datetime
from typing import List
from pydantic import BaseModel

router = APIRouter(prefix="/visit-requests", tags=["Visit Requests"])

class VisitRequestSchema(BaseModel):
    id: int
    user_id: int
    pet_id: int
    requested_at: datetime
    status: str

    class Config:
        from_attributes = True

@router.post("/{pet_id}", response_model=dict)
def request_visit(
    pet_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    visit = VisitRequest(
        user_id=user.id,
        pet_id=pet_id,
        requested_at=datetime.utcnow(),
        status="Pending"
    )
    db.add(visit)
    db.commit()
    db.refresh(visit)
    return {"message": "Visit requested", "visit_id": visit.id}

@router.get("/my", response_model=List[VisitRequestSchema])
def get_user_visits(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    return db.query(VisitRequest).filter(VisitRequest.user_id == user.id).all()

@router.put("/{id}/cancel", response_model=dict)
def cancel_visit(
    id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    visit = db.query(VisitRequest).filter(
        VisitRequest.id == id,
        VisitRequest.user_id == user.id
    ).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")

    visit.status = "Cancelled"
    db.commit()
    return {"message": "Visit cancelled"}

visit_requests_router = router
