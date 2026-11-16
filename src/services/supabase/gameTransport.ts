// SupabaseTransport — GameTransport backed by Supabase (Epic 5.1).
//
// Authority stays exactly where it was: every write goes through the
// game-start / game-action Edge Functions, and reads go through RLS so a seat
// can only ever load its own `game_private` row. This file only adapts that
// flow to the GameClient seam:
//
//   const transport = createSupabaseTransport({ roomCode });
//   const client = createGameClient({ playerId: authUserId, transport });
//
// Sync model: Realtime postgres_changes only say "something changed"; the
// transport then refetches the snapshot. Fetches are serialized and coalesced
// (a burst of N change events → at most one extra fetch), so each delivered
// snapshot is newer than the previous one and the per-transport `version`
// sequence stays monotonic — even across a restart, where the server row
// version resets to 0.
import { redactStateFor } from '@/features/games/engine/view';
import type {
  GameAction,
  GameState,
  GameTransport,
  MatchInfo,
  MoveResult,
  SnapshotListener,
  TransportSnapshot,
} from '@/features/games/engine';
import * as defaultService from './game';
import type { RealtimeGameSnapshot } from './game';

/** The slice of services/supabase/game.ts this transport needs (injectable for tests). */
export interface GameService {
  fetchGame(code: string): Promise<RealtimeGameSnapshot>;
  startGame(code: string, restart?: boolean): Promise<void>;
  submitAction(code: string, type: string, payload: unknown): Promise<void>;
  timeoutGame(code: string): Promise<void>;
  subscribeGame(roomId: string, onChange: () => void): () => void;
}

export interface SupabaseTransportOptions {
  roomCode: string;
  /** Defaults to the real Supabase service. */
  service?: GameService;
}

export interface SupabaseTransport<TPublic, TPrivate> extends GameTransport<TPublic, TPrivate> {
  /** Force a refetch (e.g. after reconnecting from background). */
  refresh(): Promise<void>;
}

const errorMessage = (err: unknown) => (err instanceof Error ? err.message : String(err));

export function createSupabaseTransport<TPublic = unknown, TPrivate = unknown>(
  options: SupabaseTransportOptions,
): SupabaseTransport<TPublic, TPrivate> {
  const { roomCode } = options;
  const service: GameService = options.service ?? defaultService;
  const seats = new Map<string, Set<SnapshotListener<TPublic, TPrivate>>>();

  let latest: { match: MatchInfo | null; state: GameState<TPublic, TPrivate> | null } | null = null;
  let sequence = 0;
  let inFlight: Promise<void> | null = null;
  let dirty = false;
  let unsubscribeRealtime: (() => void) | null = null;
  let subscribedRoomId: string | null = null;

  const emitTo = (playerId: string, listener: SnapshotListener<TPublic, TPrivate>) => {
    if (!latest) return;
    const snap: TransportSnapshot<TPublic, TPrivate> = {
      match: latest.match,
      // RLS already limits private rows to the caller; redact again so a
      // misconfigured policy can never leak another seat into the UI.
      state: latest.state ? redactStateFor(latest.state, playerId) : null,
      version: sequence,
    };
    listener(snap);
  };

  const broadcast = () => seats.forEach((ls, id) => ls.forEach(l => emitTo(id, l)));
  const broadcastError = (error: string) => seats.forEach(ls => ls.forEach(l => l({ error })));

  const ensureRealtime = (roomId: string | null) => {
    if (!roomId || roomId === subscribedRoomId || seats.size === 0) return;
    unsubscribeRealtime?.();
    subscribedRoomId = roomId;
    unsubscribeRealtime = service.subscribeGame(roomId, () => { void refresh(); });
  };

  const fetchOnce = async () => {
    try {
      const snapshot = await service.fetchGame(roomCode);
      const room = snapshot.room;
      latest = {
        match: room
          ? { roomId: room.id, roomCode: room.code, gameId: room.gameId, hostId: room.hostId }
          : null,
        state: snapshot.state as unknown as GameState<TPublic, TPrivate> | null,
      };
      sequence += 1;
      ensureRealtime(room?.id ?? null);
      broadcast();
    } catch (err) {
      broadcastError(errorMessage(err));
    }
  };

  /** Serialized + coalesced refetch. Resolves once the DB state at call time is reflected. */
  function refresh(): Promise<void> {
    if (inFlight) {
      dirty = true;
      return inFlight;
    }
    inFlight = (async () => {
      do {
        dirty = false;
        await fetchOnce();
      } while (dirty && seats.size > 0);
      inFlight = null;
    })();
    return inFlight;
  }

  /** Run an Edge Function intent, then refetch so the caller sees its own result without waiting on Realtime. */
  const intent = async (op: () => Promise<void>): Promise<MoveResult> => {
    try {
      await op();
    } catch (err) {
      return { ok: false, error: errorMessage(err) };
    }
    await refresh();
    return { ok: true };
  };

  return {
    connect(playerId, listener) {
      let listeners = seats.get(playerId);
      if (!listeners) seats.set(playerId, (listeners = new Set()));
      listeners.add(listener);

      if (latest) emitTo(playerId, listener);
      if (!latest || !subscribedRoomId) void refresh();

      return () => {
        listeners!.delete(listener);
        if (listeners!.size === 0) seats.delete(playerId);
        if (seats.size === 0) {
          unsubscribeRealtime?.();
          unsubscribeRealtime = null;
          subscribedRoomId = null;
        }
      };
    },

    // Host check, player-count and roster validation happen in game-start.
    start: (_playerId, opts) => intent(() => service.startGame(roomCode, opts?.restart ?? false)),

    // The Edge Function derives the actor from the auth token; action.playerId
    // is only meaningful for LocalTransport.
    submit: (action: GameAction) =>
      intent(() => service.submitAction(roomCode, action.type, action.payload)),

    timeout: () => intent(() => service.timeoutGame(roomCode)),

    refresh,
  };
}
