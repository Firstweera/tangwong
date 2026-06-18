import { useState, useCallback, useEffect } from 'react';
import type { GuestProfile } from '../types';
import { guestToPlayer } from '../types';
import { loadGuest, saveGuest, clearGuest } from '../stores/guestStorage';
import { isSupabaseEnabled, ensureSession, fetchProfile, upsertProfile, supabase } from '@/services/supabase';
import type { Player } from '@/types';

export interface UseGuestReturn {
  guest: GuestProfile;
  player: Player;
  updateGuest: (updates: Partial<Omit<GuestProfile, 'playerId'>>) => void;
  /** Clear the identity (sign out of Supabase + drop the local guest) and return
   *  to a fresh, un-onboarded state. Reloads so auth/session start clean. */
  logout: () => Promise<void>;
  /** True once the identity has been reconciled with the backend (or it's off). */
  ready: boolean;
}

/**
 * The current player's identity. Local-first: the localStorage guest loads
 * synchronously so there's no flash and the app works fully offline.
 *
 * When Supabase is configured (Phase 4.5.1) the hook upgrades that guest onto a
 * real, cross-device identity:
 *  - signs in anonymously to obtain a stable `auth.uid()`
 *  - if a profile already exists for that uid (returning on another device), it
 *    adopts the stored nickname/mascot
 *  - otherwise it migrates the local guest up to the backend under the real uid
 * The `playerId` therefore becomes the Supabase uid once signed in.
 */
export function useGuest(): UseGuestReturn {
  const [guest, setGuest] = useState<GuestProfile>(() => loadGuest());
  const [ready, setReady] = useState(!isSupabaseEnabled);

  useEffect(() => {
    if (!isSupabaseEnabled) return;
    let active = true;

    (async () => {
      const user = await ensureSession();
      if (!active) return;
      if (!user) { setReady(true); return; } // sign-in failed → stay local

      const local = loadGuest();
      const remote = await fetchProfile(user.id);
      if (!active) return;

      let next: GuestProfile;
      if (remote) {
        // Returning user — the backend profile is the source of truth, and a
        // stored profile means they've already been through onboarding.
        next = { playerId: user.id, nickname: remote.nickname, mascot: remote.mascot, onboarded: true };
      } else {
        // First sign-in on this account — migrate the local guest under the uid.
        next = { ...local, playerId: user.id };
        await upsertProfile({ id: user.id, nickname: next.nickname, mascot: next.mascot });
      }
      if (!active) return;
      saveGuest(next);
      setGuest(next);
      setReady(true);
    })();

    return () => { active = false; };
  }, []);

  const updateGuest = useCallback((updates: Partial<Omit<GuestProfile, 'playerId'>>) => {
    setGuest(prev => {
      const next = { ...prev, ...updates };
      saveGuest(next);
      // Best-effort sync to the backend; local stays authoritative on failure.
      if (isSupabaseEnabled) {
        upsertProfile({ id: next.playerId, nickname: next.nickname, mascot: next.mascot });
      }
      return next;
    });
  }, []);

  const logout = useCallback(async () => {
    clearGuest();
    if (isSupabaseEnabled && supabase) {
      try { await supabase.auth.signOut(); } catch { /* ignore */ }
    }
    // Reload to reset all in-memory state (rooms, chat, auth session) cleanly and
    // re-enter the Welcome flow with a brand-new guest identity.
    window.location.reload();
  }, []);

  return { guest, player: guestToPlayer(guest), updateGuest, logout, ready };
}
