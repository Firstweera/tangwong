import { cn } from '@/lib/utils';
import { Avatar, Icon } from '@/components/ui';
import type { Player } from '@/types';

export interface TurnOrderDisplayProps {
  players: Player[];
  /** id of the player whose turn it is. */
  currentId?: string;
  /** Show a connecting arrow between seats. */
  showArrows?: boolean;
  className?: string;
}

/**
 * TurnOrderDisplay — ordered sequence of players with the active turn
 * highlighted. Game-agnostic: drives Avalon proposal order, Istanbul rounds,
 * Exploding Kittens draw order, etc.
 */
export function TurnOrderDisplay({ players, currentId, showArrows = true, className }: TurnOrderDisplayProps) {
  return (
    <div
      className={cn('row gap8', className)}
      role="list"
      style={{ overflowX: 'auto', padding: '4px 2px', scrollbarWidth: 'none' }}
    >
      {players.map((p, i) => {
        const active = p.id === currentId;
        return (
          <div className="row gap8" role="listitem" key={p.id} style={{ alignItems: 'center', flexShrink: 0 }}>
            {showArrows && i > 0 && <Icon name="chevR" size={14} stroke={2.6} style={{ color: 'var(--faint)' }} />}
            <div className="col center gap4" style={{ width: 52 }}>
              <Avatar who={p} size={active ? 46 : 40} ring={active ? 'var(--accent)' : false} faded={!active && !!currentId} />
              <span className="th" style={{ fontSize: 10.5, fontWeight: 700, color: active ? 'var(--text)' : 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 52 }}>
                {active ? '▶ ' : `${i + 1}. `}{p.name}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
