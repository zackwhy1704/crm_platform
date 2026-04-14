"use client";

import { useState } from "react";

export default function TestLeadPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    // Normalise phone: ensure +65 prefix
    let normalised = phone.replace(/\s/g, "");
    if (!normalised.startsWith("+")) {
      normalised = normalised.startsWith("65") ? `+${normalised}` : `+65${normalised}`;
    }

    try {
      const resp = await fetch("/api/qualify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone: normalised }),
      });
      const data = await resp.json();
      setResult({ ok: resp.ok, message: data.message ?? data.error ?? "Unknown response" });
    } catch (err: unknown) {
      setResult({ ok: false, message: err instanceof Error ? err.message : "Network error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-8 h-8 bg-accent text-white font-bold rounded-lg flex items-center justify-center text-sm">C</div>
          <span className="text-lg font-bold">Test Lead Submission</span>
        </div>

        <div className="bg-surface border border-border1 rounded-lg shadow-sm p-6">
          <h1 className="text-base font-bold mb-1">Simulate a new lead</h1>
          <p className="text-xs text-ink-3 mb-5">
            Enter your WhatsApp number below. The AI will message you on WhatsApp and walk
            you through the qualification questions. Reply to the messages to complete the flow.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-ink-2 block mb-1">Your name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full px-3 py-2 border border-border1 rounded text-sm outline-none focus:border-accent bg-surface"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-ink-2 block mb-1">WhatsApp number</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+65 9123 4567"
                className="w-full px-3 py-2 border border-border1 rounded text-sm outline-none focus:border-accent bg-surface"
              />
              <p className="text-[10px] text-ink-3 mt-1">
                Must be a number whitelisted in your Meta test phone recipients
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-accent text-white rounded text-sm font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              {loading ? "Sending..." : "Start AI Qualification"}
            </button>
          </form>

          {result && (
            <div className={`mt-4 text-xs rounded px-3 py-2 ${result.ok ? "bg-green-light text-green" : "bg-red-light text-red"}`}>
              {result.message}
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-border1">
            <div className="text-[11px] font-bold text-ink-2 mb-2">How the flow works:</div>
            <ol className="text-[11px] text-ink-3 space-y-1.5 list-decimal list-inside">
              <li>You submit your number above</li>
              <li>AI sends you a <strong>hello_world template</strong> on WhatsApp</li>
              <li><strong>You reply anything</strong> (e.g. &quot;Hi&quot;) to open the chat window</li>
              <li>AI sends welcome + first qualification question (buttons/list)</li>
              <li>You reply → AI validates with Claude Haiku → sends next question</li>
              <li>If your answer is off-topic or gibberish, AI re-asks politely</li>
              <li>After all questions, AI scores you and updates the dashboard</li>
            </ol>
            <div className="mt-3 text-[10px] text-amber bg-amber-light/50 rounded px-2 py-1.5 border border-amber/20">
              ⚠ WhatsApp rule: free-form messages only work after you reply to the template. This is a Meta restriction for test numbers.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
