/**
 * Claude Haiku helper — server-side only.
 * Used for ReAct-style validation of qualification answers.
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

type ValidationResult =
  | { valid: true; normalised: string }
  | { valid: false; reask: string };

/**
 * Validate any qualification answer using the ReAct framework.
 *
 * THOUGHT: Is the answer plausible + on-topic?
 *   - If question has options (buttons/list), does it match or map to one?
 *   - If free-text, is it gibberish/evasive/off-topic?
 * ACTION: Accept with normalised value, or reject with re-ask message.
 *
 * Fail-open: if Claude fails, accept the answer (don't block the flow).
 */
export async function validateAnswer(
  question: string,
  userAnswer: string,
  options?: string[],
): Promise<ValidationResult> {
  const trimmed = userAnswer.trim();
  if (trimmed.length === 0) {
    return { valid: false, reask: `I didn't catch that — could you try again? ${question}` };
  }

  let system: string;
  let userPrompt: string;

  if (options && options.length > 0) {
    // Structured question — user's answer must map to one of the options
    system = `You are a validation agent for a CRM lead qualification system. A question has been asked with a fixed set of allowed answers. The user replied with free-form text instead of tapping a button.

Use the ReAct framework:
1. THOUGHT: Reason whether the user's answer clearly maps to ONE of the allowed options.
   - Exact match or close synonym → VALID
   - Clear intent (e.g. "buying" → "Buy", "looking to purchase" → "Buy") → VALID
   - Gibberish (random letters, nonsense) → INVALID
   - Evasion ("idk", "whatever", "none") → INVALID
   - Ambiguous or off-topic → INVALID
2. ACTION: Output one of two formats with NO other text.

Respond with EXACTLY one of:

VALID: <the exact allowed option it maps to>

or

INVALID: <one-sentence friendly re-ask that lists the options>

Examples:

Question: "Are you looking to buy, sell, or rent?"
Options: ["Buy", "Sell", "Rent"]
Answer: "buying"
→ VALID: Buy

Question: "Are you looking to buy, sell, or rent?"
Options: ["Buy", "Sell", "Rent"]
Answer: "fddsds"
→ INVALID: I didn't catch that — could you let me know if you're looking to Buy, Sell, or Rent?

Question: "What type of property?"
Options: ["HDB", "EC", "Private Condo", "Landed", "Commercial"]
Answer: "4 room hdb"
→ VALID: HDB

Question: "What type of property?"
Options: ["HDB", "EC", "Private Condo", "Landed", "Commercial"]
Answer: "something nice"
→ INVALID: Could you pick one: HDB, EC, Private Condo, Landed, or Commercial?`;

    userPrompt = `Question: "${question}"\nAllowed options: ${options.join(", ")}\nUser answer: "${userAnswer}"`;
  } else {
    // Free-text question — validate it's on-topic and sensible
    system = `You are a validation agent for a CRM lead qualification system. Determine whether a user's free-text answer is a plausible, on-topic response.

Use the ReAct framework:
1. THOUGHT: Reason about whether the answer makes sense for the question.
   - On-topic ? short but relevant answers are fine (e.g. "Tampines", "3 months")
   - Gibberish (random letters) → INVALID
   - Evasion ("idk", "whatever") → INVALID
   - Off-topic (asking something back, unrelated) → INVALID
2. ACTION: Output one of two formats with NO other text.

Respond with EXACTLY one of:

VALID: <cleaned/normalised version of the answer>

or

INVALID: <one-sentence friendly re-ask that repeats the question>

Examples:

Question: "What is your preferred location?"
Answer: "East Coast District 15"
→ VALID: East Coast District 15

Question: "What is your preferred location?"
Answer: "asdfghjkl"
→ INVALID: That didn't look right — could you share the area or district you're interested in?

Question: "When are you looking to move?"
Answer: "idk"
→ INVALID: No worries if you're unsure — a rough estimate works. When are you hoping to move?`;

    userPrompt = `Question: "${question}"\nAnswer: "${userAnswer}"`;
  }

  const response = await callClaude(system, [{ role: "user", content: userPrompt }], 200);

  if (!response) {
    // Fail-open
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

  return { valid: true, normalised: trimmed };
}
