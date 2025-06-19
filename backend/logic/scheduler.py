from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session
from backend.core.database import SessionLocal
from backend.models.visit_request import VisitRequest, VisitRequestStatus
from backend.logic.emails import send_visit_reminder
from backend.logic.matching_logic import refresh_all_matches
from datetime import datetime, timedelta, timezone
from backend.models.user import User
from backend.models.pet import Pet
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def send_reminder_emails():
    db: Session = SessionLocal()
    try:
        target_date = (datetime.now(timezone.utc) + timedelta(days=1)).date()

        visits = db.query(VisitRequest).filter(
            VisitRequest.status == VisitRequestStatus.Confirmed,
            VisitRequest.requested_at >= datetime.combine(target_date, datetime.min.time(), timezone.utc),
            VisitRequest.requested_at <= datetime.combine(target_date, datetime.max.time(), timezone.utc)
        ).all()

        logger.info(f"Found {len(visits)} visits to send reminders for")

        for visit in visits:
            try:
                user = db.query(User).filter(User.id == visit.user_id).first()
                pet = db.query(Pet).filter(Pet.id == visit.pet_id).first()

                if user and pet:
                    send_visit_reminder(
                        adopter_name=user.full_name,
                        adopter_email=user.email,
                        pet_name=pet.name,
                        visit_time=visit.requested_at.strftime("%Y-%m-%d %I:%M %p")
                    )
                    logger.info(f"Sent reminder to {user.email} for pet {pet.name}")
                else:
                    logger.warning(f"Missing user or pet for visit {visit.id}")
            except Exception as e:
                logger.error(f"Failed to send reminder for visit {visit.id}: {e}")
                continue
                
    except Exception as e:
        logger.error(f"Error in send_reminder_emails: {e}")
    finally:
        db.close()

def refresh_matches_job():
    db: Session = SessionLocal()
    try:
        logger.info("Starting match refresh job")
        refresh_all_matches(db)
        logger.info("Match refresh job completed successfully")
    except Exception as e:
        logger.error(f"Error in refresh_matches_job: {e}")
    finally:
        db.close()

def start_scheduler():
    scheduler = BackgroundScheduler()
    
    scheduler.add_job(
        send_reminder_emails, 
        trigger='cron', 
        hour=9,
        id='send_reminder_emails',
        replace_existing=True
    )

    scheduler.add_job(
        refresh_matches_job, 
        trigger='cron', 
        hour=3,
        id='refresh_matches_job',
        replace_existing=True
    )

    try:
        scheduler.start()
        logger.info("Scheduler started successfully")
    except Exception as e:
        logger.error(f"Failed to start scheduler: {e}")
        raise
