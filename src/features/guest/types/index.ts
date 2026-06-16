import type { MascotKey, Player } from '@/types';

export interface GuestProfile {
  playerId: string;
  nickname: string;
  mascot: MascotKey;
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
