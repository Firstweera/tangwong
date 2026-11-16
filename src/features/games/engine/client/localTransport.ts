// LocalTransport — in-memory authoritative master for one match.
//
// Equivalent of boardgame.io's `Local()` multiplayer: one master holds the
// full GameState and every seat in the tab connects through the same
// transport, receiving only its own redacted view. Used for:
//   - offline / solo play (GamePage when Supabase is off)
//   - testing 5–10 seat games on one machine
//   - headless verify scripts
//
// Bot, timeout and end-game reveal semantics mirror
// supabase/functions/game-action so local play behaves like the deployed game.
import { GameEngine } from '../engine.ts';
import { redactStateFor } from '../view.ts';
import type { GameAction, GameEngineConfig, GamePhase, GameState, RoomState } from '../types.ts';
import type { GameTransport, MatchInfo, MoveResult, SnapshotListener } from './types.ts';

export type BotPolicy<TPublic, TPrivate> = (
  state: GameState<TPublic, TPrivate>,
  playerId: string,
) => GameAction | null;

export interface LocalMasterOptions<TPublic, TPrivate> {
  config: GameEngineConfig<TPublic, TPrivate>;
  /** Phase to enter right after createInitialState (which starts at 'lobby'). */
  firstPhase?: GamePhase;
  /** Bot decision function — same one the Edge Functions use. */
  nextBotAction?: BotPolicy<TPublic, TPrivate>;
  /** Which seats are bots. Default: ids starting with `bot_` (server convention). */
  isBot?: (playerId: string) => boolean;
  /** Auto-play bot seats after every accepted action (default true). */
  autoPlayBots?: boolean;
  /**
   * 0 (default): bots resolve synchronously, like the Edge Functions.
   * > 0: one bot move per delay, broadcasting each, so players can follow along.
   */
  botDelayMs?: number;
  /**
   * Restrict start + timeout to the room host (default true, like the server).
   * Offline solo play sets false — the local player drives both.
   */
  hostOnly?: boolean;
  /** Published as `public.data.reveal` once the game has a winner (server parity). */
  revealForPublic?: (state: GameState<TPublic, TPrivate>) => Record<string, unknown>;
  /** Room to use when `start()` is called without one. */
  room?: RoomState;
  /** Optional hook for logging / replay. Called for every applied action. */
  onAction?: (action: GameAction, state: GameState<TPublic, TPrivate>) => void;
}

export interface LocalMaster<TPublic, TPrivate> {
  readonly transport: GameTransport<TPublic, TPrivate>;
  /** Full, unredacted state. Devtools / tests only — never hand to a seat's UI. */
  getFullState(): GameState<TPublic, TPrivate> | null;
  /** Every action applied so far, including bot and timeout-resolved actions. */
  getActionLog(): readonly GameAction[];
  /** Let the bot policy play this seat (the "🤖 ออโต้" toggle). */
  setAutoPlay(playerId: string, on: boolean): void;
  isAutoPlay(playerId: string): boolean;
}

const MAX_BOT_STEPS = 200;
const ok: MoveResult = { ok: true };
const fail = (error: string): MoveResult => ({ ok: false, error });

