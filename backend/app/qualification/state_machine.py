"""
Generic qualification state machine.

Instead of hardcoded BANT questions for renovation, the state machine reads
a client's `qualification_config` from the DB and walks through each question
dynamically. Each question can be:
  - type: "text"    → free-text reply, Claude classifies
  - type: "buttons" → WA interactive buttons (max 3 options)
  - type: "list"    → WA interactive list (4+ options)

State is stored in wa_sessions.collected (JSONB) and wa_sessions.current_step (int).

Example qualification_config:
{
  "questions": [
    {"key": "interest", "text": "What are you interested in?", "type": "text"},
    {"key": "budget", "text": "Budget range?", "type": "list", "options": ["Under $5k", "$5-20k", "$20-50k", "$50k+"]},
    {"key": "timeline", "text": "When to start?", "type": "buttons", "options": ["ASAP", "1-3 months", "Exploring"]}
  ],
  "qualify_threshold": 55,
  "hot_threshold": 75,
  "disqualify_rules": [
    {"key": "budget", "value": "Under $5k", "action": "nurture"}
  ]
}
"""
from enum import Enum
from typing import Optional


class QualState(str, Enum):
    NEW = "new"
    QUALIFYING = "qualifying"
    COMPLETE = "complete"


class Verdict(str, Enum):
    QUALIFIED_HOT = "qualified_hot"
    QUALIFIED_WARM = "qualified_warm"
    NURTURE = "nurture"
    DISQUALIFIED = "disqualified"


# --- Default config if client has none ---
DEFAULT_QUALIFICATION_CONFIG = {
    "questions": [
        {
            "key": "interest",
            "text": "What are you looking for?",
            "type": "text",
        },
        {
            "key": "budget",
            "text": "What's your rough budget?",
            "type": "list",
            "options": ["Under $5k", "$5k - $20k", "$20k - $50k", "$50k+"],
        },
        {
            "key": "timeline",
            "text": "When are you hoping to start?",
            "type": "buttons",
            "options": ["ASAP", "1-3 months", "Just exploring"],
        },
    ],
    "qualify_threshold": 55,
    "hot_threshold": 75,
    "disqualify_rules": [],
}


def build_wa_payload(question: dict) -> dict:
    """Build the WhatsApp interactive payload for a question."""
    q_type = question.get("type", "text")
    text = question["text"]
    options = question.get("options", [])

    if q_type == "buttons" and options:
        return {
            "kind": "buttons",
            "body": text,
            "buttons": [
                {"id": f"{question['key']}_{i}", "title": opt[:20]}
                for i, opt in enumerate(options[:3])
            ],
        }

    if q_type == "list" and options:
        return {
            "kind": "list",
            "body": text,
            "button_text": "Select",
            "sections": [
                {
                    "title": "Options",
                    "rows": [
                        {"id": f"{question['key']}_{i}", "title": opt[:24], "description": ""}
                        for i, opt in enumerate(options)
                    ],
                }
            ],
        }

    # Fallback: plain text question
    return {"kind": "text", "body": text}


def next_action(
    config: dict,
    current_step: int,
    collected: dict,
    reply_value: Optional[str] = None,
) -> dict:
    """
    Given current step + collected answers + latest reply, return:
      - next WA message to send + next step
      - OR verdict if all questions answered

    Returns dict with keys:
      next_step: int
      next_state: QualState
      send: dict | None   (WA payload)
      verdict: Verdict | None
      collected: dict      (updated)
    """
    questions = config.get("questions", [])
    disqualify_rules = config.get("disqualify_rules", [])
    updated_collected = dict(collected)

    # Store latest reply if we have one
    if reply_value is not None and current_step > 0 and current_step <= len(questions):
        prev_q = questions[current_step - 1]
        updated_collected[prev_q["key"]] = reply_value

        # Check disqualify rules
        for rule in disqualify_rules:
            if updated_collected.get(rule["key"]) == rule["value"]:
                action = rule.get("action", "disqualified")
                verdict = Verdict.NURTURE if action == "nurture" else Verdict.DISQUALIFIED
                return {
                    "next_step": current_step,
                    "next_state": QualState.COMPLETE,
                    "send": None,
                    "verdict": verdict,
                    "collected": updated_collected,
                }

    # If more questions remain, send the next one
    if current_step < len(questions):
        q = questions[current_step]
        return {
            "next_step": current_step + 1,
            "next_state": QualState.QUALIFYING,
            "send": build_wa_payload(q),
            "verdict": None,
            "collected": updated_collected,
        }

    # All questions answered — compute verdict
    return {
        "next_step": current_step,
        "next_state": QualState.COMPLETE,
        "send": None,
        "verdict": None,  # scoring.py computes this
        "collected": updated_collected,
    }
