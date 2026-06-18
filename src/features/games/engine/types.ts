// Generic Game Engine — core types.
// Pure TypeScript — no React, no DOM. Works on client and server.
import type { MascotKey } from '../../../types/index.ts';

// ─── Player ──────────────────────────────────────────────────────────────────

export interface GamePlayer {
  id: string;
  nickname: string;
  mascot: MascotKey;
  isHost: boolean;
  isConnected: boolean;
  isReady: boolean;
}

// ─── Room State ───────────────────────────────────────────────────────────────

export type GameRoomStatus = 'waiting' | 'starting' | 'in-game' | 'ended';

export interface RoomState {
  roomId: string;
  roomCode: string;
  gameId: string;
  hostId: string;
  players: GamePlayer[];
  maxPlayers: number;
  isPublic: boolean;
  status: GameRoomStatus;
  createdAt: number;
}

// ─── Game Phases ──────────────────────────────────────────────────────────────

// The canonical generic phases, plus an escape hatch (`string & {}`) so each
// game can declare its own phase ids (e.g. Avalon's 'teamProposal') while
// keeping autocomplete for the known values.
export type GamePhase =
  | 'lobby'
  | 'setup'
  | 'discussion'
  | 'voting'
  | 'resolution'
  | 'end'
  // eslint-disable-next-line @typescript-eslint/ban-types
  | (string & {});

export interface PhaseTransition {
  to: GamePhase;
  /** How this transition is triggered */
  when: 'manual' | 'all-voted' | 'time-expired' | 'condition';
  condition?: (state: GameState<unknown, unknown>) => boolean;
}

export interface PhaseConfig {
  id: GamePhase;
  label: string;
  labelTh: string;
  /** Action types that may be dispatched while in this phase */
  allowedActions: string[];
  /** Optional per-phase time limit in seconds */
  timeLimit?: number;
  transitions: PhaseTransition[];
}

// ─── Game State ───────────────────────────────────────────────────────────────

/** State visible to every player */
export interface PublicGameState<TPublic = unknown> {
  phase: GamePhase;
  turn: number;
  round: number;
  activePlayerId: string | null;
  /** Game-specific public data (votes tallied, quest results, board tiles, etc.) */
  data: TPublic;
}

/** State visible only to one player */
export interface PrivatePlayerState<TPrivate = unknown> {
  playerId: string;
  /** Game-specific private data (role, hand, secret objective, etc.) */
  data: TPrivate;
}

/** Complete snapshot of a game in progress */
export interface GameState<TPublic = unknown, TPrivate = unknown> {
  room: RoomState;
  public: PublicGameState<TPublic>;
  /** Keyed by playerId */
  private: Record<string, PrivatePlayerState<TPrivate>>;
  events: GameEvent[];
  winner: WinResult | null;
}

// ─── Events ───────────────────────────────────────────────────────────────────

export type GameEventType =
  | 'PLAYER_JOINED'
  | 'PLAYER_LEFT'
  | 'PLAYER_READY'
  | 'GAME_STARTED'
  | 'PHASE_CHANGED'
  | 'TURN_STARTED'
  | 'ACTION_SUBMITTED'
  | 'VOTE_CAST'
  | 'ROLE_REVEALED'
  | 'ROUND_ENDED'
  | 'GAME_ENDED';

export interface GameEvent {
  id: string;
  type: GameEventType;
  /** null = system / engine event */
  playerId: string | null;
  payload: unknown;
  timestamp: number;
  phase: GamePhase;
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export interface GameAction<TPayload = unknown> {
  type: string;
  playerId: string;
  payload: TPayload;
}

export interface ActionResult {
  valid: boolean;
  error?: string;
}

export type ActionValidator<TState> = (
  state: TState,
  action: GameAction
) => ActionResult;

/**
 * Pure function: takes current state and a validated action, returns next state.
 * Use `emit` to record events that occurred during handling.
 */
export type ActionHandler<TState> = (
  state: TState,
  action: GameAction,
  emit: (type: GameEventType, payload?: unknown) => void
) => TState;

// ─── Win Conditions ───────────────────────────────────────────────────────────

export type WinType = 'team' | 'individual' | 'score';

export interface WinResult {
  conditionId: string;
  type: WinType;
  /** playerIds of winners */
  winners: string[];
  /** For team wins */
  winnerTeam?: string;
  /** For score wins */
  scores?: Record<string, number>;
  reason: string;
  reasonTh: string;
}

export type WinConditionCheck<TPublic = unknown, TPrivate = unknown> = (
  state: GameState<TPublic, TPrivate>
) => WinResult | null;

export interface WinCondition<TPublic = unknown, TPrivate = unknown> {
  id: string;
  type: WinType;
  check: WinConditionCheck<TPublic, TPrivate>;
}

// ─── Engine Config ────────────────────────────────────────────────────────────

export interface ActionDef<TPublic = unknown, TPrivate = unknown> {
  validate: ActionValidator<GameState<TPublic, TPrivate>>;
  handle: ActionHandler<GameState<TPublic, TPrivate>>;
}

export interface GameMasterConfig {
  /** Automatically advance to the next phase when the trigger condition is met */
  autoAdvancePhase: boolean;
  /** Automatically assign roles during setup */
  autoAssignRoles: boolean;
  /** Enforce per-phase time limits automatically */
  enforceTimeLimit: boolean;
}

/**
 * Complete definition of a game.
 * Implement this interface to register a new game with the engine.
 */
export interface GameEngineConfig<TPublic = unknown, TPrivate = unknown> {
  id: string;
  minPlayers: number;
  maxPlayers: number;
  phases: PhaseConfig[];
  /** Build the initial public state from the player roster */
  createInitialPublicState: (players: GamePlayer[]) => TPublic;
  /** Build per-player private state (roles, hands, etc.) from the player roster */
  createInitialPrivateState: (players: GamePlayer[]) => Record<string, TPrivate>;
  /** Map of action type → validator + handler */
  actions: Record<string, ActionDef<TPublic, TPrivate>>;
  winConditions: WinCondition<TPublic, TPrivate>[];
  gameMaster?: GameMasterConfig;
}

// ─── Dispatch Result ──────────────────────────────────────────────────────────

export interface DispatchResult<TPublic = unknown, TPrivate = unknown> {
  state: GameState<TPublic, TPrivate>;
  /** Events emitted during this dispatch (useful for Socket.io broadcast) */
  events: GameEvent[];
  valid: boolean;
  error?: string;
}
