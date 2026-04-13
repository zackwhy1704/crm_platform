"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Question = {
  key: string;
  text: string;
  type: "text" | "buttons" | "list";
  options?: string[];
};

const DEFAULT_QUESTIONS: Question[] = [
  { key: "interest", text: "What are you interested in?", type: "text" },
  { key: "budget", text: "What is your budget range?", type: "list", options: ["Under $5k", "$5k-$20k", "$20k-$50k", "$50k+"] },
  { key: "timeline", text: "When are you looking to start?", type: "buttons", options: ["ASAP", "1-3 months", "Just exploring"] },
];

const INDUSTRIES = [
  "Real Estate", "Renovation", "Healthcare", "Legal", "Education",
  "Financial Services", "Insurance", "Automotive", "F&B", "Other",
];

const STEPS = ["Company", "Profile", "Qualification", "Done"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Company
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");

  // Step 2: Profile
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  // Step 3: Qualification questions
  const [questions, setQuestions] = useState<Question[]>(DEFAULT_QUESTIONS);

  function addQuestion() {
    setQuestions([...questions, { key: `q_${Date.now()}`, text: "", type: "text" }]);
  }

  function removeQuestion(idx: number) {
    setQuestions(questions.filter((_, i) => i !== idx));
  }

  function updateQuestion(idx: number, field: keyof Question, value: string | string[]) {
    setQuestions(questions.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  }

  function addOption(idx: number) {
    const q = questions[idx];
    const opts = [...(q.options ?? []), ""];
    updateQuestion(idx, "options", opts);
  }

  function updateOption(qIdx: number, oIdx: number, value: string) {
    const q = questions[qIdx];
    const opts = [...(q.options ?? [])];
    opts[oIdx] = value;
    updateQuestion(qIdx, "options", opts);
  }

  function removeOption(qIdx: number, oIdx: number) {
    const q = questions[qIdx];
    const opts = (q.options ?? []).filter((_, i) => i !== oIdx);
    updateQuestion(qIdx, "options", opts);
  }

  async function handleComplete() {
    setLoading(true);
    setError("");

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Update user profile
      await supabase.from("user_profiles").upsert({
        user_id: user.id,
        role: "agency",
        full_name: fullName || user.user_metadata?.full_name || "",
        company_name: companyName,
        industry,
        phone,
        onboarding_completed: true,
      });

      // Create client record with qualification config
      const validQuestions = questions.filter((q) => q.text.trim());
      await supabase.from("clients").insert({
        name: companyName,
        industry: industry.toLowerCase().replace(/\s+/g, "_"),
        plan: "starter",
        qualification_config: {
          questions: validQuestions.map((q) => ({
            key: q.key,
            text: q.text,
            type: q.type,
            ...(q.options && q.options.length > 0 ? { options: q.options.filter((o) => o.trim()) } : {}),
          })),
          qualify_threshold: 55,
          hot_threshold: 75,
          disqualify_rules: [],
        },
      });

      router.push("/agency/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Progress bar */}
      <div className="bg-surface border-b border-border1 px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-accent text-white font-bold rounded-lg flex items-center justify-center text-xs">C</div>
              <span className="text-sm font-bold">Setup your workspace</span>
            </div>
            <span className="text-[11px] text-ink-3">Step {step + 1} of {STEPS.length}</span>
          </div>
          <div className="flex gap-1.5">
            {STEPS.map((s, i) => (
              <div key={s} className="flex-1 flex flex-col items-center gap-1">
                <div className={`h-1 w-full rounded-full ${i <= step ? "bg-accent" : "bg-surface2"}`} />
                <span className={`text-[10px] font-medium ${i <= step ? "text-accent" : "text-ink-3"}`}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 flex items-start justify-center p-6 pt-10">
        <div className="w-full max-w-2xl">

          {/* Step 1: Company */}
          {step === 0 && (
            <div className="bg-surface border border-border1 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-bold mb-1">Tell us about your company</h2>
              <p className="text-xs text-ink-3 mb-5">This helps us tailor the platform to your business</p>
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-ink-2 block mb-1">Company name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. PropNest Realty"
                    className="w-full px-3 py-2 border border-border1 rounded text-sm outline-none focus:border-accent bg-surface"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-ink-2 block mb-1.5">Industry</label>
                  <div className="grid grid-cols-2 gap-2">
                    {INDUSTRIES.map((ind) => (
                      <button
                        key={ind}
                        type="button"
                        onClick={() => setIndustry(ind)}
                        className={`py-2 px-3 rounded text-xs font-medium border transition-colors text-left ${
                          industry === ind
                            ? "border-accent bg-accent-light text-accent"
                            : "border-border1 bg-surface text-ink-2 hover:border-accent/50"
                        }`}
                      >
                        {ind}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setStep(1)}
                disabled={!companyName.trim()}
                className="w-full mt-6 py-2.5 bg-accent text-white rounded text-sm font-semibold hover:bg-accent-hover transition-colors disabled:opacity-40"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 2: Profile */}
          {step === 1 && (
            <div className="bg-surface border border-border1 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-bold mb-1">Your profile</h2>
              <p className="text-xs text-ink-3 mb-5">How should we address you?</p>
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-ink-2 block mb-1">Full name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ryan Johnson"
                    className="w-full px-3 py-2 border border-border1 rounded text-sm outline-none focus:border-accent bg-surface"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-ink-2 block mb-1">Phone (optional)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+65 9123 4567"
                    className="w-full px-3 py-2 border border-border1 rounded text-sm outline-none focus:border-accent bg-surface"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setStep(0)}
                  className="flex-1 py-2.5 bg-surface2 rounded text-sm font-semibold text-ink-2 border border-border1 hover:bg-surface3 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!fullName.trim()}
                  className="flex-1 py-2.5 bg-accent text-white rounded text-sm font-semibold hover:bg-accent-hover transition-colors disabled:opacity-40"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Qualification questions */}
          {step === 2 && (
            <div className="bg-surface border border-border1 rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-bold mb-1">Lead qualification questions</h2>
              <p className="text-xs text-ink-3 mb-5">
                These questions will be asked to your leads via WhatsApp AI. You can change them anytime in settings.
              </p>

              <div className="space-y-4">
                {questions.map((q, qi) => (
                  <div key={qi} className="bg-surface2 border border-border1 rounded-lg p-3.5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-ink-3">Question {qi + 1}</span>
                      {questions.length > 1 && (
                        <button
                          onClick={() => removeQuestion(qi)}
                          className="text-[10px] text-red hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={q.text}
                      onChange={(e) => updateQuestion(qi, "text", e.target.value)}
                      placeholder="e.g. What type of property are you looking for?"
                      className="w-full px-3 py-2 border border-border1 rounded text-xs outline-none focus:border-accent bg-surface mb-2"
                    />
                    <div className="flex gap-1.5 mb-2">
                      {(["text", "buttons", "list"] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => updateQuestion(qi, "type", t)}
                          className={`px-2.5 py-1 rounded text-[10px] font-semibold border transition-colors ${
                            q.type === t
                              ? "border-accent bg-accent-light text-accent"
                              : "border-border1 text-ink-3 hover:border-accent/50"
                          }`}
                        >
                          {t === "text" ? "Free text" : t === "buttons" ? "Buttons (max 3)" : "List (4+)"}
                        </button>
                      ))}
                    </div>
                    {(q.type === "buttons" || q.type === "list") && (
                      <div className="space-y-1.5">
                        <div className="text-[10px] font-semibold text-ink-3">Options:</div>
                        {(q.options ?? []).map((opt, oi) => (
                          <div key={oi} className="flex gap-1.5">
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => updateOption(qi, oi, e.target.value)}
                              placeholder={`Option ${oi + 1}`}
                              className="flex-1 px-2 py-1.5 border border-border1 rounded text-[11px] outline-none focus:border-accent bg-surface"
                            />
                            <button
                              onClick={() => removeOption(qi, oi)}
                              className="text-[10px] text-ink-3 hover:text-red px-1"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => addOption(qi)}
                          disabled={q.type === "buttons" && (q.options?.length ?? 0) >= 3}
                          className="text-[10px] text-accent font-semibold hover:underline disabled:opacity-40 disabled:no-underline"
                        >
                          + Add option
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                <button
                  onClick={addQuestion}
                  className="w-full py-2 border border-dashed border-border2 rounded text-xs font-semibold text-ink-3 hover:border-accent hover:text-accent transition-colors"
                >
                  + Add another question
                </button>
              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-2.5 bg-surface2 rounded text-sm font-semibold text-ink-2 border border-border1 hover:bg-surface3 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-2.5 bg-accent text-white rounded text-sm font-semibold hover:bg-accent-hover transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Done */}
          {step === 3 && (
            <div className="bg-surface border border-border1 rounded-lg shadow-sm p-6 text-center">
              <div className="text-4xl mb-3">🚀</div>
              <h2 className="text-lg font-bold mb-2">You&apos;re all set!</h2>
              <p className="text-sm text-ink-2 mb-6">
                <strong>{companyName}</strong> is ready to go.
                Your AI will use your {questions.filter((q) => q.text.trim()).length} qualification questions to qualify leads via WhatsApp.
              </p>

              <div className="bg-surface2 rounded-lg p-4 mb-6 text-left">
                <div className="text-[11px] font-bold text-ink-3 uppercase tracking-wider mb-2">Summary</div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-ink-3">Company</span>
                    <span className="font-semibold">{companyName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-3">Industry</span>
                    <span className="font-semibold">{industry || "General"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-3">Contact</span>
                    <span className="font-semibold">{fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-3">Qualification questions</span>
                    <span className="font-semibold">{questions.filter((q) => q.text.trim()).length}</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-4 text-xs text-red bg-red-light rounded px-3 py-2">{error}</div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-2.5 bg-surface2 rounded text-sm font-semibold text-ink-2 border border-border1"
                >
                  Back
                </button>
                <button
                  onClick={handleComplete}
                  disabled={loading}
                  className="flex-1 py-2.5 bg-accent text-white rounded text-sm font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50"
                >
                  {loading ? "Setting up..." : "Launch Dashboard →"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
