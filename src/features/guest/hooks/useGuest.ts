import { useState, useCallback } from 'react';
import type { GuestProfile } from '../types';
import { guestToPlayer } from '../types';
import { loadGuest, saveGuest } from '../stores/guestStorage';
import type { Player } from '@/types';

export interface UseGuestReturn {
  guest: GuestProfile;
  player: Player;
  updateGuest: (updates: Partial<Omit<GuestProfile, 'playerId'>>) => void;
}

// Lazy-initialised so localStorage is read once on first render, not every re-render.
export function useGuest(): UseGuestReturn {
  const [guest, setGuest] = useState<GuestProfile>(() => loadGuest());

  const updateGuest = useCallback((updates: Partial<Omit<GuestProfile, 'playerId'>>) => {
    setGuest(prev => {
      const next = { ...prev, ...updates };
      saveGuest(next);
      return next;
    });
  }, []);

  return { guest, player: guestToPlayer(guest), updateGuest };
}
