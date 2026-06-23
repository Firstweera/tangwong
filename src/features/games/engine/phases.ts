// Phase management — defaults, transition helpers, and action gating.
import type { GamePhase, PhaseConfig, GameState, GameEvent } from './types.ts';
import { systemEvent } from './events.ts';

// ─── Default phase definitions ────────────────────────────────────────────────
// Games override this by supplying their own phases array in GameEngineConfig.
// These defaults represent a turn-based social deduction flow.

export const DEFAULT_PHASES: PhaseConfig[] = [
  {
    id: 'lobby',
    label: 'Lobby',
    labelTh: 'ห้องรอ',
    allowedActions: ['PLAYER_READY', 'PLAYER_LEAVE', 'CHANGE_SETTING'],
    transitions: [{ to: 'setup', when: 'manual' }],
  },
  {
    id: 'setup',
    label: 'Setup',
    labelTh: 'ตั้งค่าเกม',
    allowedActions: [],
    transitions: [{ to: 'discussion', when: 'condition', condition: () => true }],
  },
  {
    id: 'discussion',
    label: 'Discussion',
    labelTh: 'อภิปราย',
    allowedActions: ['SEND_CHAT', 'NOMINATE'],
    transitions: [{ to: 'voting', when: 'manual' }],
  },
  {
    id: 'voting',
    label: 'Voting',
    labelTh: 'โหวต',
    allowedActions: ['VOTE'],
    transitions: [{ to: 'resolution', when: 'all-voted' }],
  },
  {
    id: 'resolution',
    label: 'Resolution',
    labelTh: 'ผล',
    allowedActions: ['PLAY_CARD'],
    transitions: [
      { to: 'discussion', when: 'condition' },
      { to: 'end', when: 'condition' },
    ],
  },
  {
    id: 'end',
    label: 'End',
    labelTh: 'จบเกม',
    allowedActions: [],
    transitions: [],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function findPhase(phases: PhaseConfig[], id: GamePhase): PhaseConfig | undefined {
  return phases.find(p => p.id === id);
}

export function isValidTransition(
  from: GamePhase,
  to: GamePhase,
  phases: PhaseConfig[]
): boolean {
  const phase = findPhase(phases, from);
  return phase?.transitions.some(t => t.to === to) ?? false;
}

export function getAllowedActions(
  phase: GamePhase,
  phases: PhaseConfig[]
): string[] {
  return findPhase(phases, phase)?.allowedActions ?? [];
}

export function isActionAllowed(
  actionType: string,
  phase: GamePhase,
  phases: PhaseConfig[]
): boolean {
  return getAllowedActions(phase, phases).includes(actionType);
}

/**
 * Pure transition: returns new state with updated phase + appended PHASE_CHANGED event.
 * Does NOT validate whether the transition is allowed — call isValidTransition first.
 */
export function applyPhaseTransition<TPublic, TPrivate>(
  state: GameState<TPublic, TPrivate>,
  to: GamePhase
): { state: GameState<TPublic, TPrivate>; event: GameEvent } {
  const event = systemEvent('PHASE_CHANGED', to, {
    from: state.public.phase,
    to,
  });
  const nextState: GameState<TPublic, TPrivate> = {
    ...state,
    public: { ...state.public, phase: to },
    events: [...state.events, event],
  };
  return { state: nextState, event };
}

/**
 * Check whether a phase's auto-advance condition is currently met.
 * Used by engines / game masters to trigger automatic transitions.
 */
export function shouldAutoAdvance<TPublic, TPrivate>(
  state: GameState<TPublic, TPrivate>,
  phases: PhaseConfig[]
): GamePhase | null {
  const current = findPhase(phases, state.public.phase);
  if (!current) return null;

  for (const t of current.transitions) {
    if (t.when === 'all-voted') {
      const votes = state.events.filter(
        e => e.type === 'VOTE_CAST' && e.phase === state.public.phase
      );
      if (votes.length >= state.room.players.length) return t.to;
    }
    if (t.when === 'condition' && t.condition?.(state as GameState<unknown, unknown>)) {
      return t.to;
    }
  }
  return null;
}
