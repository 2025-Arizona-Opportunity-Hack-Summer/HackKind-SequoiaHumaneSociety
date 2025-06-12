from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.models.visit_request import VisitRequest, VisitRequestStatus
from backend.core.dependencies import get_current_user
from backend.models.user import User
from datetime import datetime
from typing import List
from pydantic import BaseModel
from backend.logic.emails import send_visit_confirmation
from backend.models.pet import Pet
from pydantic import ConfigDict


router = APIRouter(prefix="/visit-requests", tags=["Visit Requests"])

class VisitStatusUpdate(BaseModel):
    new_status: VisitRequestStatus

class VisitRequestCreate(BaseModel):
    requested_at: datetime

class VisitRequestSchema(BaseModel):
    id: int
    user_id: int
    pet_id: int
    requested_at: datetime
    status: str

    model_config = ConfigDict(from_attributes=True)


@router.post("/{pet_id}", response_model=dict)
def request_visit(
    pet_id: int,
    payload: VisitRequestCreate, 
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    visit = VisitRequest(
        user_id=user.id,
        pet_id=pet_id,
        requested_at=payload.requested_at,  
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

@router.put("/{id}/status", response_model=dict)
def update_visit_status(
    id: int,
    background_tasks: BackgroundTasks,
    payload: VisitStatusUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    ):
    visit = db.query(VisitRequest).filter(VisitRequest.id == id).first()

    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")

    if user.role != "Admin" and visit.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this visit")

    pet = db.query(Pet).filter(Pet.id == visit.pet_id).first()
    if not pet:
        raise HTTPException(status_code=404, detail="Pet not found")
    
    adopter = db.query(User).filter(User.id == visit.user_id).first()
    if not adopter:
        raise HTTPException(status_code=404, detail="Adopter not found")

    previous_status = visit.status
    visit.status = payload.new_status
    db.commit()
    db.refresh(visit)

    if previous_status == "Pending" and payload.new_status == "Confirmed":
        background_tasks.add_task(
            send_visit_confirmation,
            adopter_name=adopter.full_name,
            adopter_email=adopter.email,
            pet_name=pet.name,
            visit_time=visit.requested_at.strftime("%Y-%m-%d %I:%M %p")
        )

    return {"message": f"Visit status updated to {payload.new_status}"}

visit_requests_router = router
