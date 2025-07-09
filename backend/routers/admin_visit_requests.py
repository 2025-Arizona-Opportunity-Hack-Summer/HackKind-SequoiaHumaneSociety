from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session, joinedload
from backend.core.database import get_db
from backend.models.visit_request import VisitRequest, VisitRequestStatus
from backend.models.user import User, UserRole
from backend.core.dependencies import get_current_user
from backend.schemas.visit_schema import VisitRequestSchema
from backend.models.pet import Pet

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
    visits = db.query(VisitRequest)\
        .options(
            joinedload(VisitRequest.user),
            joinedload(VisitRequest.pet)
        )\
        .all()
    
    result = []
    for visit in visits:
        if not visit.user or not visit.pet:
            continue
            
        visit_dict = {
            'id': visit.id,
            'user_id': visit.user_id,
            'pet_id': visit.pet_id,
            'requested_at': visit.requested_at,
            'status': visit.status.value,  
            'user': {
                'id': visit.user.id,
                'full_name': visit.user.full_name,
                'email': visit.user.email,
                'phone_number': getattr(visit.user, 'phone_number', None)
            },
            'pet': {
                'id': visit.pet.id,
                'name': visit.pet.name,
                'breed': getattr(visit.pet, 'breed', None),
                'image_url': getattr(visit.pet, 'image_url', None)
            }
        }
        result.append(visit_dict)
    
    return result

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

    previous_status = visit.status
    visit.status = status.value  # Assign the string value to the Enum column
    db.commit()
    db.refresh(visit)

    # Send confirmation email if status changed from Pending to Confirmed
    if previous_status.value.lower() == VisitRequestStatus.Pending.value.lower() and status.value.lower() == VisitRequestStatus.Confirmed.value.lower():
        adopter = db.query(User).filter(User.id == visit.user_id).first()
        pet = db.query(Pet).filter(Pet.id == visit.pet_id).first()
        if adopter is not None and pet is not None:
            from backend.logic.emails import send_visit_confirmation
            send_visit_confirmation(
                adopter_name=str(adopter.full_name) if adopter.full_name else "Adopter",
                adopter_email=str(adopter.email),
                pet_name=str(pet.name),
                visit_time=visit.requested_at.strftime("%Y-%m-%d %I:%M %p")
            )

    return {"message": f"Visit status updated to {status.value}"}
