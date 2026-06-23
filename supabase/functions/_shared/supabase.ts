// Shared Supabase clients for Edge Functions.
//
// - adminClient(): service-role client that BYPASSES RLS. This is the authority —
//   the ONLY writer of game tables. Never expose its key to the browser.
// - callerId(req): verifies the request's JWT and returns the caller's auth.uid()
//   (or null). Used to authorize who may start / act in a game.
//
// SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are injected into
// every Edge Function by the platform — no manual secret needed for these.
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

const URL = Deno.env.get('SUPABASE_URL')!;
const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

export function adminClient(): SupabaseClient {
  return createClient(URL, SERVICE, { auth: { persistSession: false } });
}

/** Resolve the caller's auth.uid() from the request Authorization header. */
export async function callerId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;
  const scoped = createClient(URL, ANON, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data, error } = await scoped.auth.getUser();
  if (error || !data.user) return null;
  return data.user.id;
}
