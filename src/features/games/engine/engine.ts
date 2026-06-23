// GameEngine — pure state machine for any TangWong game.
// Immutable: every method returns a new state object, never mutates in place.
import type {
  GameEngineConfig,
  GameState,
  GamePlayer,
  GameAction,
  GameEvent,
  GameEventType,
  GamePhase,
  DispatchResult,
  WinResult,
  ActionResult,
  RoomState,
} from './types.ts';
import { systemEvent, playerEvent } from './events.ts';
import {
  isValidTransition,
  applyPhaseTransition,
  getAllowedActions,
  isActionAllowed,
  shouldAutoAdvance,
} from './phases.ts';

export class GameEngine<TPublic = unknown, TPrivate = unknown> {
  constructor(private readonly config: GameEngineConfig<TPublic, TPrivate>) {}

  // ─── Setup ──────────────────────────────────────────────────────────────────

  /**
   * Build the initial GameState from a room.
   * Call this when the host presses "Start Game".
   */
  createInitialState(room: RoomState): GameState<TPublic, TPrivate> {
    const { players } = room;

    const publicData = this.config.createInitialPublicState(players);
    const privateData = this.config.createInitialPrivateState(players);

    const startEvent = systemEvent('GAME_STARTED', 'lobby', {
      gameId: this.config.id,
      playerCount: players.length,
    });

    return {
      room: { ...room, status: 'in-game' },
      public: {
        phase: 'lobby',
        turn: 0,
        round: 0,
        activePlayerId: room.hostId,
        data: publicData,
      },
      private: Object.fromEntries(
        players.map(p => [p.id, { playerId: p.id, data: privateData[p.id] }])
      ),
      events: [startEvent],
      winner: null,
    };
  }

  // ─── Dispatch ────────────────────────────────────────────────────────────────

  /**
   * Apply a player action to the current state.
   * Returns the next state + any events emitted, plus validity info.
   * Never throws — errors are returned as `{ valid: false, error }`.
   */
  dispatch(
    state: GameState<TPublic, TPrivate>,
    action: GameAction
  ): DispatchResult<TPublic, TPrivate> {
    if (state.winner) {
      return { state, events: [], valid: false, error: 'Game has already ended' };
    }

    if (!isActionAllowed(action.type, state.public.phase, this.config.phases)) {
      return {
        state, events: [], valid: false,
        error: `Action "${action.type}" not allowed in phase "${state.public.phase}"`,
      };
    }

    const actionDef = this.config.actions[action.type];
    if (!actionDef) {
      return { state, events: [], valid: false, error: `Unknown action type "${action.type}"` };
    }

    const validation = actionDef.validate(state, action);
    if (!validation.valid) {
      return { state, events: [], valid: false, error: validation.error };
    }

    // Collect events emitted by the handler
    const emittedEvents: GameEvent[] = [];
    const emit = (type: GameEventType, payload?: unknown) => {
      emittedEvents.push(playerEvent(type, state.public.phase, action.playerId, payload));
    };

    // Apply handler — pure, returns new state
    let nextState = actionDef.handle(state, action, emit);
    nextState = { ...nextState, events: [...nextState.events, ...emittedEvents] };

    // Check win conditions after every action
    const win = this.checkWin(nextState);
    if (win) {
      const winEvent = systemEvent('GAME_ENDED', nextState.public.phase, win);
      nextState = {
        ...nextState,
        public: { ...nextState.public, phase: 'end' },
        room: { ...nextState.room, status: 'ended' },
        winner: win,
        events: [...nextState.events, winEvent],
      };
      emittedEvents.push(winEvent);
      return { state: nextState, events: emittedEvents, valid: true };
    }

    // Auto-advance phase if conditions are met (e.g. all-voted)
    if (this.config.gameMaster?.autoAdvancePhase) {
      const nextPhase = shouldAutoAdvance(nextState, this.config.phases);
      if (nextPhase) {
        const result = this.transitionTo(nextState, nextPhase);
        return {
          state: result.state,
          events: [...emittedEvents, ...result.events],
          valid: true,
        };
      }
    }

    return { state: nextState, events: emittedEvents, valid: true };
  }

  // ─── Phase Transitions ───────────────────────────────────────────────────────

  /**
   * Move to a different phase.
   * Returns invalid result if the transition is not defined in the config.
   */
  transitionTo(
    state: GameState<TPublic, TPrivate>,
    to: GamePhase
  ): DispatchResult<TPublic, TPrivate> {
    if (!isValidTransition(state.public.phase, to, this.config.phases)) {
      return {
        state, events: [], valid: false,
        error: `Cannot transition from "${state.public.phase}" to "${to}"`,
      };
    }
    const { state: nextState, event } = applyPhaseTransition(state, to);
    return { state: nextState, events: [event], valid: true };
  }

  canTransitionTo(state: GameState<TPublic, TPrivate>, to: GamePhase): boolean {
    return isValidTransition(state.public.phase, to, this.config.phases);
  }

  // ─── Win Conditions ──────────────────────────────────────────────────────────

  checkWin(state: GameState<TPublic, TPrivate>): WinResult | null {
    for (const condition of this.config.winConditions) {
      const result = condition.check(state);
      if (result) return result;
    }
    return null;
  }

  // ─── Validation ──────────────────────────────────────────────────────────────

  validate(state: GameState<TPublic, TPrivate>, action: GameAction): ActionResult {
    const def = this.config.actions[action.type];
    if (!def) return { valid: false, error: `Unknown action "${action.type}"` };
    if (!isActionAllowed(action.type, state.public.phase, this.config.phases)) {
      return { valid: false, error: `"${action.type}" not allowed in phase "${state.public.phase}"` };
    }
    return def.validate(state, action);
  }

  // ─── Queries ─────────────────────────────────────────────────────────────────

  /** All action types allowed in the given phase */
  getAllowedActions(phase: GamePhase): string[] {
    return getAllowedActions(phase, this.config.phases);
  }

  /**
   * Action types a specific player can currently take.
   * Runs each action's validator with a null payload to check eligibility.
   */
  getPlayerAllowedActions(
    state: GameState<TPublic, TPrivate>,
    playerId: string
  ): string[] {
    const base = getAllowedActions(state.public.phase, this.config.phases);
    return base.filter(type => {
      const def = this.config.actions[type];
      if (!def) return false;
      return def.validate(state, { type, playerId, payload: null }).valid;
    });
  }

  get id(): string { return this.config.id; }
  get minPlayers(): number { return this.config.minPlayers; }
  get maxPlayers(): number { return this.config.maxPlayers; }
}
