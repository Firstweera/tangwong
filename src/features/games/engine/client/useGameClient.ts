// React binding for a GameClient — re-renders on every client snapshot.
import { useSyncExternalStore } from 'react';
import type { ClientSnapshot, GameClient, MoveMap } from './types.ts';

const IDLE: ClientSnapshot<never, never> = {
  status: 'idle',
  match: null,
  state: null,
  version: -1,
  busy: false,
  error: null,
};
const noopSubscribe = () => () => {};
const idleSnapshot = () => IDLE;

/** Pass `null` while the client is not ready yet (e.g. awaiting auth) — returns an idle snapshot. */
export function useGameClient<TPublic, TPrivate, TMoves extends MoveMap>(
  client: GameClient<TPublic, TPrivate, TMoves> | null,
): ClientSnapshot<TPublic, TPrivate> {
  return useSyncExternalStore(
    client ? client.subscribe : noopSubscribe,
    client ? client.getState : idleSnapshot,
    client ? client.getState : idleSnapshot,
  );
}
