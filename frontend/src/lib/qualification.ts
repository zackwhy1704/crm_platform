/**
 * Qualification engine — runs the WA conversation loop.
 */
import { sendText, sendButtons, sendList, type SendResult } from "./whatsapp";

type Question = {
  key: string;
  text: string;
  type: "text" | "buttons" | "list";
  options?: string[];
};

type QualConfig = {
  questions: Question[];
  qualify_threshold: number;
  hot_threshold: number;
};

export async function sendNextQuestion(
  phone: string,
  config: QualConfig,
  currentStep: number,
): Promise<SendResult> {
  const questions = config.questions ?? [];

  if (currentStep >= questions.length) {
    return sendText(phone, "Thanks for answering! Our team will review and get back to you shortly.");
  }

  const q = questions[currentStep];

  if (q.type === "buttons" && q.options && q.options.length > 0) {
    return sendButtons(
      phone, q.text,
      q.options.map((opt, i) => ({ id: `${q.key}_${i}`, title: opt })),
    );
  }
  if (q.type === "list" && q.options && q.options.length > 0) {
    return sendList(
      phone, q.text, "Select",
      q.options.map((opt, i) => ({ id: `${q.key}_${i}`, title: opt })),
    );
  }
  return sendText(phone, q.text);
}

export function computeScore(collected: Record<string, string>, config: QualConfig): number {
  const questions = config.questions ?? [];
  if (questions.length === 0) return 50;

  const answered = Object.keys(collected).length;
  const completion = Math.round((answered / questions.length) * 50);

  let quality = 0;
  for (const val of Object.values(collected)) {
    const lower = val.toLowerCase();
    if (lower.includes("asap") || lower.includes("within 3") || lower.includes("pre-approved")) quality = Math.max(quality, 25);
    else if (lower.includes("1-3 month") || lower.includes("in progress") || lower.includes("$1m") || lower.includes("$2m")) quality = Math.max(quality, 18);
    else if (lower.includes("exploring") || lower.includes("not yet") || lower.includes("rent")) quality = Math.max(quality, 5);
    else quality = Math.max(quality, 10);
  }

  const engagement = answered >= 3 ? 15 : answered >= 1 ? 8 : 0;
  return Math.min(completion + quality + engagement, 100);
}

export function scoreToVerdict(score: number, config: QualConfig): string {
  if (score >= config.hot_threshold) return "qualified_hot";
  if (score >= config.qualify_threshold) return "qualified_warm";
  if (score >= 35) return "nurture";
  return "disqualified";
}
