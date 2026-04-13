"""
Nurture sequence worker (M3).

14-day drip for leads that fail initial qualification but show some interest.
Uses Celery ETA scheduling for each step.

M1/M2: stub. Implemented in M3.
"""
import logging

from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="app.workers.nurture.run_step")
def run_step(lead_id: str, step_number: int) -> dict:
    """Execute one step of the nurture sequence."""
    logger.info("[M3 stub] nurture step=%s for lead_id=%s", step_number, lead_id)
    return {"status": "stub"}
