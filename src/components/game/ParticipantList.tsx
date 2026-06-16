import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui';
import type { Player } from '@/types';
import { HostBadge } from './HostBadge';

export interface ParticipantListProps {
  players: Player[];
  /** id of the host (shows a HostBadge). */
  hostId?: string;
  /** id of the current user (shows a "คุณ" marker). */
  meId?: string;
  /** Trailing slot per row — e.g. a ready indicator or kick button. */
  renderTrailing?: (player: Player, index: number) => ReactNode;
  /** Sub-label per row (defaults to host/player). */
  subtitle?: (player: Player, index: number) => ReactNode;
  className?: string;
}

/**
 * ParticipantList — generic vertical roster of players with host marker and a
 * per-row trailing slot. Foundation for lobby rosters, spectator lists, and
 * in-game participant panels across all games.
 */
export function ParticipantList({ players, hostId, meId, renderTrailing, subtitle, className }: ParticipantListProps) {
  return (
    <div className={cn('card-solid', className)} style={{ overflow: 'hidden' }} role="list">
      {players.map((p, i) => {
        const isHost = p.id === hostId;
        return (
          <div
            key={p.id}
            role="listitem"
            className="row between"
            style={{ padding: '11px 14px', borderTop: i ? '1px solid var(--border)' : 'none' }}
          >
            <div className="row gap12">
              <Avatar who={p} size={44} dot={p.online} crown={isHost} />
              <div className="col" style={{ gap: 1 }}>
                <span className="th h3" style={{ fontSize: 15 }}>
                  {p.name}{' '}
                  {p.id === meId && <span style={{ color: 'var(--primary)', fontSize: 11, fontWeight: 800 }}>· คุณ</span>}
                </span>
                <span className="tiny">{subtitle ? subtitle(p, i) : isHost ? 'หัวห้อง · Host' : 'ผู้เล่น'}</span>
              </div>
            </div>
            <div className="row gap8" style={{ alignItems: 'center' }}>
              {isHost && !renderTrailing && <HostBadge />}
              {renderTrailing?.(p, i)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
