import type { Player } from '@/types';
import { PlayerSeat } from '@/components/game';
import { ReadyIndicator } from './ReadyIndicator';

export interface PlayerGridProps {
  players: Player[];
  isReady?: (player: Player) => boolean;
  hostId?: string;
  meId?: string;
}

/**
 * PlayerGrid — 2-column grid of player seats (grid layout). Composes the generic
 * PlayerSeat with a ready footer.
 */
export function PlayerGrid({ players, isReady, hostId, meId = 'me' }: PlayerGridProps) {
  const host = hostId ?? players[0]?.id;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {players.map((p, i) => (
        <PlayerSeat
          key={p.id}
          player={p}
          host={p.id === host}
          you={p.id === meId}
          delay={i * 0.04}
          footer={isReady ? <ReadyIndicator ready={isReady(p)} /> : undefined}
        />
      ))}
    </div>
  );
}
