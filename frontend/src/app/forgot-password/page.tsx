"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (err) throw err;
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <AuthLayout>
        <div className="bg-surface border border-border1 rounded-lg shadow-sm p-6 text-center">
          <div className="text-4xl mb-3">✉</div>
          <h1 className="text-lg font-bold mb-2">Check your email</h1>
          <p className="text-sm text-ink-2 mb-4">
            If an account exists for <strong>{email}</strong>, we sent a password reset link.
          </p>
          <p className="text-xs text-ink-3 mb-4">
            The link expires in 1 hour. Check your spam folder if you don&apos;t see it.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setSent(false)}
              className="flex-1 py-2 text-xs font-semibold bg-surface2 rounded border border-border1 hover:border-accent transition-colors"
            >
              Try another email
            </button>
            <Link
              href="/login"
              className="flex-1 py-2 text-xs font-semibold bg-accent text-white rounded text-center hover:bg-accent-hover transition-colors"
            >
              Back to login
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="bg-surface border border-border1 rounded-lg shadow-sm p-6">
        <h1 className="text-lg font-bold mb-1">Reset your password</h1>
        <p className="text-xs text-ink-3 mb-5">
          Enter your email and we&apos;ll send you a link to reset your password
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[11px] font-semibold text-ink-2 block mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full px-3 py-2 border border-border1 rounded text-sm outline-none focus:border-accent bg-surface"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-accent text-white rounded text-sm font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        {error && (
          <div className="mt-3 text-xs text-red bg-red-light rounded px-3 py-2">{error}</div>
        )}

        <p className="text-xs text-ink-3 text-center mt-4">
          Remember your password?{" "}
          <Link href="/login" className="text-accent font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
