import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Auth middleware — protects /agency/* and /client/* routes.
 *
 * If Supabase env vars are not set (local dev), all routes are open.
 * When configured, unauthenticated users are redirected to /login.
 * Clients trying to access /agency/* get redirected to /client/leads.
 */
export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Dev mode — no auth enforcement
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

  // Not logged in → redirect to login (except public routes)
  if (!user && (path.startsWith("/agency") || path.startsWith("/client"))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Logged in → check role-based access
  if (user && (path.startsWith("/agency") || path.startsWith("/client"))) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    // Client trying to access agency routes
    if (profile?.role === "client" && path.startsWith("/agency")) {
      return NextResponse.redirect(new URL("/client/leads", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/agency/:path*", "/client/:path*"],
};
