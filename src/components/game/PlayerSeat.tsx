import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui';
import type { Player } from '@/types';

export interface PlayerSeatProps {
  player: Player;
  size?: number;
  /** Show the host crown. */
  host?: boolean;
  /** Mark this as the current user (YOU label). */
  you?: boolean;
  /** Presence dot on the avatar. */
  online?: boolean;
  /** Avatar highlight ring colour (e.g. ready state). */
  ring?: string | false;
  /** `card` = boxed seat (grid); `plain` = bare avatar + name (table/circle). */
  variant?: 'card' | 'plain';
  /** Footer slot under the name (e.g. a <ReadyIndicator/>). */
  footer?: ReactNode;
  /** Stagger entrance animation. */
  delay?: number;
  onClick?: () => void;
  className?: string;
}

/**
 * PlayerSeat — a single player's seat: avatar + name with optional host crown,
 * presence dot, ready ring and a footer slot. Game-agnostic; used by lobby
 * grids, ready screens, and future game tables.
 */
export function PlayerSeat({
  player, size = 56, host, you, online = true, ring = false,
  variant = 'card', footer, delay = 0, onClick, className,
}: PlayerSeatProps) {
  if (variant === 'plain') {
    return (
      <div className={cn('col center gap4', className)} onClick={onClick}>
        <Avatar who={player} size={size} dot={online} crown={host} ring={ring} />
        <span className="ring-name th">{player.name}</span>
        {footer}
      </div>
    );
  }
  return (
    <div
      className={cn('card-solid col center gap8 rise', className)}
      style={{ padding: '16px 10px 12px', position: 'relative', animationDelay: `${delay}s` }}
      onClick={onClick}
    >
      {you && (
        <span style={{ position: 'absolute', top: 8, left: 10, fontSize: 9.5, fontWeight: 800, color: 'var(--primary)' }}>YOU</span>
      )}
      <Avatar who={player} size={size} dot={online} crown={host} ring={ring} />
      <span className="th h3" style={{ fontSize: 14 }}>{player.name}</span>
      {footer}
    </div>
  );
}
