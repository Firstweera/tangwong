import type { ReactNode } from 'react';
import type { Player } from '@/types';
import { PlayerListItem } from './PlayerListItem';

export interface PlayerListProps {
  players: Player[];
  /** Returns whether a player is ready. */
  isReady?: (player: Player) => boolean;
  /** Host id (defaults to the first player). */
  hostId?: string;
  /** Current-user id (defaults to "me"). */
  meId?: string;
  /** Per-player trailing actions, e.g. a host actions menu. */
  renderActions?: (player: Player) => ReactNode;
}

/**
 * PlayerList — stacked roster of players (list layout). Composes PlayerListItem
 * inside a solid card. Game-agnostic.
 */
export function PlayerList({ players, isReady, hostId, meId = 'me', renderActions }: PlayerListProps) {
  const host = hostId ?? players[0]?.id;
  return (
    <div className="card-solid" style={{ overflow: 'hidden' }} role="list">
      {players.map((p, i) => (
        <PlayerListItem
          key={p.id}
          player={p}
          index={i}
          host={p.id === host}
          you={p.id === meId}
          ready={isReady ? isReady(p) : undefined}
          actions={renderActions?.(p)}
        />
      ))}
    </div>
  );
}
