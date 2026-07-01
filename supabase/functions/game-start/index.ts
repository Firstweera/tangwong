// game-start — host-only Edge Function that begins a match.
//
// Authority model (Phase 4.5.3, Option B): the server runs the EXISTING TS engine
// (single source of truth) with the service role, builds the initial game state
// (assigns roles + vision), and writes the public snapshot + each player's private
// slice. Clients can only READ those rows (RLS); they never write game state.
//
// Hidden info: each role lands in game_private (owner-only RLS), so no client —
// not even the host's browser — ever sees another player's role.
import { corsHeaders, json } from '../_shared/cors.ts';
import { adminClient, callerId } from '../_shared/supabase.ts';
import { GAME_REGISTRY } from '../_shared/games.ts';
import { GameEngine } from '../../../src/features/games/engine/engine.ts';
import type { GamePlayer, RoomState } from '../../../src/features/games/engine/types.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const uid = await callerId(req);
    if (!uid) return json({ error: 'not authenticated' }, 401);

    const { code, restart } = await req.json().catch(() => ({}));
    if (!code) return json({ error: 'missing code' }, 400);

    const db = adminClient();

    // Load the room (service role — bypasses RLS).
    const { data: room, error: roomErr } = await db
      .from('rooms').select('*').eq('code', code).maybeSingle();
    if (roomErr) return json({ error: roomErr.message }, 500);
    if (!room) return json({ error: 'room not found' }, 404);
    if (room.host_id !== uid) return json({ error: 'host only' }, 403);

    const entry = GAME_REGISTRY[room.game_id];
    if (!entry) return json({ error: `game not supported: ${room.game_id}` }, 400);

    // Idempotent: never re-deal roles for an already-started room — UNLESS the
    // host explicitly requests a rematch (restart), which clears the finished
    // game so the engine deals fresh roles into the same room + roster.
    const { data: existing } = await db
      .from('game_states').select('room_id').eq('room_id', room.id).maybeSingle();
    if (existing && !restart) return json({ ok: true, already: true });
    if (existing && restart) {
      await db.from('game_actions').delete().eq('room_id', room.id);
      await db.from('game_private').delete().eq('room_id', room.id);
      await db.from('game_states').delete().eq('room_id', room.id);
    }

    // Build the roster (humans + bots) from room_players.
    const { data: members, error: memErr } = await db
      .from('room_players').select('*').eq('room_id', room.id).order('joined_at');
    if (memErr) return json({ error: memErr.message }, 500);
    const players: GamePlayer[] = (members ?? []).map((m) => ({
      id: m.player_id,
      nickname: m.nickname,
      mascot: m.mascot,
      isHost: m.player_id === room.host_id,
      isConnected: true,
      isReady: m.is_ready,
    }));
    if (players.length < entry.config.minPlayers) {
      return json({ error: `need at least ${entry.config.minPlayers} players` }, 400);
    }

    const roomState: RoomState = {
      roomId: room.id,
      roomCode: room.code,
      gameId: room.game_id,
      hostId: room.host_id,
      players,
      maxPlayers: room.max_players,
      isPublic: room.is_public,
      status: 'in-game',
      createdAt: Date.parse(room.created_at),
    };

    // Run the engine: initial state (roles assigned) → first playable phase.
    const engine = new GameEngine(entry.config);
    let state = engine.createInitialState(roomState);
    if (entry.firstPhase) {
      const r = engine.transitionTo(state, entry.firstPhase);
      if (r.valid) state = r.state;
    }

    // Persist the public snapshot.
    const { error: pubErr } = await db.from('game_states').insert({
      room_id: room.id,
      game_id: room.game_id,
      phase: state.public.phase,
      turn: state.public.turn,
      round: state.public.round,
      active_player_id: state.public.activePlayerId,
      public_data: state.public.data,
      winner: state.winner,
      status: 'in-game',
      version: 0,
    });
    if (pubErr) return json({ error: pubErr.message }, 500);

    // Persist each player's private slice (the hidden-info rows).
    const privateRows = Object.values(state.private).map((p) => ({
      room_id: room.id,
      player_id: p.playerId,
      private_data: p.data,
    }));
    const { error: privErr } = await db.from('game_private').insert(privateRows);
    if (privErr) return json({ error: privErr.message }, 500);

    // Log + flip the room into the game.
    await db.from('game_actions').insert({
      room_id: room.id, player_id: uid, type: 'GAME_STARTED', payload: {},
    });
    await db.from('rooms').update({ status: 'in-game' }).eq('id', room.id);

    return json({ ok: true });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
