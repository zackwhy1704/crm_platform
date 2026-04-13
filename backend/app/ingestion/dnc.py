"""
Singapore DNC (Do Not Call) Registry check.

Note: DNC only applies to voice calls and SMS. WhatsApp is exempt.
Since M1 is WA-only, DNC is not strictly required — but we log it as
a future-ready stub for when voice AI calling is added in M2+.

PDPC provides a bulk DNC check API; for v1 we skip and mark all as "not_checked".
"""
from enum import Enum


class DNCStatus(str, Enum):
    NOT_CHECKED = "not_checked"
    CLEAR = "clear"
    BLOCKED = "blocked"


def check_dnc(phone: str) -> DNCStatus:
    """Check phone against PDPC DNC registry. Stub for M1 (WA-only)."""
    return DNCStatus.NOT_CHECKED
