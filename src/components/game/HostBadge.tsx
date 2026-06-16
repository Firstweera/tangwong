import { PlayerBadge } from './PlayerBadge';

export interface HostBadgeProps {
  /** Compact crown-only variant. */
  compact?: boolean;
}

/**
 * HostBadge — marks the room host / moderator. Preset over PlayerBadge so the
 * "who's in charge" affordance is identical across lobby and in-game host tools.
 */
export function HostBadge({ compact }: HostBadgeProps) {
  return (
    <PlayerBadge tone="accent" variant="soft" icon={<span style={{ fontSize: 11 }}>👑</span>}>
      {compact ? '' : 'หัวห้อง'}
    </PlayerBadge>
  );
}
