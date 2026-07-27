import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase access.
 *
 * Security posture: the browser never talks to Supabase. RLS is on with **no
 * anon policies at all** (deny by default), and every write goes through a
 * Route Handler using the service-role key. That removes the entire class of
 * client-side policy bugs, and means no key with any privilege is shipped to
 * the client.
 *
 * If the environment isn't configured yet, every call degrades to a no-op and
 * the experience still works end to end — you can demo the whole product
 * before a Supabase project exists.
 */

let cached: SupabaseClient | null = null;

export function db(): SupabaseClient | null {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "x-application-name": "payday-check" } },
  });
  return cached;
}

export function isConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}
