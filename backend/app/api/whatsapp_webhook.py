"""
WhatsApp Cloud API webhook receiver.

Handles incoming messages from leads during qualification conversations.
Routes each message to the qualification state machine based on wa_phone.

M1 stub: verifies webhook + logs incoming messages. Full routing in M2.
"""
import logging

from fastapi import APIRouter, HTTPException, Query, Request

from app.config import WHATSAPP_VERIFY_TOKEN

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("")
async def verify_whatsapp_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
):
    """WhatsApp webhook subscription verification."""
    if hub_mode == "subscribe" and hub_verify_token == WHATSAPP_VERIFY_TOKEN:
        logger.info("WhatsApp webhook verified")
        return int(hub_challenge) if hub_challenge else "ok"
    raise HTTPException(status_code=403, detail="Verification failed")


@router.post("")
async def receive_whatsapp_message(request: Request):
    """
    Receive incoming WhatsApp message.

    Payload shape (Meta Cloud API):
      entry[0].changes[0].value.messages[0]
        - from: phone number
        - type: text | interactive | image | ...
        - text.body (if text)
        - interactive.button_reply.id (if button tap)
        - interactive.list_reply.id (if list select)

    M1 stub: logs only. M2: route to qualification.state_machine.handle_message.
    """
    payload = await request.json()
    logger.info("WhatsApp webhook received: %s", payload)

    # TODO M2: extract message, look up/create wa_session, call state machine
    return {"status": "received"}
