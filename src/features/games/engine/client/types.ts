// Game Client — transport-agnostic types.
//
// Adapted from the boardgame.io Client pattern (client.moves.X(), subscribe,
// getState, pluggable multiplayer transport) on top of TangWong's own engine.
// Pure TypeScript — no React, no DOM.
import type { GameAction, GameState, RoomState } from '../types.ts';

/** Map of action type → payload type. Drives the typed `client.moves` API. */
export type MoveMap = Record<string, unknown>;

/** Result of a submit — mirrors boardgame.io's INVALID_MOVE as a value. */
export type MoveResult = { ok: true } | { ok: false; error: string };

export type ClientStatus = 'idle' | 'connecting' | 'ready' | 'error';

/** Room-level facts a UI needs even before a game state exists (e.g. who may start). */
export interface MatchInfo {
  roomId: string;
  roomCode: string;
  gameId: string;
  hostId: string;
}

/** What a transport pushes to one seat: that seat's redacted view. */
export interface TransportSnapshot<TPublic, TPrivate> {
  /** null until the transport knows which room it is attached to. */
  match: MatchInfo | null;
  /** Already redacted for the subscribing seat (or null before the game starts). */
  state: GameState<TPublic, TPrivate> | null;
  /**
   * Monotonic per-transport sequence — bumps on every delivered change. Not the
   * server row version (that resets to 0 on restart).
   */
  version: number;
}

/** Sync/load failure pushed by a transport (e.g. fetch failed). Keeps the last good state. */
export interface TransportError {
  error: string;
}

export type SnapshotListener<TPublic, TPrivate> = (
  snapshot: TransportSnapshot<TPublic, TPrivate> | TransportError,
) => void;

/**
 * The seam between a client and whoever is authoritative for the match.
 *
 * - LocalTransport: in-memory master, many seats in one tab (dev, tests, bots).
 * - SupabaseTransport (services/supabase/gameTransport.ts): Edge Functions +
 *   Realtime + RLS private rows.
 *
 * Every transport MUST only ever deliver the viewer's own private slice.
 */
export interface GameTransport<TPublic = unknown, TPrivate = unknown> {
  /** Begin receiving snapshots for `playerId`. Returns an unsubscribe fn. */
  connect(playerId: string, listener: SnapshotListener<TPublic, TPrivate>): () => void;
  /** Start (or restart) the match. `room` is required by transports that build state locally. */
  start(playerId: string, opts?: { room?: RoomState; restart?: boolean }): Promise<MoveResult>;
  /** Submit one action on behalf of `action.playerId`. */
  submit(action: GameAction): Promise<MoveResult>;
  /** Host-triggered: resolve whoever is holding up the current phase. */
  timeout(playerId: string): Promise<MoveResult>;
}

export interface ClientSnapshot<TPublic, TPrivate> {
  status: ClientStatus;
  match: MatchInfo | null;
  /** Redacted view for this client's seat. */
  state: GameState<TPublic, TPrivate> | null;
  version: number;
  /** A submit is in flight — UI should disable controls. */
  busy: boolean;
  /** Last move/transport error, cleared on the next successful submit. */
  error: string | null;
}

/** `client.moves.VOTE_TEAM({ approve: true })` — one typed fn per action type. */
export type Moves<TMoves extends MoveMap> = {
  [K in keyof TMoves & string]: (payload: TMoves[K]) => Promise<MoveResult>;
};

export interface GameClient<TPublic = unknown, TPrivate = unknown, TMoves extends MoveMap = MoveMap> {
  readonly playerId: string;
  readonly moves: Moves<TMoves>;
  getState(): ClientSnapshot<TPublic, TPrivate>;
  subscribe(listener: () => void): () => void;
  /** Untyped escape hatch — same as `moves[type](payload)`. */
  submit(type: string, payload: unknown): Promise<MoveResult>;
  startGame(opts?: { room?: RoomState; restart?: boolean }): Promise<MoveResult>;
  timeout(): Promise<MoveResult>;
  /** Connect to the transport. Idempotent. */
  start(): void;
  /** Disconnect from the transport. Idempotent. */
  stop(): void;
}
