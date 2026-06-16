// Room code + invite link utilities
import type { Player, Room, RoomSettings } from '@/types';

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
  return `https://tangwong.app/join/${code}`;
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

// Simulate joining an existing room by code (no backend: returns a mock room)
export function buildRoomFromCode(code: string, joiner: Player): Room {
  const cleanCode = code.slice(0, 5).toUpperCase();
  return {
    id: generateRoomId(),
    code: cleanCode,
    name: `ห้องของเพื่อน`,
    maxPlayers: 7,
    isPublic: true,
    gameId: 'avalon',
    hostId: 'p4',
    players: [joiner],
    status: 'waiting',
    inviteLink: generateInviteLink(cleanCode),
    createdAt: Date.now(),
  };
}
