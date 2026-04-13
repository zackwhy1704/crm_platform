"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
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

      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      if (err) throw err;

      if (data.user && !data.user.email_confirmed_at) {
        setSuccess(true);
      } else if (data.user) {
        // Auto-confirmed (e.g. email confirmation disabled in Supabase)
        // Create profile and redirect to onboarding
        await supabase.from("user_profiles").insert({
          user_id: data.user.id,
          role: "agency",
          full_name: fullName,
          onboarding_completed: false,
        });
        router.push("/onboarding");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <AuthLayout>
        <div className="bg-surface border border-border1 rounded-lg shadow-sm p-6 text-center">
          <div className="text-4xl mb-3">✉</div>
          <h1 className="text-lg font-bold mb-2">Check your email</h1>
          <p className="text-sm text-ink-2 mb-4">
            We sent a verification link to <strong>{email}</strong>.
            Click the link to activate your account.
          </p>
          <p className="text-xs text-ink-3">
            Didn&apos;t receive it? Check your spam folder or{" "}
            <button
              onClick={() => setSuccess(false)}
              className="text-accent font-semibold hover:underline"
            >
              try again
            </button>
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="bg-surface border border-border1 rounded-lg shadow-sm p-6">
        <h1 className="text-lg font-bold mb-1">Create your account</h1>
        <p className="text-xs text-ink-3 mb-5">Get started with AI lead management</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[11px] font-semibold text-ink-2 block mb-1">Full name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ryan Johnson"
              className="w-full px-3 py-2 border border-border1 rounded text-sm outline-none focus:border-accent bg-surface"
            />
          </div>
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
          <div>
            <label className="text-[11px] font-semibold text-ink-2 block mb-1">Password</label>
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
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        {error && (
          <div className="mt-3 text-xs text-red bg-red-light rounded px-3 py-2">{error}</div>
        )}

        <p className="text-xs text-ink-3 text-center mt-4">
          Already have an account?{" "}
          <Link href="/login" className="text-accent font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
