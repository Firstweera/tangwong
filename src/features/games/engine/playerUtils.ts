// Bridges the UI Player type → engine GamePlayer, plus player lifecycle helpers
// for games that eliminate players (Werewolf, Salem, etc.).
//
// Convention for elimination: TPublic must include `eliminatedPlayers: string[]`.
// Use `alivePlayers` / `isAlive` in engine logic; `eliminate` to build the next list.
import type { Player } from '../../../types/index.ts';
import type { GamePlayer, RoomState } from './types.ts';
import type { Room } from '../../../types/index.ts';

/** Convert a UI Player to an engine GamePlayer */
export function playerToGamePlayer(
  player: Player,
  hostId: string,
  options?: { isReady?: boolean; isConnected?: boolean }
): GamePlayer {
  return {
    id: player.id,
    nickname: player.name,
    mascot: player.mascot,
    isHost: player.id === hostId,
    isConnected: options?.isConnected ?? player.online,
    isReady: options?.isReady ?? false,
  };
}

/** Convert a UI Room + Player roster → engine RoomState */
export function roomToRoomState(room: Room): RoomState {
  return {
    roomId: room.id,
    roomCode: room.code,
    gameId: room.gameId,
    hostId: room.hostId,
    players: room.players.map(p =>
      playerToGamePlayer(p, room.hostId)
    ),
    maxPlayers: room.maxPlayers,
    isPublic: room.isPublic,
    status: 'waiting',
    createdAt: room.createdAt,
  };
}

/** Look up a GamePlayer by id (throws if not found — use in validated contexts) */
export function requirePlayer(players: GamePlayer[], id: string): GamePlayer {
  const p = players.find(p => p.id === id);
  if (!p) throw new Error(`GamePlayer "${id}" not found`);
  return p;
}

/** Convert an engine GamePlayer back to a UI Player (for avatars, rosters). */
export function gamePlayerToPlayer(gp: GamePlayer): Player {
  return {
    id: gp.id,
    name: gp.nickname,
    en: gp.nickname,
    mascot: gp.mascot,
    online: gp.isConnected,
  };
}

// ─── Player Lifecycle (elimination games) ────────────────────────────────────

/** True if the player is in the roster and NOT in the eliminated list. */
export function isAlive(players: GamePlayer[], playerId: string, eliminatedIds: string[]): boolean {
  return players.some(p => p.id === playerId) && !eliminatedIds.includes(playerId);
}

/** All players not in the eliminated list, preserving seat order. */
export function alivePlayers(players: GamePlayer[], eliminatedIds: string[]): GamePlayer[] {
  return players.filter(p => !eliminatedIds.includes(p.id));
}

/** Return a new eliminated list with playerId added (idempotent). */
export function eliminate(eliminatedIds: string[], playerId: string): string[] {
  if (eliminatedIds.includes(playerId)) return eliminatedIds;
  return [...eliminatedIds, playerId];
}
