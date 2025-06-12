from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session
from backend.core.database import SessionLocal
from backend.models.visit_request import VisitRequest, VisitRequestStatus
from backend.logic.emails import send_visit_reminder
from datetime import datetime, timedelta
from backend.models.user import User
from backend.models.pet import Pet

def send_reminder_emails():
    db: Session = SessionLocal()
    try:
        target_date = (datetime.utcnow() + timedelta(days=1)).date()

        visits = db.query(VisitRequest).filter(
            VisitRequest.status == VisitRequestStatus.Confirmed,
            VisitRequest.requested_at >= datetime.combine(target_date, datetime.min.time()),
            VisitRequest.requested_at <= datetime.combine(target_date, datetime.max.time())
        ).all()

        for visit in visits:
            user = db.query(User).filter(User.id == visit.user_id).first()
            pet = db.query(Pet).filter(Pet.id == visit.pet_id).first()

            if user and pet:
                send_visit_reminder(
                    adopter_name=user.full_name,
                    adopter_email=user.email,
                    pet_name=pet.name,
                    visit_time=visit.requested_at.strftime("%Y-%m-%d %I:%M %p")
                )
    finally:
        db.close()

def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(send_reminder_emails, trigger='cron', hour=9)
    scheduler.start()
