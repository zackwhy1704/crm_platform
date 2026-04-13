"""
Platform-specific payload → internal schema normaliser.

Each ad platform delivers lead data differently:
  - Meta Lead Ads: field_data list with name/value dicts
  - TikTok: flat dict
  - Google: depends on Lead Form Extension or LP form
  - Landing page: already internal schema

The normaliser maps every platform's shape to LeadIngestPayload (see api/leads.py).

M1 stub: function signatures only. M2: real field mappings per platform.
"""
from app.api.leads import LeadIngestPayload


def normalise_meta_lead(raw: dict) -> LeadIngestPayload:
    """Map Meta Lead Ads webhook → LeadIngestPayload. M2."""
    raise NotImplementedError("M2")


def normalise_tiktok_lead(raw: dict) -> LeadIngestPayload:
    raise NotImplementedError("M3")


def normalise_google_lead(raw: dict) -> LeadIngestPayload:
    raise NotImplementedError("M3")
