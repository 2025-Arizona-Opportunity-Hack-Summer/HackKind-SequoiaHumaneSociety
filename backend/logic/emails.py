from mailersend import emails
from dotenv import load_dotenv
import os

load_dotenv(dotenv_path="/Users/nicolasgarzon/Codes/HackKind-SequoiaHumaneSociety/.env")
mailer = emails.NewEmail(os.getenv('MAILER_SEND_API_KEY'))
origin_email = os.getenv("ORIGIN_EMAIL")

def send_visit_confirmation(adopter_name: str, adopter_email: str, pet_name: str, visit_time: str):
    print(f"[DEBUG] send_visit_confirmation called for {adopter_email}")
    mail_body = {}

    mail_from = {
        "name": "Sequoia Humane Society",
        "email": origin_email,
    }

    recipients = [
        {
            "name": adopter_name,
            "email": adopter_email,
        }
    ]

    reply_to = {
        "name": "Sequoia Humane Society",
        "email": origin_email,
    }
    try:
        mailer.set_mail_from(mail_from, mail_body)
        mailer.set_mail_to(recipients, mail_body)
        mailer.set_subject(f"🐾 Your Visit to Meet {pet_name} is Scheduled!", mail_body)
        mailer.set_html_content(f"<p>Hi {adopter_name}!</p><p>Your visit to meet <strong>{pet_name}</strong> is scheduled for <strong>{visit_time}</strong>.</p><p>See you soon! 🐶🐱</p>", mail_body)
        mailer.set_plaintext_content(f"Hi {adopter_name}! Your visit to meet {pet_name} has been scheduled for {visit_time}.", mail_body)
        mailer.set_reply_to(reply_to, mail_body)
        print(f"[DEBUG] About to call mailer.send for {adopter_email}")
        response = mailer.send(mail_body)
        print(f"[DEBUG] mailer.send response: {response}")
        print(f"[DEBUG] mailer.send completed for {adopter_email}")
    except Exception as e:
        print(f"[ERROR] Failed to send confirmation email to {adopter_email}: {e}")

def send_visit_reminder(adopter_name: str, adopter_email: str, pet_name: str, visit_time: str):
    mail_body = {}

    mail_from = {
        "name": "Sequoia Humane Society",
        "email": origin_email,
    }

    recipients = [
        {
            "name": adopter_name,
            "email": adopter_email, 
        }
    ]

    reply_to = {
        "name": "Sequoia Humane Society",
        "email": origin_email,
    }

    mailer.set_mail_from(mail_from, mail_body)
    mailer.set_mail_to(recipients, mail_body)
    mailer.set_subject(f"⏰ Reminder: Your Visit to Meet {pet_name} is Coming Up!", mail_body)

    mailer.set_html_content(
        f"""
        <p>Hi {adopter_name},</p>
        <p>This is a friendly reminder about your upcoming visit to meet <strong>{pet_name}</strong>!</p>
        <p><strong>Scheduled time:</strong> {visit_time}</p>
        <p>If you need to reschedule or have any questions, just reply to this email — we’re happy to help.</p>
        <p>Looking forward to seeing you! 🐶🐱</p>
        <p style="margin-top: 24px;">— The Shelter Team</p>
        """,
        mail_body
    )

    mailer.set_plaintext_content(
        f"Hi {adopter_name},\n\nJust a quick reminder that your visit to meet {pet_name} is coming up!\n\nScheduled time: {visit_time}\n\nFeel free to reply if you need to make changes. We’re excited to meet you!\n\n— The Shelter Team",
        mail_body
    )

    mailer.set_reply_to(reply_to, mail_body)
    mailer.send(mail_body)

