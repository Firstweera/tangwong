// Supabase game service — read model + Edge Function intent calls for Phase 4.5.3.
//
// Clients read the public game snapshot and ONLY their own private row through
// RLS. Every write goes through game-start/game-action Edge Functions.
import { supabase } from './client';
import type { SyncedRoom } from '@/services/realtime';
import type { Player } from '@/types';
import type { MascotKey } from '@/types';
import type { GameEvent, GameState, PrivatePlayerState, PublicGameState, RoomState, WinResult } from '@/features/games/engine';
import type { AvalonPrivate, AvalonPublic } from '@/features/games/avalon/types';

interface RoomRow {
  id: string;
  code: string;
  name: string;
  game_id: string;
  host_id: string;
  max_players: number;
  is_public: boolean;
  status: string;
  invite_link: string;
  created_at: string;
}

interface RoomPlayerRow {
  room_id: string;
  player_id: string;
  nickname: string;
  mascot: string;
  is_ready: boolean;
  is_bot: boolean;
  last_seen: string;
  joined_at: string;
}

interface GameStateRow {
  room_id: string;
  game_id: string;
  phase: string;
  turn: number;
  round: number;
  active_player_id: string | null;
  public_data: AvalonPublic;
  winner: WinResult | null;
  status: string;
  version: number;
  updated_at: string;
}

interface GamePrivateRow {
  room_id: string;
  player_id: string;
  private_data: AvalonPrivate;
  updated_at: string;
}

interface GameActionRow {
  id: number;
  room_id: string;
  player_id: string;
  type: string;
  payload: unknown;
  created_at: string;
}

export interface RealtimeGameSnapshot {
  room: SyncedRoom | null;
  state: GameState<AvalonPublic, AvalonPrivate> | null;
}

function assembleRoom(room: RoomRow, members: RoomPlayerRow[]): SyncedRoom {
  const players: Player[] = members.map(member => ({
    id: member.player_id,
    name: member.nickname,
    en: member.nickname,
    mascot: member.mascot as MascotKey,
    online: true,
    bot: member.is_bot,
  }));
  const ready: Record<string, boolean> = {};
  const presence: Record<string, number> = {};
  for (const member of members) {
    ready[member.player_id] = member.is_ready;
    presence[member.player_id] = Date.parse(member.last_seen);
  }
  return {
    id: room.id,
    code: room.code,
    name: room.name,
    maxPlayers: room.max_players,
    isPublic: room.is_public,
    gameId: room.game_id,
    hostId: room.host_id,
    players,
    status: room.status as SyncedRoom['status'],
    inviteLink: room.invite_link,
    createdAt: Date.parse(room.created_at),
    ready,
    presence,
  };
}

function toRoomState(room: SyncedRoom): RoomState {
  return {
    roomId: room.id,
    roomCode: room.code,
    gameId: room.gameId,
    hostId: room.hostId,
    players: room.players.map(player => ({
      id: player.id,
      nickname: player.name,
      mascot: player.mascot,
      isHost: player.id === room.hostId,
      isConnected: player.online,
      isReady: room.ready[player.id] ?? true,
    })),
    maxPlayers: room.maxPlayers,
    isPublic: room.isPublic,
    status: room.status === 'ended' ? 'ended' : 'in-game',
    createdAt: room.createdAt,
  };
}

function toEvents(actions: GameActionRow[], phase: string): GameEvent[] {
  return actions.map(action => ({
    id: String(action.id),
    type: 'ACTION_SUBMITTED',
    playerId: action.player_id,
    payload: { type: action.type, payload: action.payload },
    timestamp: Date.parse(action.created_at),
    phase,
  }));
}