export function createLocalMaster<TPublic = unknown, TPrivate = unknown>(
  options: LocalMasterOptions<TPublic, TPrivate>,
): LocalMaster<TPublic, TPrivate> {
  const engine = new GameEngine(options.config);
  const isBot = options.isBot ?? ((id: string) => id.startsWith('bot_'));
  const autoPlayBots = options.autoPlayBots ?? true;
  const botDelayMs = options.botDelayMs ?? 0;
  const hostOnly = options.hostOnly ?? true;
  const autoSeats = new Set<string>();
  const seats = new Map<string, Set<SnapshotListener<TPublic, TPrivate>>>();
  let state: GameState<TPublic, TPrivate> | null = null;
  let version = 0;
  let log: GameAction[] = [];
  let botTimer: ReturnType<typeof setTimeout> | null = null;

  const isAuto = (id: string) => isBot(id) || autoSeats.has(id);

  const matchOf = (room: RoomState | undefined): MatchInfo | null =>
    room ? { roomId: room.roomId, roomCode: room.roomCode, gameId: room.gameId, hostId: room.hostId } : null;

  const viewFor = (playerId: string) => ({
    match: matchOf(state?.room ?? options.room),
    state: state ? redactStateFor(state, playerId) : null,
    version,
  });

  const broadcast = () => {
    version += 1;
    seats.forEach((listeners, playerId) => {
      const snap = viewFor(playerId);
      listeners.forEach(l => l(snap));
    });
  };

  const apply = (action: GameAction): MoveResult => {
    if (!state) return fail('game not started');
    const result = engine.dispatch(state, action);
    if (!result.valid) return fail(result.error ?? 'invalid action');
    let next = result.state;
    if (next.winner && options.revealForPublic) {
      const reveal = options.revealForPublic(next);
      next = { ...next, public: { ...next.public, data: { ...next.public.data, reveal } as TPublic } };
    }
    state = next;
    log.push(action);
    options.onAction?.(action, state);
    return ok;
  };

  /** The next auto seat's action, or null when every auto seat is idle. */
  const nextAutoAction = (): GameAction | null => {
    if (!autoPlayBots || !options.nextBotAction || !state || state.winner) return null;
    for (const p of state.room.players) {
      if (!isAuto(p.id)) continue;
      const action = options.nextBotAction(state, p.id);
      if (action) return action;
    }
    return null;
  };

  const clearBotTimer = () => {
    if (botTimer) clearTimeout(botTimer);
    botTimer = null;
  };

  /** Advance auto seats: all at once (delay 0) or one step per delay. Caller broadcasts. */
  const runBots = () => {
    clearBotTimer();
    if (botDelayMs <= 0) {
      for (let i = 0; i < MAX_BOT_STEPS; i += 1) {
        const action = nextAutoAction();
        if (!action || !apply(action).ok) return;
      }
      return;
    }
    // Paused while nobody is watching; resumes on the next connect.
    if (seats.size === 0 || !nextAutoAction()) return;
    botTimer = setTimeout(() => {
      botTimer = null;
      const action = nextAutoAction();
      if (!action || !apply(action).ok) return;
      runBots();
      broadcast();
    }, botDelayMs);
  };

  const transport: GameTransport<TPublic, TPrivate> = {
    connect(playerId, listener) {
      let listeners = seats.get(playerId);
      if (!listeners) seats.set(playerId, (listeners = new Set()));
      listeners.add(listener);
      listener(viewFor(playerId));
      if (botDelayMs > 0 && !botTimer) runBots();
      return () => {
        listeners!.delete(listener);
        if (listeners!.size === 0) seats.delete(playerId);
        if (seats.size === 0) clearBotTimer();
      };
    },

    async start(playerId, opts) {
      if (state && !state.winner && !opts?.restart) return fail('game already started');
      const room = opts?.room ?? options.room;
      if (!room) return fail('LocalTransport.start needs a room');
      if (hostOnly && room.hostId !== playerId) return fail('host only');
      if (room.players.length < engine.minPlayers || room.players.length > engine.maxPlayers) {
        return fail(`needs ${engine.minPlayers}–${engine.maxPlayers} players`);
      }

      let next = engine.createInitialState(room);
      if (options.firstPhase) {
        const r = engine.transitionTo(next, options.firstPhase);
        if (!r.valid) return fail(r.error ?? 'invalid first phase');
        next = r.state;
      }
      state = next;
      log = [];
      runBots();
      broadcast();
      return ok;
    },

    async submit(action) {
      if (!state) return fail('game not started');
      if (!state.room.players.some(p => p.id === action.playerId)) return fail('not a room member');
      const result = apply(action);
      if (!result.ok) return result;
      runBots();
      broadcast();
      return ok;
    },

    async timeout(playerId) {
      if (!state) return fail('game not started');
      if (hostOnly && state.room.hostId !== playerId) return fail('host only');
      if (state.winner || !options.nextBotAction) return fail('nothing to timeout');
      // Same rule as the server: let the bot policy act for whoever is stalling.
      // Seats a human controls go first — auto seats will act on their own.
      const current = state;
      const ordered = [
        ...current.room.players.filter(p => !isAuto(p.id)),
        ...current.room.players.filter(p => isAuto(p.id)),
      ];
      let stalled: GameAction | null = null;
      for (const p of ordered) {
        stalled = options.nextBotAction(current, p.id);
        if (stalled) break;
      }
      if (!stalled) return fail('nothing to timeout');
      const result = apply(stalled);
      if (!result.ok) return result;
      runBots();
      broadcast();
      return ok;
    },
  };

  return {
    transport,
    getFullState: () => state,
    getActionLog: () => log,
    setAutoPlay(playerId, on) {
      if (on) autoSeats.add(playerId);
      else autoSeats.delete(playerId);
      runBots();
      if (botDelayMs <= 0) broadcast();
    },
    isAutoPlay: playerId => autoSeats.has(playerId),
  };
}
