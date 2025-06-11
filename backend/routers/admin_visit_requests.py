from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.models.visit_request import VisitRequest, VisitRequestStatus
from backend.models.user import UserRole
from backend.core.dependencies import get_current_user
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/admin/visit-requests", tags=["Admin Visit Requests"])

class VisitRequestSchema(BaseModel):
    id: int
    user_id: int
    pet_id: int
    requested_at: datetime
    status: str

    class Config:
        from_attributes = True


@router.get("/", response_model=list[VisitRequestSchema])
def view_all_requests(db: Session = Depends(get_db), user=Depends(get_current_user)):
    if user.role != UserRole.Admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return db.query(VisitRequest).all()

@router.put("/{id}/status")
def update_visit_status(
    id: int,
    status: VisitRequestStatus = Body(..., embed=True),
    db: Session = Depends(get_db),
    user=Depends(get_current_user),
):
    if user.role != UserRole.Admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    visit = db.query(VisitRequest).filter(VisitRequest.id == id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")

    visit.status = status
    db.commit()
    return {"message": f"Visit status updated to {status}"}
