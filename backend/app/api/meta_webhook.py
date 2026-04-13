"""
Meta Lead Ads webhook receiver.

Flow:
  1. Meta verifies endpoint via GET with hub.challenge
  2. On new lead, Meta POSTs a webhook with leadgen_id
  3. We fetch the full lead data via Graph API using the leadgen_id
  4. Normalise → forward to ingestion pipeline

M1 stub: only handles verification + logs payload. Full fetch+normalise in M2.
"""
import hashlib
import hmac
import logging

from fastapi import APIRouter, Header, HTTPException, Query, Request

from app.config import META_APP_SECRET, META_LEAD_ADS_VERIFY_TOKEN

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/lead-ads")
async def verify_meta_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
):
    """Meta webhook subscription verification (one-time on setup)."""
    if hub_mode == "subscribe" and hub_verify_token == META_LEAD_ADS_VERIFY_TOKEN:
        logger.info("Meta webhook verified")
        return int(hub_challenge) if hub_challenge else "ok"
    raise HTTPException(status_code=403, detail="Verification failed")


@router.post("/lead-ads")
async def receive_meta_lead(
    request: Request,
    x_hub_signature_256: str = Header(None, alias="X-Hub-Signature-256"),
):
    """
    Receive a new lead from Meta Lead Ads.

    M1 stub: verifies HMAC + logs. Full implementation in M2:
      - Parse leadgen_id from payload
      - Fetch full lead data via Graph API
      - Normalise to LeadIngestPayload schema
      - Forward to ingestion pipeline (internal call to leads.ingest)
    """
    body = await request.body()

    # HMAC verification (skip in dev if secret not set)
    if META_APP_SECRET and x_hub_signature_256:
        expected = "sha256=" + hmac.new(
            META_APP_SECRET.encode(), body, hashlib.sha256
        ).hexdigest()
        if not hmac.compare_digest(expected, x_hub_signature_256):
            logger.warning("Meta webhook HMAC mismatch")
            raise HTTPException(status_code=401, detail="Invalid signature")

    payload = await request.json()
    logger.info("Meta Lead Ads webhook received: %s", payload)

    # TODO M2: extract leadgen_id, fetch full lead, normalise, forward
    return {"status": "received"}
