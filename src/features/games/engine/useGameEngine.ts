// React hook — wraps GameEngine for use in pages/components.
import { useState, useCallback, useMemo } from 'react';
import { GameEngine } from './engine';
import type {
  GameEngineConfig,
  GameState,
  GameAction,
  GamePhase,
  DispatchResult,
  RoomState,
  WinResult,
} from './types';

export interface UseGameEngineReturn<TPublic, TPrivate> {
  state: GameState<TPublic, TPrivate> | null;
  /** Build initial state and start the game */
  start: (room: RoomState) => void;
  /** Dispatch a player action */
  dispatch: (action: GameAction) => DispatchResult<TPublic, TPrivate> | null;
  /** Manually transition to a new phase (host / game master) */
  transitionTo: (phase: GamePhase) => DispatchResult<TPublic, TPrivate> | null;
  /** Whether the game is currently in progress */
  isPlaying: boolean;
  /** Current phase, or null if not started */
  phase: GamePhase | null;
  /** Win result when game has ended, null otherwise */
  winner: WinResult | null;
  /** Raw engine instance — for advanced queries */
  engine: GameEngine<TPublic, TPrivate>;
}

/**
 * React hook that manages a game session with the GameEngine.
 *
 * @example
 * const { state, start, dispatch, phase } = useGameEngine(avalonConfig);
 *
 * // Host starts the game
 * start(room);
 *
 * // Player submits an action
 * dispatch({ type: 'VOTE', playerId: player.id, payload: { approve: true } });
 */
export function useGameEngine<TPublic, TPrivate>(
  config: GameEngineConfig<TPublic, TPrivate>
): UseGameEngineReturn<TPublic, TPrivate> {
  // Engine is stable — config should not change after mount
  const engine = useMemo(() => new GameEngine(config), []);
  const [state, setState] = useState<GameState<TPublic, TPrivate> | null>(null);

  const start = useCallback((room: RoomState) => {
    setState(engine.createInitialState(room));
  }, [engine]);

  const dispatch = useCallback(
    (action: GameAction): DispatchResult<TPublic, TPrivate> | null => {
      if (!state) return null;
      const result = engine.dispatch(state, action);
      if (result.valid) setState(result.state);
      return result;
    },
    [engine, state]
  );

  const transitionTo = useCallback(
    (phase: GamePhase): DispatchResult<TPublic, TPrivate> | null => {
      if (!state) return null;
      const result = engine.transitionTo(state, phase);
      if (result.valid) setState(result.state);
      return result;
    },
    [engine, state]
  );

  return {
    state,
    start,
    dispatch,
    transitionTo,
    isPlaying: state !== null && state.public.phase !== 'end',
    phase: state?.public.phase ?? null,
    winner: state?.winner ?? null,
    engine,
  };
}
