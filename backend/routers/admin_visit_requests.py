from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from backend.core.database import get_db
from backend.models.visit_request import VisitRequest, VisitRequestStatus
from backend.models.user import User, UserRole
from backend.core.dependencies import get_current_user
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from backend.schemas.visit_schema import VisitRequestSchema

router = APIRouter(prefix="/admin/visit-requests", tags=["Admin Visit Requests"])

def require_admin(user: User = Depends(get_current_user)):
    if user.role != UserRole.Admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

@router.get("/", response_model=list[VisitRequestSchema])
def view_all_requests(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    return db.query(VisitRequest).all()

@router.put("/{id}/status")
def update_visit_status(
    id: int,
    status: VisitRequestStatus = Body(..., embed=True),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    visit = db.query(VisitRequest).filter(VisitRequest.id == id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")

    visit.status = status
    db.commit()
    return {"message": f"Visit status updated to {status}"}
