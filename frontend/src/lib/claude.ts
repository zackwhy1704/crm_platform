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

// ---------------------------------------------------------------------------
// Singapore towns / planning areas — used to validate location answers
// ---------------------------------------------------------------------------
const SG_LOCATIONS = [
  // Planning areas
  "Ang Mo Kio", "Bedok", "Bishan", "Boon Lay", "Bukit Batok", "Bukit Merah",
  "Bukit Panjang", "Bukit Timah", "Central Water Catchment", "Changi", "Choa Chu Kang",
  "Clementi", "Downtown Core", "Geylang", "Hougang", "Jurong East", "Jurong West",
  "Kallang", "Marina East", "Marina South", "Marine Parade", "Newton", "Novena",
  "Orchard", "Outram", "Pasir Ris", "Paya Lebar", "Pioneer", "Punggol", "Queenstown",
  "River Valley", "Rochor", "Seletar", "Sembawang", "Sengkang", "Serangoon", "Simei",
  "Singapore River", "Southern Islands", "Straits View", "Tampines", "Tanglin",
  "Tengah", "Toa Payoh", "Tuas", "Western Islands", "Western Water Catchment",
  "Woodlands", "Yishun",
  // Common districts / neighbourhoods
  "CBD", "East Coast", "Holland Village", "Katong", "Little India", "Marina Bay",
  "Robertson Quay", "Sentosa", "Siglap", "Tiong Bahru", "Telok Blangah", "Bukit Gombak",
  // Districts 1-28 (postal)
  ...Array.from({ length: 28 }, (_, i) => `District ${i + 1}`),
];

// ---------------------------------------------------------------------------
// STRICT: exact option match for buttons/list questions.
// No Claude mapping — if user's text doesn't match, re-ask.
// ---------------------------------------------------------------------------
export function validateStrictOptions(
  userAnswer: string,
  options: string[],
  question: string,
): ValidationResult {
  const trimmed = userAnswer.trim();
  if (!trimmed) {
    return { valid: false, reask: reaskWithOptions(question, options) };
  }
  // Case-insensitive exact match only
  const match = options.find((o) => o.toLowerCase() === trimmed.toLowerCase());
  if (match) return { valid: true, normalised: match };

  return { valid: false, reask: reaskWithOptions(question, options) };
}

function reaskWithOptions(question: string, options: string[]): string {
  return `Please tap one of the options below: ${options.join(", ")}.`;
}

// ---------------------------------------------------------------------------
// LOCATION validator — must match a Singapore town / planning area / district.
// First tries local match (fast, deterministic), then uses Claude for
// edge cases (different casing, abbreviations, nearby neighbourhoods).
// ---------------------------------------------------------------------------
export async function validateLocation(
  question: string,
  userAnswer: string,
): Promise<ValidationResult> {
  const trimmed = userAnswer.trim();
  if (!trimmed) {
    return { valid: false, reask: `Could you share which Singapore town or district you're interested in?` };
  }

  // Fast-path: case-insensitive partial match against our known SG list
  const lower = trimmed.toLowerCase();
  const localMatch = SG_LOCATIONS.find(
    (loc) =>
      lower === loc.toLowerCase() ||
      lower.includes(loc.toLowerCase()) ||
      loc.toLowerCase().includes(lower),
  );
  if (localMatch) {
    // Normalise: if user said something close, use the canonical name
    return { valid: true, normalised: trimmed };
  }

  // Claude check for edge cases: abbreviations, multiple areas, or clear
  // rejection (JB, KL, overseas, gibberish)
  const system = `You are validating whether a user's answer is a real location within Singapore (Singapore SG only — NOT Malaysia, NOT overseas).

Use the ReAct framework:
1. THOUGHT: Is this a valid Singapore location?
   - Singapore town / planning area / neighbourhood / district → VALID
   - Abbreviations like "AMK" (Ang Mo Kio), "CCK" (Choa Chu Kang), "TPY" (Toa Payoh) → VALID
   - JB (Johor Bahru), KL (Kuala Lumpur), any Malaysian/overseas location → INVALID
   - Gibberish / random letters / numbers → INVALID
   - Very vague ("anywhere", "doesn't matter") → INVALID
   - Two or more valid SG areas → VALID (preserve as given)
2. ACTION: Output exactly one format.

Respond with EXACTLY one of:

VALID: <canonical Singapore location name(s)>

or

INVALID: <one-sentence friendly re-ask asking for a Singapore area specifically>

Examples:

Answer: "AMK"
→ VALID: Ang Mo Kio

Answer: "JB"
→ INVALID: Sorry — we only cover Singapore. Could you share a Singapore town or district you're interested in?

Answer: "somewhere nice"
→ INVALID: Could you share a specific Singapore town or district? For example, Tampines, Jurong, or District 15.

Answer: "Katong or East Coast"
→ VALID: Katong or East Coast

Answer: "xzcvbnm"
→ INVALID: That didn't look like a location — could you share a Singapore town or district?

Answer: "Bangkok"
→ INVALID: Sorry — we only cover Singapore. Could you share a Singapore area you're interested in?`;

  const userPrompt = `User answer: "${userAnswer}"`;
  const response = await callClaude(system, [{ role: "user", content: userPrompt }], 150);

  if (!response) {
    // Fail-closed on location (safer to re-ask than accept junk)
    return { valid: false, reask: `Could you share a specific Singapore town or district? For example, Tampines, Jurong, or Katong.` };
  }

  const cleaned = response.trim();
  if (cleaned.startsWith("VALID:")) {
    const normalised = cleaned.replace(/^VALID:\s*/, "").trim();
    return { valid: true, normalised: normalised || trimmed };
  }
  if (cleaned.startsWith("INVALID:")) {
    const reask = cleaned.replace(/^INVALID:\s*/, "").trim();
    return { valid: false, reask: reask || `Could you share a specific Singapore area?` };
  }
  return { valid: false, reask: `Could you share a specific Singapore town or district?` };
}

