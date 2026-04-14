/**
 * Claude Haiku helper — server-side only.
 * Used for ReAct-style validation of free-text qualification answers.
 */

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";

type ClaudeMessage = { role: "user" | "assistant"; content: string };

async function callClaude(
  system: string,
  messages: ClaudeMessage[],
  maxTokens = 300,
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[claude] ANTHROPIC_API_KEY not set");
    return "";
  }

  try {
    const resp = await fetch(ANTHROPIC_API, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.CLAUDE_MODEL ?? "claude-haiku-4-5-20251001",
        max_tokens: maxTokens,
        system,
        messages,
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      console.error("[claude] API error:", resp.status, err.slice(0, 300));
      return "";
    }

    const data = await resp.json();
    return data?.content?.[0]?.text ?? "";
  } catch (err) {
    console.error("[claude] fetch error:", err);
    return "";
  }
}

/**
 * ReAct-style validation of a free-text answer.
 *
 * Reasoning (Thought): Claude evaluates whether the input is a plausible,
 * on-topic answer to the question asked.
 * Action: Either accepts the answer (returns it normalised) or rejects with
 * a polite re-ask prompt for the user.
 *
 * Returns:
 *   { valid: true, normalised: string }  — answer is good, use this value
 *   { valid: false, reask: string }      — send this re-ask message to the user
 */
export async function validateAnswer(
  question: string,
  userAnswer: string,
): Promise<{ valid: true; normalised: string } | { valid: false; reask: string }> {
  // Skip validation for very obviously valid short answers
  const trimmed = userAnswer.trim();
  if (trimmed.length === 0) {
    return { valid: false, reask: "I didn't catch that — could you try again? " + question };
  }

  const system = `You are a validation agent for a CRM lead qualification system. Your job is to determine whether a user's answer is a plausible, on-topic response to the question asked.

Use the ReAct framework:
1. THOUGHT: Reason about whether the answer makes sense for the question. Consider:
   - Is it on-topic?
   - Is it gibberish (random letters, single characters, nonsense)?
   - Is it an evasion ("idk", "whatever", "none of your business")?
   - Is it clearly off-topic (asking something back, unrelated statement)?
   - Short but valid answers ARE OK (e.g. "Tampines" for location, "3 months" for timeline)
2. ACTION: Output one of two verdicts.

Respond with EXACTLY one of these two formats (no other text):

VALID: <cleaned/normalised version of the answer>

or

INVALID: <one-sentence friendly re-ask that references what was unclear and repeats the question>

Examples:

Question: "What is your budget range?"
Answer: "around 500k to 1 million"
→ VALID: $500k - $1M

Question: "What is your preferred location?"
Answer: "asdfghjkl"
→ INVALID: That didn't look right — could you share the area or district you're interested in?

Question: "When are you looking to move?"
Answer: "idk"
→ INVALID: No worries if you're unsure — a rough estimate works. When are you hoping to move?

Question: "What is your preferred location?"
Answer: "East Coast District 15"
→ VALID: East Coast District 15`;

  const userPrompt = `Question: "${question}"\nAnswer: "${userAnswer}"`;

  const response = await callClaude(system, [{ role: "user", content: userPrompt }], 200);

  if (!response) {
    // If Claude fails, fall back to accepting the answer (fail-open)
    return { valid: true, normalised: trimmed };
  }

  const cleaned = response.trim();
  if (cleaned.startsWith("VALID:")) {
    const normalised = cleaned.replace(/^VALID:\s*/, "").trim();
    return { valid: true, normalised: normalised || trimmed };
  }
  if (cleaned.startsWith("INVALID:")) {
    const reask = cleaned.replace(/^INVALID:\s*/, "").trim();
    return { valid: false, reask: reask || `Could you try again? ${question}` };
  }

  // Unexpected response — fail-open
  return { valid: true, normalised: trimmed };
}
