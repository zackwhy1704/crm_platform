"""
Generic lead scoring.

Scoring is based on how many questions were answered + engagement signals.
Client-specific scoring rules come from qualification_config.

Score components:
  - Completion (50 pts): % of questions answered × 50
  - Engagement (25 pts): responsiveness, speed of reply (future: AI-assessed)
  - Answer quality (25 pts): specific budget > vague, urgent timeline > exploring

Verdict thresholds are configurable per client via qualification_config:
  hot_threshold (default 75)
  qualify_threshold (default 55)
  Below 35 → DISQUALIFIED
  35-qualify_threshold → NURTURE
"""
from app.qualification.state_machine import Verdict


# --- Timeline urgency heuristic ---
TIMELINE_SIGNALS = {
    "asap": 25,
    "immediately": 25,
    "within 1 month": 22,
    "1-3 months": 15,
    "3-6 months": 10,
    "just exploring": 3,
    "exploring": 3,
}

# --- Budget magnitude heuristic ---
BUDGET_SIGNALS = {
    "$50k+": 25,
    "$50k and above": 25,
    "$20k - $50k": 20,
    "$20k-$50k": 20,
    "$5k - $20k": 12,
    "$5k-$20k": 12,
    "under $5k": 5,
}


def compute_score(collected: dict, config: dict) -> int:
    """Compute 0-100 score from collected answers + config."""
    questions = config.get("questions", [])
    if not questions:
        return 50  # no questions defined, default mid-score

    # Completion score: how many questions were answered
    answered = sum(1 for q in questions if q["key"] in collected)
    completion = int((answered / len(questions)) * 50)

    # Answer quality score: check for known high-value signals
    quality = 0
    for key, value in collected.items():
        if not isinstance(value, str):
            continue
        val_lower = value.lower().strip()
        # Check timeline signals
        for signal, pts in TIMELINE_SIGNALS.items():
            if signal in val_lower:
                quality = max(quality, pts)
                break
        # Check budget signals
        for signal, pts in BUDGET_SIGNALS.items():
            if signal.lower() in val_lower:
                quality = max(quality, pts)
                break

    # Engagement placeholder (future: measure reply speed, message length)
    engagement = 15 if answered >= 2 else 5

    return min(completion + quality + engagement, 100)


def score_to_verdict(score: int, config: dict) -> Verdict:
    """Map score to verdict using client-specific thresholds."""
    hot = config.get("hot_threshold", 75)
    qualify = config.get("qualify_threshold", 55)

    if score >= hot:
        return Verdict.QUALIFIED_HOT
    if score >= qualify:
        return Verdict.QUALIFIED_WARM
    if score >= 35:
        return Verdict.NURTURE
    return Verdict.DISQUALIFIED
