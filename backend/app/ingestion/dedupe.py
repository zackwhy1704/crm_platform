"""
30-day deduplication by phone number hash.

If the same phone submits multiple times within 30 days, we update the
attribution on the existing lead (new UTMs, new ad_id) but do NOT re-trigger
the qualification conversation. Prevents double-billing of leads.

M1 stub.
"""
import hashlib


def phone_hash(phone: str, form_id: str = "") -> str:
    """SHA-256 of phone + form_id for dedupe lookup."""
    return hashlib.sha256(f"{phone}|{form_id}".encode()).hexdigest()


def is_duplicate(phone: str, form_id: str = "") -> bool:
    """Check Supabase leads table for existing record within 30 days. M2."""
    raise NotImplementedError("M2")
