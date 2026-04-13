import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Supabase Auth callback for:
 *   - Email verification (after signup)
 *   - Magic link login
 *   - Password reset link
 *
 * Exchanges the code for a session, creates profile if needed,
 * then redirects based on onboarding state + role.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type"); // "signup", "recovery", "magiclink"

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Password reset flow — redirect to reset page
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/reset-password`);
      }

      // Check if profile exists
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("role, onboarding_completed")
        .eq("user_id", data.user.id)
        .single();

      // New signup — create profile and redirect to onboarding
      if (!profile) {
        await supabase.from("user_profiles").insert({
          user_id: data.user.id,
          role: "agency",
          full_name: data.user.user_metadata?.full_name ?? "",
          onboarding_completed: false,
        });
        return NextResponse.redirect(`${origin}/onboarding`);
      }

      // Existing user — check onboarding
      if (!profile.onboarding_completed) {
        return NextResponse.redirect(`${origin}/onboarding`);
      }

      // Fully onboarded — redirect by role
      const dest = profile.role === "client" ? "/client/leads" : "/agency/dashboard";
      return NextResponse.redirect(`${origin}${dest}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
