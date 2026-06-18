import type { GuestProfile } from '../types';

const STORAGE_KEY = 'tw_guest';

function generatePlayerId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = 'guest_';
  for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

export function createDefaultGuest(): GuestProfile {
  return {
    playerId: generatePlayerId(),
    nickname: 'ผู้เล่น',
    mascot: 'fox',
    onboarded: false,
  };
}

export function loadGuest(): GuestProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<GuestProfile>;
      if (parsed.playerId && parsed.nickname && parsed.mascot) {
        // Guests stored before onboarding existed are treated as already
        // onboarded — they're returning users, not first-run.
        return { onboarded: true, ...parsed } as GuestProfile;
      }
    }
  } catch {
    // localStorage unavailable or corrupt — fall through to default
  }
  const fresh = createDefaultGuest();
  saveGuest(fresh);
  return fresh;
}

export function saveGuest(profile: GuestProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // ignore write errors (private browsing, storage full)
  }
}

export function clearGuest(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
