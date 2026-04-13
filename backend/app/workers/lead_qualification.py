"""
Lead qualification worker.

Two task types:
  - start_conversation: triggered on new lead ingestion. Sends welcome WA message
    and asks first BANT question (property type via interactive list).
  - process_reply: triggered on incoming WA webhook message. Runs the state
    machine turn, sends next question or computes final verdict.

M1 stub: task signatures defined, real logic in M2.
"""
import logging

from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="app.workers.lead_qualification.start_conversation")
def start_conversation(lead_id: str) -> dict:
    """Open a qualification conversation with a freshly ingested lead."""
    logger.info("[M1 stub] start_conversation for lead_id=%s", lead_id)
    # TODO M2:
    #   1. Load lead from DB
    #   2. Create wa_session (state=AWAIT_PROPERTY_TYPE)
    #   3. Send welcome text + first interactive list
    return {"status": "stub", "lead_id": lead_id}


@celery_app.task(name="app.workers.lead_qualification.process_reply")
def process_reply(wa_phone: str, message: dict) -> dict:
    """Process an incoming WA reply against the current state machine state."""
    logger.info("[M1 stub] process_reply from=%s message=%s", wa_phone, message)
    # TODO M2:
    #   1. Load wa_session by phone
    #   2. Call qualification.state_machine.handle(session, message)
    #   3. Persist new session state
    #   4. If verdict reached → enqueue assignment
    return {"status": "stub", "wa_phone": wa_phone}
