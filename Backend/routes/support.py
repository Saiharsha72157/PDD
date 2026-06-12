from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Dict, Any
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

from services.auth import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)

SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

class SupportTicketRequest(BaseModel):
    ticket_type: str
    email: str
    message: str

@router.post("/submit-support-ticket")
def submit_support_ticket(data: SupportTicketRequest, current_user: Dict[str, Any] = Depends(get_current_user)):
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        logger.error("SMTP credentials missing.")
        raise HTTPException(status_code=503, detail="Email service is not configured on the backend.")
    
    try:
        clean_password = SMTP_PASSWORD.strip('"\'')
        msg = MIMEMultipart()
        msg["From"] = SMTP_EMAIL
        msg["To"] = SMTP_EMAIL
        msg["Subject"] = f"New Support Ticket: {data.ticket_type.upper()} from {data.email}"

        body = f"Registered User ID: {current_user.get('user_id')}\nUser Email: {data.email}\nTicket Type: {data.ticket_type}\n\nMessage:\n{data.message}"
        msg.attach(MIMEText(body, "plain"))

        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(SMTP_EMAIL, clean_password)
        server.send_message(msg)
        server.quit()
        
        return {"success": True, "message": "Support ticket sent successfully."}
    except Exception as e:
        logger.error(f"[Backend] Error sending support email: {e}")
        raise HTTPException(status_code=503, detail="Failed to send support email.")
