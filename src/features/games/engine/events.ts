// Event factory helpers — keep event creation consistent across games.
import type { GameEvent, GameEventType, GamePhase } from './types';

let _counter = 0;

function makeId(): string {
  return `evt_${Date.now()}_${++_counter}`;
}

export function createEvent(
  type: GameEventType,
  phase: GamePhase,
  playerId: string | null = null,
  payload: unknown = {}
): GameEvent {
  return { id: makeId(), type, playerId, payload, timestamp: Date.now(), phase };
}

/** An event triggered by the engine itself (no specific player) */
export function systemEvent(
  type: GameEventType,
  phase: GamePhase,
  payload: unknown = {}
): GameEvent {
  return createEvent(type, phase, null, payload);
}

/** An event triggered by a player action */
export function playerEvent(
  type: GameEventType,
  phase: GamePhase,
  playerId: string,
  payload: unknown = {}
): GameEvent {
  return createEvent(type, phase, playerId, payload);
}

/** Filter events by type */
export function eventsOfType(
  events: GameEvent[],
  type: GameEventType
): GameEvent[] {
  return events.filter(e => e.type === type);
}

/** Get the most recent event of a given type */
export function lastEventOfType(
  events: GameEvent[],
  type: GameEventType
): GameEvent | undefined {
  return [...events].reverse().find(e => e.type === type);
}
