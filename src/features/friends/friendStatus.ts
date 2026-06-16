// friendStatus.ts — canonical mapping from friend status → display label + color
import type { FriendStatus, FriendStatusInfo } from '../../types/index.ts';

export const FRIEND_STATUS_MAP: Record<FriendStatus, FriendStatusInfo> = {
  'in-room': { label: 'อยู่ในห้อง', color: 'var(--primary)' },
  playing:   { label: 'กำลังเล่น',  color: 'var(--accent)'  },
  online:    { label: 'ออนไลน์',     color: '#34D17E'        },
  away:      { label: 'ไม่อยู่',     color: 'var(--muted)'   },
};

export function getFriendStatus(status: FriendStatus | string): FriendStatusInfo {
  return FRIEND_STATUS_MAP[status as FriendStatus] ?? FRIEND_STATUS_MAP.online;
}
