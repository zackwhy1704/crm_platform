import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Auth middleware — protects /agency/* and /client/* routes.
 *
 * Set NEXT_PUBLIC_AUTH_ENABLED=true to enforce login.
 * Default: open access (auth disabled) so the UI is browsable.
 */
export async function middleware(request: NextRequest) {
  const authEnabled = process.env.NEXT_PUBLIC_AUTH_ENABLED === "true";

  // Auth disabled — all routes open
  if (!authEnabled) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options as any),
        );
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  if (!user && (path.startsWith("/agency") || path.startsWith("/client"))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && (path.startsWith("/agency") || path.startsWith("/client"))) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (profile?.role === "client" && path.startsWith("/agency")) {
      return NextResponse.redirect(new URL("/client/leads", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/agency/:path*", "/client/:path*"],
};
