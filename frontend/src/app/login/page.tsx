"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) throw err;

      // Login is for existing users — go straight to dashboard
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("user_id", data.user.id)
        .single();

      if (profile?.role === "client") {
        router.push("/client/leads");
      } else {
        router.push("/agency/dashboard");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed";
      if (msg.includes("Invalid login")) {
        setError("Incorrect email or password");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout>
      <div className="bg-surface border border-border1 rounded-lg shadow-sm p-6">
        <h1 className="text-lg font-bold mb-1">Welcome back</h1>
        <p className="text-xs text-ink-3 mb-5">Sign in to your account</p>

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
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-ink-2">Password</label>
              <Link href="/forgot-password" className="text-[10px] text-accent font-semibold hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-border1 rounded text-sm outline-none focus:border-accent bg-surface pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-3 text-xs hover:text-ink-2"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-accent text-white rounded text-sm font-semibold hover:bg-accent-hover transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {error && (
          <div className="mt-3 text-xs text-red bg-red-light rounded px-3 py-2">{error}</div>
        )}

        <p className="text-xs text-ink-3 text-center mt-4">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-accent font-semibold hover:underline">Create one</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
