import { cn } from '@/lib/utils';
import { getFriendStatus } from '@/features/friends/friendStatus';
import type { FriendStatus } from '@/types';

export interface OnlineStatusProps {
  status: FriendStatus;
  /** Show only the coloured dot. */
  dotOnly?: boolean;
  className?: string;
}

/**
 * OnlineStatus — friend/social presence label (in-room / playing / online /
 * away). Reuses the canonical friendStatus mapping so colours never drift.
 */
export function OnlineStatus({ status, dotOnly, className }: OnlineStatusProps) {
  const { label, color } = getFriendStatus(status);
  return (
    <span className={cn('row gap6', className)} style={{ alignItems: 'center', fontSize: 9.5, fontWeight: 700, color }}>
      {dotOnly && <span style={{ width: 7, height: 7, borderRadius: 4, background: color, flexShrink: 0 }} />}
      {!dotOnly && label}
    </span>
  );
}
