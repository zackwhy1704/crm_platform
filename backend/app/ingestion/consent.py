"""
PDPA consent logging.

Every lead ingestion must have explicit consent for:
  1. Contact (WA / SMS / email)
  2. Data storage
  3. Sharing with client SME

Consent is written immutably to consent_log table with timestamp + IP.
Retained 7 years per PDPC guidance.

M1 stub.
"""
from datetime import datetime


def log_consent(
    lead_id: str,
    contact: bool,
    storage: bool,
    share_with_client: bool,
    ip: str = "",
    timestamp: datetime | None = None,
) -> None:
    """Append immutable consent record. M2."""
    raise NotImplementedError("M2")