// ---------------------------------------------------------------------------
// GENERIC free-text validator — for open-ended questions without options.
// ---------------------------------------------------------------------------
export async function validateFreeText(
  question: string,
  userAnswer: string,
): Promise<ValidationResult> {
  const trimmed = userAnswer.trim();
  if (!trimmed) {
    return { valid: false, reask: `I didn't catch that — could you try again? ${question}` };
  }

  const system = `You are a validation agent for a CRM lead qualification system. Determine whether a user's free-text answer is a plausible, on-topic response.

Use the ReAct framework:
1. THOUGHT: Does the answer make sense for the question?
   - On-topic + short is fine (e.g. "3 months", "ASAP")
   - Gibberish (random letters) → INVALID
   - Evasion ("idk", "whatever") → INVALID
   - Off-topic → INVALID
2. ACTION: Output exactly one format.

Respond with EXACTLY one of:

VALID: <cleaned answer>

or

INVALID: <one-sentence friendly re-ask>`;

  const userPrompt = `Question: "${question}"\nAnswer: "${userAnswer}"`;
  const response = await callClaude(system, [{ role: "user", content: userPrompt }], 150);

  if (!response) return { valid: true, normalised: trimmed };

  const cleaned = response.trim();
  if (cleaned.startsWith("VALID:")) {
    return { valid: true, normalised: cleaned.replace(/^VALID:\s*/, "").trim() || trimmed };
  }
  if (cleaned.startsWith("INVALID:")) {
    return { valid: false, reask: cleaned.replace(/^INVALID:\s*/, "").trim() || `Could you try again? ${question}` };
  }
  return { valid: true, normalised: trimmed };
}

// ---------------------------------------------------------------------------
// Dispatcher — picks the right validator based on question shape + key
// ---------------------------------------------------------------------------
export async function validateAnswer(
  question: string,
  userAnswer: string,
  options?: string[],
  questionKey?: string,
): Promise<ValidationResult> {
  // Buttons/list: strict match only
  if (options && options.length > 0) {
    return validateStrictOptions(userAnswer, options, question);
  }

  // Location-specific questions: validate SG area
  const lowerKey = (questionKey ?? "").toLowerCase();
  const lowerQ = question.toLowerCase();
  if (
    lowerKey.includes("location") ||
    lowerKey.includes("area") ||
    lowerKey.includes("district") ||
    lowerQ.includes("location") ||
    lowerQ.includes("district") ||
    lowerQ.includes("which area")
  ) {
    return validateLocation(question, userAnswer);
  }

  // Generic free-text
  return validateFreeText(question, userAnswer);
}
