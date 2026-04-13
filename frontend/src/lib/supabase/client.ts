/**
 * Browser-side Supabase client. Use in client components.
 * M1: stub (no real client). M2: real @supabase/ssr browser client.
 */
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
