// game-action — the single server-authoritative game-write entry point.
//
// Phase 4.5.3 B3: clients submit intent only. This Edge Function authenticates
// the caller, reconstructs the full hidden-info state with the service role,
// dispatches through the shared TS engine, resolves bot seats on the server, and
// persists the next public + private snapshots. Clients converge through
// Postgres realtime and can read only their own game_private row via RLS.
import { corsHeaders, json } from '../_shared/cors.ts';
import { adminClient, callerId } from '../_shared/supabase.ts';
import { GameEngine } from '../../../src/features/games/engine/engine.ts';
import { avalonConfig } from '../../../src/features/games/avalon/config.ts';
import { nextBotAction } from '../../../src/features/games/avalon/bot.ts';
import type {
  GameAction,
  GameEngineConfig,
  GamePlayer,
  GameState,
  RoomState,
} from '../../../src/features/games/engine/types.ts';
import type { AvalonPrivate, AvalonPublic } from '../../../src/features/games/avalon/types.ts';

type AnyState = GameState<Record<string, unknown>, unknown>;

interface RoomRow {
  id: string;
  code: string;
  name: string;
  game_id: string;
  host_id: string;
  max_players: number;
  is_public: boolean;
  status: string;
  created_at: string;
}

interface MemberRow {
  player_id: string;
  nickname: string;
  mascot: string;
  is_ready: boolean;
  is_bot: boolean;
}

interface GameStateRow {
  room_id: string;
  game_id: string;
  phase: string;
  turn: number;
  round: number;
  active_player_id: string | null;
  public_data: Record<string, unknown>;
  winner: unknown | null;
  status: string;
  version: number;
  updated_at: string;
}

interface PrivateRow {
  player_id: string;
  private_data: unknown;
}

const ENGINES: Record<string, GameEngineConfig<unknown, unknown>> = {
  avalon: avalonConfig as GameEngineConfig<unknown, unknown>,
};

const PHASE_TIMEOUT_SECONDS: Record<string, number> = {
  teamProposal: 45,
  teamVote: 25,
  mission: 25,
};

const TIMEOUT_GRACE_MS = 750;

function assertTimeoutElapsed(row: GameStateRow):
  | { ok: true }
  | { ok: false; status: number; error: string; retryAfterMs?: number } {
  const phaseSeconds = PHASE_TIMEOUT_SECONDS[row.phase];
  if (!phaseSeconds) return { ok: false, status: 400, error: 'phase has no timer' };

  const updatedAt = Date.parse(row.updated_at);
  if (!Number.isFinite(updatedAt)) {
    return { ok: false, status: 500, error: 'game timer is unavailable' };
  }

  const requiredMs = phaseSeconds * 1000;
  const elapsedMs = Date.now() - updatedAt;
  if (elapsedMs + TIMEOUT_GRACE_MS < requiredMs) {
    return {
      ok: false,
      status: 409,
      error: 'timer has not expired',
      retryAfterMs: Math.max(0, requiredMs - elapsedMs),
    };
  }

  return { ok: true };
}

function buildRoomState(room: RoomRow, members: MemberRow[]): RoomState {
  const players: GamePlayer[] = members.map((m) => ({
    id: m.player_id,
    nickname: m.nickname,
    mascot: m.mascot as GamePlayer['mascot'],
    isHost: m.player_id === room.host_id,
    isConnected: true,
    isReady: m.is_ready,
  }));
  return {
    roomId: room.id,
    roomCode: room.code,
    gameId: room.game_id,
    hostId: room.host_id,
    players,
    maxPlayers: room.max_players,
    isPublic: room.is_public,
    status: room.status as RoomState['status'],
    createdAt: Date.parse(room.created_at),
  };
}

function buildGameState(room: RoomState, row: GameStateRow, privateRows: PrivateRow[]): AnyState {
  return {
    room,
    public: {
      phase: row.phase,
      turn: row.turn,
      round: row.round,
      activePlayerId: row.active_player_id,
      data: row.public_data ?? {},
    },
    private: Object.fromEntries(
      privateRows.map((p) => [p.player_id, { playerId: p.player_id, data: p.private_data }])
    ),
    events: [],
    winner: row.winner as AnyState['winner'],
  };
}

function revealForPublic(state: GameState<AvalonPublic, AvalonPrivate>) {
  return Object.fromEntries(
    Object.values(state.private).map((p) => [
      p.playerId,
      { role: p.data.role, side: p.data.side },
    ])
  );
}

function publicDataForDb(state: AnyState): Record<string, unknown> {
  if (state.winner && state.room.gameId === 'avalon') {
    const avalonState = state as unknown as GameState<AvalonPublic, AvalonPrivate>;
    return {
      ...(avalonState.public.data as unknown as Record<string, unknown>),
      reveal: revealForPublic(avalonState),
    };
  }
  return state.public.data;
}

function publicPayload(action: GameAction): Record<string, unknown> {
  if (action.type === 'PLAY_MISSION_CARD') return { submitted: true };
  return (action.payload && typeof action.payload === 'object')
    ? action.payload as Record<string, unknown>
    : {};
}

function nextServerBotActor(state: AnyState): string | null {
  if (state.winner) return null;
  for (const player of state.room.players) {
    if (!player.id.startsWith('bot_')) continue;
    const action = nextBotAction(
      state as unknown as GameState<AvalonPublic, AvalonPrivate>,
      player.id
    );
    if (action) return player.id;
  }
  return null;
}

