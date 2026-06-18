import type { MascotKey, Player } from '@/types';

export interface GuestProfile {
  playerId: string;
  nickname: string;
  mascot: MascotKey;
  /** True once the player has completed the welcome flow (picked name + mascot,
   *  or signed in). Brand-new guests start false so the Welcome screen shows. */
  onboarded: boolean;
}

export function guestToPlayer(guest: GuestProfile): Player {
  return {
    id: guest.playerId,
    name: guest.nickname,
    en: guest.nickname,
    mascot: guest.mascot,
    online: true,
  };
}
