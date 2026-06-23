// Bridges the UI Player type → engine GamePlayer.
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
