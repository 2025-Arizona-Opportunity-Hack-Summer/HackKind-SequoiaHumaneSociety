from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from  core.database import get_db
from  models.visit_request import VisitRequest
from  core.dependencies import get_current_user
from  models.user import User
from typing import List
from  logic.emails import send_visit_confirmation
from  models.pet import Pet
from  schemas.visit_schema import VisitRequestCreate, VisitStatusUpdate, VisitRequestSchema
from  models.visit_request import VisitRequestStatus

router = APIRouter(prefix="/visit-requests", tags=["Visit Requests"])

@router.post("/{pet_id}", response_model=dict)
def request_visit(
    pet_id: int,
    payload: VisitRequestCreate, 
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    from datetime import datetime, timezone
    if payload.requested_at.tzinfo is None:
        requested_at = payload.requested_at.replace(tzinfo=timezone.utc)
    else:
        requested_at = payload.requested_at.astimezone(timezone.utc)
    
    time_window_start = requested_at - timedelta(minutes=30)
    time_window_end = requested_at + timedelta(minutes=30)
    
    existing_visits = db.query(VisitRequest).filter(
        VisitRequest.pet_id == pet_id,
        VisitRequest.status.in_(["Pending", "Confirmed"]),
        VisitRequest.requested_at.between(time_window_start, time_window_end)
    ).all()
    
    if existing_visits:
        user_existing_visit = next(
            (v for v in existing_visits if v.user_id == user.id),
            None
        )
        
        if user_existing_visit:
            error_msg = f"You already have a {user_existing_visit.status.lower()} visit request for this pet at {user_existing_visit.requested_at}."
            print(f"Duplicate request: {error_msg}")
            return {
                "success": False,
                "error": "duplicate_request",
                "message": error_msg,
                "existing_visit": {
                    "id": user_existing_visit.id,
                    "status": user_existing_visit.status,
                    "requested_at": user_existing_visit.requested_at.isoformat()
                }
            }
        
        conflict_details = [
            {
                "id": v.id,
                "requested_at": v.requested_at.isoformat(),
                "status": v.status
            } for v in existing_visits
        ]
        error_msg = "This time slot is no longer available. Please choose another time."
        print(f"Scheduling conflict: {error_msg}")
        print(f"Conflicting visits: {conflict_details}")
        return {
            "success": False,
            "error": "scheduling_conflict",
            "message": error_msg,
            "conflicting_visits": conflict_details
        }
    
    existing_user_visit = db.query(VisitRequest).filter(
        VisitRequest.user_id == user.id,
        VisitRequest.pet_id == pet_id,
        VisitRequest.status == "Pending"
    ).first()
    
    if existing_user_visit:
        return {
            "success": False,
            "error": "pending_request_exists",
            "message": "You already have a pending visit request for this pet.",
            "existing_request": {
                "id": existing_user_visit.id,
                "status": existing_user_visit.status,
                "requested_at": existing_user_visit.requested_at.isoformat()
            }
        }
    
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

    if previous_status ==  VisitRequestStatus.Pending and payload.new_status == VisitRequestStatus.Confirmed:
        background_tasks.add_task(
            send_visit_confirmation,
            adopter_name=adopter.full_name,
            adopter_email=adopter.email,
            pet_name=pet.name,
            visit_time=visit.requested_at.strftime("%Y-%m-%d %I:%M %p")
        )

    return {"message": f"Visit status updated to {payload.new_status}"}

visit_requests_router = router
