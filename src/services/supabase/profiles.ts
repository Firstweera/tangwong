// Profiles — the player's persisted identity (nickname + mascot) keyed by their
// Supabase auth.uid(). This is the cross-device home of what was previously a
// local-only guest record. Schema is intentionally minimal (Phase 4.5.1) and
// will grow incrementally (stats, friends, etc.) in later phases.
import { supabase } from './client';
import type { MascotKey } from '@/types';

export interface ProfileRow {
  id: string;          // = auth.uid()
  nickname: string;
  mascot: MascotKey;
}

/** Fetch a profile by id, or null if it doesn't exist yet / backend is off. */
export async function fetchProfile(id: string): Promise<ProfileRow | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nickname, mascot')
      .eq('id', id)
      .maybeSingle();
    if (error || !data) return null;
    return data as ProfileRow;
  } catch {
    return null;
  }
}

/** Create or update the caller's own profile (RLS restricts writes to self). */
export async function upsertProfile(profile: ProfileRow): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from('profiles').upsert(
      { id: profile.id, nickname: profile.nickname, mascot: profile.mascot },
      { onConflict: 'id' },
    );
  } catch {
    // best-effort sync; local identity remains the source of truth on failure
  }
}
