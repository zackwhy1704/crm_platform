"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Login page — supports:
 *   1. Email + password (standard)
 *   2. Magic link (passwordless — good for SME clients)
 *
 * M3-ready: wires to Supabase Auth when NEXT_PUBLIC_SUPABASE_URL is set.
 * Falls back to mock auth for local dev (just redirects based on role choice).
 */
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"password" | "magic">("password");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (!supabaseUrl) {
      // Mock auth — choose role
      setMessage("Dev mode: redirecting...");
      setTimeout(() => router.push("/agency/dashboard"), 500);
      return;
    }

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      if (mode === "magic") {
        const { error: err } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${window.location.origin}/api/auth/callback` },
        });
        if (err) throw err;
        setMessage("Check your email for the login link!");
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        // Fetch role and redirect
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("role")
          .single();
        router.push(profile?.role === "client" ? "/client/leads" : "/agency/dashboard");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 bg-accent text-white font-bold rounded-lg flex items-center justify-center">
            C
          </div>
          <span className="text-xl font-bold tracking-tight">
            CRM<span className="text-accent">Platform</span>
          </span>
        </div>

        <div className="bg-surface border border-border1 rounded-lg shadow-sm p-6">
          <h1 className="text-lg font-bold mb-1">Welcome back</h1>
          <p className="text-xs text-ink-3 mb-5">Sign in to your account</p>

          {/* Mode toggle */}
          <div className="flex mb-4 bg-surface2 rounded p-0.5">
            <button
              type="button"
              onClick={() => setMode("password")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded transition-colors ${
                mode === "password" ? "bg-surface shadow-sm text-ink" : "text-ink-3"
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => setMode("magic")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded transition-colors ${
                mode === "magic" ? "bg-surface shadow-sm text-ink" : "text-ink-3"
              }`}
            >
              Magic Link
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-ink-2 block mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-3 py-2 border border-border1 rounded text-sm outline-none focus:border-accent transition-colors bg-surface"
              />
            </div>
            {mode === "password" && (
              <div>
                <label className="text-[11px] font-semibold text-ink-2 block mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-border1 rounded text-sm outline-none focus:border-accent transition-colors bg-surface"
                />
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-accent text-white rounded text-sm font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              {loading ? "Signing in…" : mode === "magic" ? "Send Magic Link" : "Sign In"}
            </button>
          </form>

          {error && (
            <div className="mt-3 text-xs text-red bg-red-light rounded px-3 py-2">{error}</div>
          )}
          {message && (
            <div className="mt-3 text-xs text-green bg-green-light rounded px-3 py-2">{message}</div>
          )}

          {!supabaseUrl && (
            <div className="mt-4 pt-3 border-t border-border1">
              <p className="text-[10px] text-ink-3 mb-2">Dev mode — quick access:</p>
              <div className="flex gap-2">
                <button
                  onClick={() => router.push("/agency/dashboard")}
                  className="flex-1 py-1.5 text-[11px] font-semibold bg-surface2 rounded border border-border1 hover:border-accent transition-colors"
                >
                  Agency Console
                </button>
                <button
                  onClick={() => router.push("/client/leads")}
                  className="flex-1 py-1.5 text-[11px] font-semibold bg-surface2 rounded border border-border1 hover:border-accent transition-colors"
                >
                  Client Portal
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-[10px] text-ink-3 text-center mt-4">
          CRM Platform · AI Lead Management for SMEs
        </p>
      </div>
    </div>
  );
}
