// Room code + invite link utilities
import type { Player, Room, RoomSettings } from '@/types';
import { useSupabaseTransport, roomService } from '@/services/supabase';
import * as crossTabStore from './stores/roomRealtime';

/** Whether a room still exists for `code`, on whichever transport is active.
 *  Used to hide the "rejoin" shortcut once a left room has been deleted. */
export async function roomExists(code: string): Promise<boolean> {
  if (useSupabaseTransport) return roomService.roomExists(code);
  return crossTabStore.loadRoom(code) != null;
}

// Unambiguous chars only — avoids O/0 and I/1 confusion
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

export function generateRoomId(): string {
  return `room_${Date.now()}_${Math.floor(Math.random() * 9999)}`;
}

export function generateInviteLink(code: string): string {
  const base = typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : 'https://tangwong.vercel.app';
  return `${base}/join/${code}`;
}

// Extracts a room code from raw input or an invite link
export function parseInviteCode(input: string): string {
  const trimmed = input.trim().toUpperCase();
  // Match the last 5 uppercase alphanumeric chars (handles full link or bare code)
  const match = trimmed.match(/([A-Z0-9]{5})$/);
  return match ? match[1] : trimmed.slice(0, 5);
}

export function buildRoom(settings: RoomSettings, host: Player): Room {
  const code = generateRoomCode();
  return {
    id: generateRoomId(),
    code,
    name: settings.name,
    maxPlayers: settings.maxPlayers,
    isPublic: settings.isPublic,
    gameId: settings.gameId,
    hostId: host.id,
    players: [host],
    status: 'waiting',
    inviteLink: generateInviteLink(code),
    createdAt: Date.now(),
  };
}

// Seed used when joining by code. If the shared room already exists (another
// tab created it) the realtime layer joins that instead and ignores this seed;
// otherwise this becomes the new room with the joiner as host.
export function buildRoomFromCode(code: string, joiner: Player): Room {
  const cleanCode = code.slice(0, 5).toUpperCase();
  return {
    id: generateRoomId(),
    code: cleanCode,
    name: `ห้องของเพื่อน`,
    maxPlayers: 7,
    isPublic: true,
    gameId: 'avalon',
    hostId: joiner.id,
    players: [joiner],
    status: 'waiting',
    inviteLink: generateInviteLink(cleanCode),
    createdAt: Date.now(),
  };
}