function assembleGame(
  room: SyncedRoom,
  stateRow: GameStateRow,
  privateRows: GamePrivateRow[],
  actionRows: GameActionRow[],
): GameState<AvalonPublic, AvalonPrivate> {
  const privateState: Record<string, PrivatePlayerState<AvalonPrivate>> = {};
  for (const row of privateRows) {
    privateState[row.player_id] = {
      playerId: row.player_id,
      data: row.private_data,
    };
  }

  const publicState: PublicGameState<AvalonPublic> = {
    phase: stateRow.phase,
    turn: stateRow.turn,
    round: stateRow.round,
    activePlayerId: stateRow.active_player_id,
    data: stateRow.public_data,
  };

  return {
    room: toRoomState(room),
    public: publicState,
    private: privateState,
    events: toEvents(actionRows, stateRow.phase),
    winner: stateRow.winner,
  };
}

export async function fetchGame(code: string): Promise<RealtimeGameSnapshot> {
  if (!supabase) return { room: null, state: null };

  const { data: roomData, error: roomError } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', code)
    .maybeSingle();
  if (roomError) throw new Error(roomError.message);
  if (!roomData) return { room: null, state: null };

  const roomRow = roomData as RoomRow;
  const { data: memberData, error: memberError } = await supabase
    .from('room_players')
    .select('*')
    .eq('room_id', roomRow.id)
    .order('joined_at');
  if (memberError) throw new Error(memberError.message);

  const room = assembleRoom(roomRow, (memberData ?? []) as RoomPlayerRow[]);

  const { data: stateData, error: stateError } = await supabase
    .from('game_states')
    .select('*')
    .eq('room_id', room.id)
    .maybeSingle();
  if (stateError) throw new Error(stateError.message);
  if (!stateData) return { room, state: null };

  const { data: privateData, error: privateError } = await supabase
    .from('game_private')
    .select('*')
    .eq('room_id', room.id);
  if (privateError) throw new Error(privateError.message);

  const { data: actionData, error: actionError } = await supabase
    .from('game_actions')
    .select('*')
    .eq('room_id', room.id)
    .order('id', { ascending: true })
    .limit(80);
  if (actionError) throw new Error(actionError.message);

  return {
    room,
    state: assembleGame(
      room,
      stateData as GameStateRow,
      (privateData ?? []) as GamePrivateRow[],
      (actionData ?? []) as GameActionRow[],
    ),
  };
}

/**
 * Turn a functions.invoke error into the Edge Function's own `{ error }` message
 * (e.g. "host only", "version conflict") instead of the generic
 * "Edge Function returned a non-2xx status code".
 */
async function invokeErrorMessage(error: { message: string; context?: unknown }): Promise<string> {
  const ctx = error.context as { json?: () => Promise<unknown> } | undefined;
  if (ctx && typeof ctx.json === 'function') {
    try {
      const body = await ctx.json() as { error?: unknown } | null;
      if (body && typeof body.error === 'string') return body.error;
    } catch {
      // body already consumed or not JSON — fall back to the generic message
    }
  }
  return error.message;
}

export async function startGame(code: string, restart = false): Promise<void> {
  if (!supabase) return;
  const body = restart ? { code, restart: true } : { code };
  const { error } = await supabase.functions.invoke('game-start', { body });
  if (error) throw new Error(await invokeErrorMessage(error));
}

/** Current game status for a room ('in-game' | 'ended'), or null if no game. */
export async function fetchGameStatus(roomId: string): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.from('game_states').select('status').eq('room_id', roomId).maybeSingle();
  return (data as { status?: string } | null)?.status ?? null;
}

export async function submitAction(code: string, type: string, payload: unknown): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.functions.invoke('game-action', { body: { code, type, payload } });
  if (error) throw new Error(await invokeErrorMessage(error));
}

export async function timeoutGame(code: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.functions.invoke('game-action', {
    body: { code, type: 'TIMEOUT', payload: null },
  });
  if (error) throw new Error(await invokeErrorMessage(error));
}

export function subscribeGame(roomId: string, onChange: () => void): () => void {
  const client = supabase;
  if (!client) return () => {};

  const channel = client
    .channel(`game:${roomId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'game_states', filter: `room_id=eq.${roomId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'game_private', filter: `room_id=eq.${roomId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'game_actions', filter: `room_id=eq.${roomId}` }, onChange)
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}
