// Composable action validators.
// Each validator is a pure function: (state, action) => ActionResult.
// Compose them with composeValidators() to build game-specific rules.
import type { GameAction, GameState, ActionResult, PhaseConfig } from './types';
import { isActionAllowed } from './phases';

// ─── Primitive validators ─────────────────────────────────────────────────────

/** Ensures the action type is allowed in the current phase */
export function validatePhase(phases: PhaseConfig[]) {
  return <TPublic, TPrivate>(
    state: GameState<TPublic, TPrivate>,
    action: GameAction
  ): ActionResult => {
    if (!isActionAllowed(action.type, state.public.phase, phases)) {
      return {
        valid: false,
        error: `"${action.type}" is not allowed in phase "${state.public.phase}"`,
      };
    }
    return { valid: true };
  };
}

/** Ensures the acting player is in the room */
export function validatePlayerExists<TPublic, TPrivate>(
  state: GameState<TPublic, TPrivate>,
  action: GameAction
): ActionResult {
  const exists = state.room.players.some(p => p.id === action.playerId);
  return exists
    ? { valid: true }
    : { valid: false, error: `Player "${action.playerId}" is not in the room` };
}

/** Ensures the acting player is connected */
export function validatePlayerConnected<TPublic, TPrivate>(
  state: GameState<TPublic, TPrivate>,
  action: GameAction
): ActionResult {
  const player = state.room.players.find(p => p.id === action.playerId);
  return player?.isConnected
    ? { valid: true }
    : { valid: false, error: `Player "${action.playerId}" is not connected` };
}

/** Ensures the acting player is the room host */
export function validateIsHost<TPublic, TPrivate>(
  state: GameState<TPublic, TPrivate>,
  action: GameAction
): ActionResult {
  return state.room.hostId === action.playerId
    ? { valid: true }
    : { valid: false, error: `Player "${action.playerId}" is not the host` };
}

/** Ensures the acting player is the active turn player */
export function validateIsActiveTurn<TPublic, TPrivate>(
  state: GameState<TPublic, TPrivate>,
  action: GameAction
): ActionResult {
  return state.public.activePlayerId === action.playerId
    ? { valid: true }
    : { valid: false, error: `It is not player "${action.playerId}"'s turn` };
}

/** Ensures the game has not already ended */
export function validateGameNotEnded<TPublic, TPrivate>(
  state: GameState<TPublic, TPrivate>,
  _action: GameAction
): ActionResult {
  return state.public.phase !== 'end'
    ? { valid: true }
    : { valid: false, error: 'The game has already ended' };
}

/** Ensures the game is in-progress (not in lobby or ended) */
export function validateGameInProgress<TPublic, TPrivate>(
  state: GameState<TPublic, TPrivate>,
  _action: GameAction
): ActionResult {
  const phase = state.public.phase;
  return phase !== 'lobby' && phase !== 'end'
    ? { valid: true }
    : { valid: false, error: `Game is not in progress (current phase: "${phase}")` };
}

// ─── Composer ─────────────────────────────────────────────────────────────────

/**
 * Combines multiple validators into one.
 * Stops and returns the first failure; passes only when all succeed.
 *
 * @example
 * const validate = composeValidators(
 *   validatePlayerExists,
 *   validatePlayerConnected,
 *   validateIsActiveTurn,
 *   (state, action) => myCustomRule(state, action),
 * );
 */
export function composeValidators<TPublic, TPrivate>(
  ...validators: Array<
    (state: GameState<TPublic, TPrivate>, action: GameAction) => ActionResult
  >
) {
  return (state: GameState<TPublic, TPrivate>, action: GameAction): ActionResult => {
    for (const v of validators) {
      const result = v(state, action);
      if (!result.valid) return result;
    }
    return { valid: true };
  };
}

/** Always-valid stub — useful as a placeholder during development */
export const alwaysValid = <TPublic, TPrivate>(
  _state: GameState<TPublic, TPrivate>,
  _action: GameAction
): ActionResult => ({ valid: true });
