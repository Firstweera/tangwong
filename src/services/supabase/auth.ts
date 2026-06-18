// Auth — anonymous sign-in plus the seam for linking a real account later.
//
// Phase 4.5.1 ships anonymous auth only: a player gets a real, stable
// `auth.uid()` (a UUID) with no login wall. The long-term direction (locked) is
// to let that anonymous user LINK a Google identity later via `linkGoogle()`,
// upgrading the same uid into a permanent account without losing their history.
import { supabase } from './client';
import type { User } from '@supabase/supabase-js';

/**
 * Ensure there is an authenticated user, signing in anonymously if needed.
 * Returns the user, or null when Supabase is unconfigured / sign-in fails
 * (callers then stay on the local guest identity).
 */
export async function ensureSession(): Promise<User | null> {
  if (!supabase) return null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) return session.user;

    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) return null;
    return data.user ?? null;
  } catch {
    return null;
  }
}

/** Subscribe to auth state changes; returns an unsubscribe fn. */
export function onAuthChange(handler: (user: User | null) => void): () => void {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    handler(session?.user ?? null);
  });
  return () => data.subscription.unsubscribe();
}

/** Whether the current user is anonymous (i.e. has not linked a real account). */
export function isAnonymous(user: User | null): boolean {
  // Supabase marks anon users with is_anonymous; fall back to "no identities".
  return !!user && (user.is_anonymous === true || (user.identities?.length ?? 0) === 0);
}

/**
 * Link a Google identity to the current anonymous user (Phase 4.5 — accounts).
 * Not wired into the UI yet; present so the upgrade path is a one-call seam.
 */
export async function linkGoogle(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.linkIdentity({ provider: 'google' });
}
