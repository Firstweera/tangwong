// Supabase client — the single shared connection for auth + (later) data.
//
// The client is created only when both env vars are present. When they are not
// (e.g. a fresh checkout with no .env.local), `supabase` is null and callers
// fall back to local-only behaviour — the app stays fully usable offline during
// development. This is the seam the rest of the backend (Phase 4.5.2+) builds on.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

/** True when the project is configured to talk to a real Supabase backend. */
export const isSupabaseEnabled: boolean = !!url && !!anonKey;

/**
 * Whether room/chat realtime should use Supabase instead of the cross-tab
 * (BroadcastChannel) transport. Requires the backend to be configured AND the
 * explicit opt-in flag, so dev/test stays cross-tab by default (Phase 4.5.2).
 */
export const useSupabaseTransport: boolean =
  isSupabaseEnabled && import.meta.env.VITE_USE_SUPABASE === 'true';

/**
 * The shared Supabase client, or null when unconfigured. Always guard usage:
 * `if (supabase) { ... }` — or prefer the helpers in this folder, which no-op
 * gracefully when the backend is absent.
 */
export const supabase: SupabaseClient | null = isSupabaseEnabled
  ? createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // Anonymous sessions: keep the same uid across reloads on this device.
        storageKey: 'tw_auth',
      },
    })
  : null;
