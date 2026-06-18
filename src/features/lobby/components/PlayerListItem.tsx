import type { ReactNode } from 'react';
import { Avatar } from '@/components/ui';
import type { Player } from '@/types';
import { ReadyIndicator } from './ReadyIndicator';

export interface PlayerListItemProps {
  player: Player;
  host?: boolean;
  you?: boolean;
  ready?: boolean;
  /** Row position — drives the divider + stagger. */
  index?: number;
  /** Trailing action slot, e.g. a host actions menu. */
  actions?: ReactNode;
}

/**
 * PlayerListItem — one row of a player roster: avatar, name, role line + ready
 * pill. Used by PlayerList; reusable for any per-player row.
 */
export function PlayerListItem({ player, host, you, ready, index = 0, actions }: PlayerListItemProps) {
  return (
    <div
      className="row between rise"
      style={{ padding: '11px 14px', borderTop: index ? '1px solid var(--border)' : 'none', animationDelay: `${index * 0.03}s` }}
    >
      <div className="row gap12">
        <Avatar who={player} size={44} dot crown={host} bot={player.bot} />
        <div className="col" style={{ gap: 1 }}>
          <span className="th h3" style={{ fontSize: 15 }}>
            {player.name}{' '}
            {you && <span style={{ color: 'var(--primary)', fontSize: 11, fontWeight: 800 }}>· คุณ</span>}
          </span>
          <span className="tiny">{host ? 'หัวห้อง · Host' : player.bot ? 'บอท · พร้อมเสมอ' : 'ผู้เล่น'}</span>
        </div>
      </div>
      <div className="row gap8" style={{ alignItems: 'center' }}>
        {ready !== undefined && <ReadyIndicator ready={ready} />}
        {actions}
      </div>
    </div>
  );
}
