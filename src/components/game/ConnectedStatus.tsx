import { cn } from '@/lib/utils';

export type ConnectionState = 'connected' | 'connecting' | 'reconnecting' | 'disconnected';

const STATE: Record<ConnectionState, { label: string; color: string; pulse: boolean }> = {
  connected: { label: 'เชื่อมต่อแล้ว', color: '#34D17E', pulse: false },
  connecting: { label: 'กำลังเชื่อมต่อ', color: 'var(--accent)', pulse: true },
  reconnecting: { label: 'กำลังเชื่อมต่อใหม่', color: 'var(--accent)', pulse: true },
  disconnected: { label: 'หลุดการเชื่อมต่อ', color: 'var(--evil)', pulse: false },
};

export interface ConnectedStatusProps {
  state: ConnectionState;
  /** Hide the label, show only the dot. */
  dotOnly?: boolean;
  className?: string;
}

/**
 * ConnectedStatus — socket/connection indicator. UI only; the actual transport
 * (Socket.io) is wired later — pass `state` from wherever connection lives.
 */
export function ConnectedStatus({ state, dotOnly, className }: ConnectedStatusProps) {
  const s = STATE[state];
  return (
    <span
      className={cn('row gap6 chip th', className)}
      role="status"
      style={{ height: 26, color: s.color, borderColor: 'transparent', background: 'var(--surface-2)', fontWeight: 700 }}
    >
      <span
        className={s.pulse ? 'pop' : undefined}
        style={{ width: 7, height: 7, borderRadius: 4, background: s.color, flexShrink: 0, animation: s.pulse ? 'pulseRing 1.4s ease-in-out infinite' : undefined }}
      />
      {!dotOnly && s.label}
    </span>
  );
}
