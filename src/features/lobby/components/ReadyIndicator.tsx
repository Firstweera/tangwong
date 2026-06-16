import { Icon } from '@/components/ui';

export interface ReadyIndicatorProps {
  ready: boolean;
  /** Override labels (default Thai). */
  readyLabel?: string;
  waitingLabel?: string;
}

/**
 * ReadyIndicator — per-player ready / waiting pill. Generic readiness affordance
 * shared by every game's pre-round and lobby states.
 */
export function ReadyIndicator({ ready, readyLabel = 'พร้อม', waitingLabel = 'รอ...' }: ReadyIndicatorProps) {
  return (
    <span
      className="row gap6"
      style={{
        fontSize: 10.5, fontWeight: 800, padding: '3px 8px', borderRadius: 8,
        background: ready ? 'rgba(52,209,126,0.16)' : 'var(--surface-2)',
        color: ready ? '#34D17E' : 'var(--muted)', alignItems: 'center',
      }}
    >
      {ready ? <><Icon name="check" size={11} stroke={3.2} /> {readyLabel}</> : waitingLabel}
    </span>
  );
}
