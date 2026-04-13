"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;

      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <AuthLayout>
        <div className="bg-surface border border-border1 rounded-lg shadow-sm p-6 text-center">
          <div className="text-4xl mb-3">✓</div>
          <h1 className="text-lg font-bold mb-2">Password updated</h1>
          <p className="text-sm text-ink-2">Redirecting you to login...</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="bg-surface border border-border1 rounded-lg shadow-sm p-6">
        <h1 className="text-lg font-bold mb-1">Set new password</h1>
        <p className="text-xs text-ink-3 mb-5">Choose a strong password for your account</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[11px] font-semibold text-ink-2 block mb-1">New password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 characters"
              className="w-full px-3 py-2 border border-border1 rounded text-sm outline-none focus:border-accent bg-surface"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-ink-2 block mb-1">Confirm password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat password"
              className="w-full px-3 py-2 border border-border1 rounded text-sm outline-none focus:border-accent bg-surface"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-accent text-white rounded text-sm font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>

        {error && (
          <div className="mt-3 text-xs text-red bg-red-light rounded px-3 py-2">{error}</div>
        )}
      </div>
    </AuthLayout>
  );
}
