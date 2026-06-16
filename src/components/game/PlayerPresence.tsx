import { cn } from '@/lib/utils';

export type PresenceState = 'online' | 'in-room' | 'playing' | 'away' | 'offline';

const PRESENCE: Record<PresenceState, { label: string; color: string }> = {
  online: { label: 'ออนไลน์', color: '#34D17E' },
  'in-room': { label: 'อยู่ในห้อง', color: 'var(--primary)' },
  playing: { label: 'กำลังเล่น', color: 'var(--accent)' },
  away: { label: 'ไม่อยู่', color: 'var(--muted)' },
  offline: { label: 'ออฟไลน์', color: 'var(--faint)' },
};

export interface PlayerPresenceProps {
  state?: PresenceState;
  /** Override the default Thai label. */
  label?: string;
  /** Hide the text, show only the dot. */
  dotOnly?: boolean;
  className?: string;
}

/**
 * PlayerPresence — coloured presence dot + label (online / in-room / playing…).
 * Game-agnostic social presence indicator.
 */
export function PlayerPresence({ state = 'online', label, dotOnly, className }: PlayerPresenceProps) {
  const p = PRESENCE[state];
  return (
    <span className={cn('row gap6 th', className)} style={{ alignItems: 'center', fontSize: 11.5, fontWeight: 700, color: p.color }}>
      <span style={{ width: 7, height: 7, borderRadius: 4, background: p.color, flexShrink: 0, boxShadow: state === 'online' ? `0 0 8px ${p.color}` : undefined }} />
      {!dotOnly && (label ?? p.label)}
    </span>
  );
}
