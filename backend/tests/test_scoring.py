"""Unit tests for generic qualification scoring."""
from app.qualification.scoring import compute_score, score_to_verdict
from app.qualification.state_machine import Verdict

CONFIG = {
    "questions": [
        {"key": "interest", "type": "text"},
        {"key": "budget", "type": "list"},
        {"key": "timeline", "type": "buttons"},
    ],
    "qualify_threshold": 55,
    "hot_threshold": 75,
}


def test_no_answers_low_score():
    score = compute_score({}, CONFIG)
    assert score < 35
    assert score_to_verdict(score, CONFIG) == Verdict.DISQUALIFIED


def test_partial_answers_nurture():
    score = compute_score({"interest": "looking for help"}, CONFIG)
    assert 20 <= score < 55
    assert score_to_verdict(score, CONFIG) in (Verdict.NURTURE, Verdict.DISQUALIFIED)


def test_full_answers_high_budget_hot():
    collected = {
        "interest": "Full renovation",
        "budget": "$50k+",
        "timeline": "ASAP",
    }
    score = compute_score(collected, CONFIG)
    assert score >= 75
    assert score_to_verdict(score, CONFIG) == Verdict.QUALIFIED_HOT


def test_full_answers_low_urgency_warm():
    collected = {
        "interest": "Kitchen upgrade",
        "budget": "$5k - $20k",
        "timeline": "Just exploring",
    }
    score = compute_score(collected, CONFIG)
    assert 35 <= score < 75
    assert score_to_verdict(score, CONFIG) in (Verdict.QUALIFIED_WARM, Verdict.NURTURE)


def test_custom_thresholds():
    custom = {**CONFIG, "qualify_threshold": 40, "hot_threshold": 60}
    collected = {"interest": "yes", "budget": "$20k-$50k", "timeline": "1-3 months"}
    score = compute_score(collected, custom)
    verdict = score_to_verdict(score, custom)
    assert verdict in (Verdict.QUALIFIED_HOT, Verdict.QUALIFIED_WARM)
