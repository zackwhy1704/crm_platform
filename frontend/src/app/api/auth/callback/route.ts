import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Supabase Auth callback for magic link and OAuth flows.
 * Exchanges the code for a session, then redirects based on user role.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Get user role to decide redirect
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("role")
        .single();

      const dest = profile?.role === "client" ? "/client/leads" : "/agency/dashboard";
      return NextResponse.redirect(`${origin}${dest}`);
    }
  }

  // Auth error — redirect to login
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