function nextTimedOutAction(state: AnyState): GameAction | null {
  if (state.winner) return null;
  const avalonState = state as unknown as GameState<AvalonPublic, AvalonPrivate>;
  for (const player of state.room.players) {
    const action = nextBotAction(avalonState, player.id);
    if (action) return action;
  }
  return null;
}

function resolveBots(
  engine: GameEngine<unknown, unknown>,
  state: AnyState,
  actionLog: GameAction[]
): AnyState {
  let next = state;
  for (let i = 0; i < 50; i += 1) {
    const botId = nextServerBotActor(next);
    if (!botId) return next;
    const botAction = nextBotAction(
      next as unknown as GameState<AvalonPublic, AvalonPrivate>,
      botId
    );
    if (!botAction) return next;
    const result = engine.dispatch(next, botAction);
    if (!result.valid) return next;
    actionLog.push(botAction);
    next = result.state as AnyState;
  }
  return next;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const uid = await callerId(req);
    if (!uid) return json({ error: 'not authenticated' }, 401);

    const { code, type, payload } = await req.json().catch(() => ({}));
    if (!code) return json({ error: 'missing code' }, 400);
    if (!type || typeof type !== 'string') return json({ error: 'missing action type' }, 400);

    const db = adminClient();

    const { data: room, error: roomErr } = await db
      .from('rooms').select('*').eq('code', code).maybeSingle();
    if (roomErr) return json({ error: roomErr.message }, 500);
    if (!room) return json({ error: 'room not found' }, 404);
    if (room.status !== 'in-game') return json({ error: 'room is not in-game' }, 409);

    const { data: members, error: membersErr } = await db
      .from('room_players').select('*').eq('room_id', room.id).order('joined_at');
    if (membersErr) return json({ error: membersErr.message }, 500);
    if (!(members ?? []).some((m: MemberRow) => m.player_id === uid && !m.is_bot)) {
      return json({ error: 'not a room member' }, 403);
    }

    const { data: gameRow, error: gameErr } = await db
      .from('game_states').select('*').eq('room_id', room.id).maybeSingle();
    if (gameErr) return json({ error: gameErr.message }, 500);
    if (!gameRow) return json({ error: 'game not started' }, 404);
    if (gameRow.status !== 'in-game') return json({ error: 'game is not active' }, 409);

    const { data: privateRows, error: privErr } = await db
      .from('game_private').select('*').eq('room_id', room.id);
    if (privErr) return json({ error: privErr.message }, 500);

    const config = ENGINES[gameRow.game_id];
    if (!config) return json({ error: `game not supported: ${gameRow.game_id}` }, 400);

    const engine = new GameEngine(config);
    const roomState = buildRoomState(room as RoomRow, (members ?? []) as MemberRow[]);
    const row = gameRow as GameStateRow;
    const state = buildGameState(roomState, row, (privateRows ?? []) as PrivateRow[]);
    const actionLog: GameAction[] = [];
    let action: GameAction = { type, playerId: uid, payload: payload ?? null };

    if (type === 'TIMEOUT') {
      if (uid !== room.host_id) return json({ error: 'host only' }, 403);
      const timer = assertTimeoutElapsed(row);
      if (!timer.ok) {
        return json(
          { error: timer.error, retryAfterMs: timer.retryAfterMs },
          timer.status
        );
      }

      const timedOutAction = nextTimedOutAction(state);
      if (!timedOutAction) return json({ error: 'nothing to timeout' }, 409);
      actionLog.push({
        type: 'TIMEOUT',
        playerId: uid,
        payload: {
          phase: state.public.phase,
          actorId: timedOutAction.playerId,
          actionType: timedOutAction.type,
        },
      });
      action = timedOutAction;
    }

    const result = engine.dispatch(state, action);
    if (!result.valid) return json({ error: result.error ?? 'invalid action' }, 400);

    actionLog.push(action);
    const nextState = resolveBots(engine, result.state as AnyState, actionLog);
    const nextVersion = row.version + 1;
    const status = nextState.winner ? 'ended' : 'in-game';

    const { data: updated, error: updateErr } = await db
      .from('game_states')
      .update({
        phase: nextState.public.phase,
        turn: nextState.public.turn,
        round: nextState.public.round,
        active_player_id: nextState.public.activePlayerId,
        public_data: publicDataForDb(nextState),
        winner: nextState.winner,
        status,
        version: nextVersion,
        updated_at: new Date().toISOString(),
      })
      .eq('room_id', room.id)
      .eq('version', row.version)
      .select('version')
      .maybeSingle();
    if (updateErr) return json({ error: updateErr.message }, 500);
    if (!updated) return json({ error: 'version conflict', retry: true }, 409);

    const privateUpserts = Object.values(nextState.private).map((p) => ({
      room_id: room.id,
      player_id: p.playerId,
      private_data: p.data,
      updated_at: new Date().toISOString(),
    }));
    const { error: upsertErr } = await db.from('game_private').upsert(privateUpserts);
    if (upsertErr) return json({ error: upsertErr.message }, 500);

    const actionRows = actionLog.map((a) => ({
      room_id: room.id,
      player_id: a.playerId,
      type: a.type,
      payload: publicPayload(a),
    }));
    const { error: logErr } = await db.from('game_actions').insert(actionRows);
    if (logErr) return json({ error: logErr.message }, 500);

    if (nextState.winner) {
      await db.from('rooms').update({ status: 'ended' }).eq('id', room.id);
    }

    return json({
      ok: true,
      version: nextVersion,
      phase: nextState.public.phase,
      status,
      botActions: actionLog.filter((a) => a.playerId.startsWith('bot_')).length,
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
