// Hidden-information view: redact a GameState down to what one player may see.
// Keeps all public state but drops every other player's private slice. The
// host-authoritative transport (Epic 4 / Socket.io) sends `redactStateFor(state,
// id)` to each client so roles and secret cards never travel to the wrong seat.
import type { GameState } from './types';

export function redactStateFor<TPublic, TPrivate>(
  state: GameState<TPublic, TPrivate>,
  viewerId: string,
): GameState<TPublic, TPrivate> {
  const mine = state.private[viewerId];
  return { ...state, private: mine ? { [viewerId]: mine } : {} };
}
