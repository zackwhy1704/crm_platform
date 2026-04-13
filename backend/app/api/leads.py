"""
Generic lead ingestion endpoint.

Accepts normalised leads from any source (manual entry, third-party automation,
landing page form). Meta Lead Ads has its own dedicated endpoint in meta_webhook.py
which also normalises and forwards here internally.

Contract: see docs/ingestion-contract.md
"""
from datetime import datetime
from typing import Literal, Optional

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

from app.config import INTERNAL_API_SECRET

router = APIRouter()


class LeadContact(BaseModel):
    name: str
    wa_phone: str = Field(..., description="E.164 format, e.g. +6591234567")
    email: Optional[str] = None
    wa_optin: bool = True


class LeadConsent(BaseModel):
    contact: bool
    storage: bool
    share_with_client: bool
    timestamp: datetime


class LeadIngestPayload(BaseModel):
    source_platform: Literal[
        "meta_facebook", "meta_instagram", "google", "tiktok",
        "landing_page", "manual",
    ]
    source_campaign_id: Optional[str] = None
    source_ad_id: Optional[str] = None
    source_form_id: Optional[str] = None
    industry: Optional[str] = None  # e.g. 'renovation', 'property', 'healthcare' — or null for generic
    contact: LeadContact
    form_answers: dict = Field(default_factory=dict)
    utm: dict = Field(default_factory=dict)
    consent: LeadConsent


@router.post("/ingest")
async def ingest_lead(
    payload: LeadIngestPayload,
    authorization: Optional[str] = Header(None),
):
    """
    Ingest a new lead.

    M1 stub: validates payload only. Full pipeline (normalise → dedupe → DNC →
    persist → enqueue qualification) will be wired in M2.
    """
    # Auth check — shared secret for internal calls
    if authorization != f"Bearer {INTERNAL_API_SECRET}":
        raise HTTPException(status_code=401, detail="Unauthorized")

    # TODO M2: call ingestion.normaliser → ingestion.dedupe → persist to Supabase
    # TODO M2: enqueue Celery task lead_qualification.start_conversation
    return {
        "status": "accepted",
        "lead_id": f"ld_stub_{payload.contact.wa_phone[-4:]}",
        "message": "M1 stub — full pipeline not yet wired",
    }
