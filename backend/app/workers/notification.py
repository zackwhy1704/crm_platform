"""
Notification worker.

Sends WA messages to:
  - Leads: welcome confirmation, qualification questions
  - Clients (SMEs): new qualified lead assigned
"""
import logging

from app.whatsapp.client import send_text_sync
from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="app.workers.notification.notify_lead_welcome")
def notify_lead_welcome(wa_phone: str, name: str, business_name: str = "our team") -> bool:
    """First-touch welcome message to a lead."""
    body = (
        f"Hi {name}! Thanks for your enquiry. "
        f"I'm Ava from {business_name} — just a few quick questions "
        "so we can connect you with the right person. Should take under 2 minutes."
    )
    return send_text_sync(wa_phone, body)


@celery_app.task(name="app.workers.notification.notify_client_new_lead")
def notify_client_new_lead(client_wa_phone: str, lead_summary: str) -> bool:
    """Alert a client SME that a new qualified lead has been assigned."""
    body = (
        f"New qualified lead assigned!\n\n{lead_summary}\n\n"
        "Open your portal to view full details and reply."
    )
    return send_text_sync(client_wa_phone, body)
