"""
Thin wrapper around Anthropic Claude API for qualification use cases.

We use Claude Haiku 4.5 — fast, cheap, sufficient for:
  - Generating friendly conversational wrappers around structured questions
  - Summarising qualified leads for the SME client
  - Classifying off-script replies into intent buckets

Set FAKE_CLAUDE=true to return canned responses during M1 local dev.
"""
import logging
from typing import Optional

from app.config import ANTHROPIC_API_KEY, CLAUDE_MODEL, FAKE_CLAUDE

logger = logging.getLogger(__name__)


async def generate_reply(
    system_prompt: str,
    user_message: str,
    conversation_history: Optional[list[dict]] = None,
    max_tokens: int = 200,
) -> str:
    """Generate a single assistant reply given conversation history."""
    if FAKE_CLAUDE:
        logger.info("[FAKE_CLAUDE] returning canned reply")
        return "Got it! Give me a moment..."

    try:
        from anthropic import AsyncAnthropic
    except ImportError:
        logger.error("anthropic SDK not installed — run pip install anthropic")
        return ""

    client = AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
    messages = list(conversation_history or [])
    messages.append({"role": "user", "content": user_message})

    try:
        resp = await client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=max_tokens,
            system=system_prompt,
            messages=messages,
        )
        return resp.content[0].text if resp.content else ""
    except Exception as e:
        logger.error("Claude API error: %s", e)
        return ""


async def summarise_lead(lead_data: dict, conversation: list[dict]) -> str:
    """Generate the 2-sentence summary shown to the SME client."""
    from app.qualification.prompts import SUMMARY_PROMPT

    prompt = SUMMARY_PROMPT.format(
        lead_data=lead_data,
        conversation="\n".join(f"{m['role']}: {m['content']}" for m in conversation),
    )
    return await generate_reply(
        system_prompt="You are a concise lead summariser.",
        user_message=prompt,
        max_tokens=150,
    )
