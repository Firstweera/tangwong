// Shared room store — the authoritative room snapshot lives in localStorage
// keyed by room code, so every same-origin tab reads/writes one source of truth.
// Pure read-modify-write helpers; the useRealtimeRoom hook owns the channel that
// notifies other tabs after each mutation. Socket.io replaces this module's
// storage with server state behind the same call sites.
import type { Player, Room, RoomSettings } from '@/types';
import type { SyncedRoom } from '@/services/realtime';

const STORAGE_PREFIX = 'tw_room_';

/** A member is considered gone if it misses heartbeats for this long. */
export const OFFLINE_MS = 10_000;

function storageKey(code: string): string {
  return `${STORAGE_PREFIX}${code}`;
}

/** Deterministic room id from code so chat (keyed by roomId) is shared too. */
export function roomIdFromCode(code: string): string {
  return `room_${code}`;
}

export function loadRoom(code: string): SyncedRoom | null {
  try {
    const raw = localStorage.getItem(storageKey(code));
    if (raw) return JSON.parse(raw) as SyncedRoom;
  } catch {
    // unavailable or corrupt
  }
  return null;
}

function saveRoom(room: SyncedRoom): void {
  try {
    localStorage.setItem(storageKey(room.code), JSON.stringify(room));
  } catch {
    // ignore write errors
  }
}

export function removeRoom(code: string): void {
  try {
    localStorage.removeItem(storageKey(code));
  } catch {
    // ignore
  }
}

function fromSeed(seed: Room, joiner: Player, now: number): SyncedRoom {
  const players = seed.players.some(p => p.id === joiner.id)
    ? seed.players
    : [...seed.players, joiner];
  return {
    ...seed,
    id: roomIdFromCode(seed.code),
    players,
    ready: {},
    presence: { [joiner.id]: now },
  };
}

/** Drop members who have missed heartbeats (closed tab without leaving). Bots
 * and the host are always kept. */
function pruneStale(room: SyncedRoom, now: number): SyncedRoom {
  const live = room.players.filter(p =>
    p.id === room.hostId || p.bot || (room.presence[p.id] ?? 0) >= now - OFFLINE_MS,
  );
  if (live.length === room.players.length) return room;
  const presence = { ...room.presence };
  const ready = { ...room.ready };
  for (const p of room.players) {
    if (!live.includes(p)) { delete presence[p.id]; delete ready[p.id]; }
  }
  return { ...room, players: live, presence, ready };
}

/** Join (or create) the room for `code`; marks the joiner present. */
export function joinRoom(code: string, player: Player, seed: Room, now: number): SyncedRoom {
  const existing = loadRoom(code);
  if (!existing) {
    const created = fromSeed(seed, player, now);
    saveRoom(created);
    return created;
  }
  const players = existing.players.some(p => p.id === player.id)
    ? existing.players.map(p => (p.id === player.id ? { ...p, ...player } : p))
    : [...existing.players, player];
  const next: SyncedRoom = {
    ...existing,
    players,
    presence: { ...existing.presence, [player.id]: now },
  };
  saveRoom(next);
  return next;
}

export function leaveRoom(code: string, playerId: string): void {
  const room = loadRoom(code);
  if (!room) return;
  const players = room.players.filter(p => p.id !== playerId);
  if (players.length === 0) { removeRoom(code); return; }
  const presence = { ...room.presence }; delete presence[playerId];
  const ready = { ...room.ready }; delete ready[playerId];
  // If the host left, hand off to the next remaining player.
  const hostId = room.hostId === playerId ? players[0].id : room.hostId;
  saveRoom({ ...room, players, presence, ready, hostId });
}

/** Add a filler bot to the room (always ready). No-op if the room is full. */
export function addBot(code: string, bot: Player): SyncedRoom | null {
  const room = loadRoom(code);
  if (!room) return null;
  if (room.players.length >= room.maxPlayers) return room;
  const next: SyncedRoom = {
    ...room,
    players: [...room.players, { ...bot, bot: true }],
    ready: { ...room.ready, [bot.id]: true },
  };
  saveRoom(next);
  return next;
}

export function setReady(code: string, playerId: string, ready: boolean): SyncedRoom | null {
  const room = loadRoom(code);
  if (!room) return null;
  const next = { ...room, ready: { ...room.ready, [playerId]: ready } };
  saveRoom(next);
  return next;
}

export function transferHost(code: string, newHostId: string): SyncedRoom | null {
  const room = loadRoom(code);
  if (!room) return null;
  if (!room.players.some(p => p.id === newHostId)) return room; // target must be present
  const next = { ...room, hostId: newHostId };
  saveRoom(next);
  return next;
}

export function updateSettings(code: string, settings: Partial<RoomSettings>): SyncedRoom | null {
  const room = loadRoom(code);
  if (!room) return null;
  const next: SyncedRoom = {
    ...room,
    name: settings.name ?? room.name,
    maxPlayers: settings.maxPlayers ?? room.maxPlayers,
    isPublic: settings.isPublic ?? room.isPublic,
    gameId: settings.gameId ?? room.gameId,
  };
  saveRoom(next);
  return next;
}

/** Refresh the caller's heartbeat and prune stale members. Returns the snapshot. */
export function touchPresence(code: string, playerId: string, now: number): SyncedRoom | null {
  const room = loadRoom(code);
  if (!room) return null;
  const withPresence: SyncedRoom = {
    ...room,
    presence: { ...room.presence, [playerId]: now },
  };
  const pruned = pruneStale(withPresence, now);
  saveRoom(pruned);
  return pruned;
}

/** A player is online if they're a bot or their last heartbeat is recent. */
export function isOnline(room: SyncedRoom, playerId: string, now: number): boolean {
  if (room.players.find(p => p.id === playerId)?.bot) return true;
  return (room.presence[playerId] ?? 0) >= now - OFFLINE_MS;
}
