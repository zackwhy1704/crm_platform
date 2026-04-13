"""
Lead assignment engine.

Assigns qualified leads to client SMEs. Modes (configurable per niche):
  - MANUAL: agency reviews and picks client from dropdown
  - ROUND_ROBIN: equal distribution across clients subscribed to niche
  - SCORE_ROUTED: hot (75+) → premium clients, warm (55-74) → standard
  - GEO_ROUTED: match lead area to client service area

M1: MANUAL only.
M2: ROUND_ROBIN added.
M3: SCORE_ROUTED + GEO_ROUTED.
"""
from enum import Enum
from typing import Optional


class AssignmentMode(str, Enum):
    MANUAL = "manual"
    ROUND_ROBIN = "round_robin"
    SCORE_ROUTED = "score_routed"
    GEO_ROUTED = "geo_routed"


def assign_lead(
    lead_id: str,
    niche: str,
    score: int,
    mode: AssignmentMode = AssignmentMode.MANUAL,
    lead_area: Optional[str] = None,
) -> Optional[str]:
    """
    Assign a qualified lead to a client. Returns client_id or None (if manual/unassigned).
    M2 implementation.
    """
    raise NotImplementedError("M2")
