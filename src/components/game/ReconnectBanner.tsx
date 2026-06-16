import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui';
import type { ConnectionState } from './ConnectedStatus';

export interface ReconnectBannerProps {
  /** Only renders for non-connected states. */
  state: ConnectionState;
  /** Optional player name (e.g. "Mint is reconnecting…"). */
  playerName?: string;
  onRetry?: () => void;
  className?: string;
}

const MESSAGE: Partial<Record<ConnectionState, string>> = {
  connecting: 'กำลังเชื่อมต่อ…',
  reconnecting: 'กำลังเชื่อมต่อใหม่…',
  disconnected: 'การเชื่อมต่อหลุด',
};

/**
 * ReconnectBanner — slim banner shown while the session is reconnecting or
 * dropped. Reconnection-friendly UX foundation; transport wired later.
 */
export function ReconnectBanner({ state, playerName, onRetry, className }: ReconnectBannerProps) {
  if (state === 'connected') return null;
  const base = MESSAGE[state] ?? '';
  const text = playerName ? `${playerName} ${base}` : base;
  const danger = state === 'disconnected';

  return (
    <div
      role="alert"
      className={cn('row between th', className)}
      style={{
        gap: 10, padding: '9px 14px', borderRadius: 14,
        background: danger ? 'rgba(255,92,108,0.14)' : 'rgba(255,159,67,0.14)',
        border: `1px solid ${danger ? 'rgba(255,92,108,0.4)' : 'rgba(255,159,67,0.4)'}`,
        color: danger ? 'var(--evil)' : 'var(--accent)',
      }}
    >
      <span className="row gap8" style={{ alignItems: 'center', fontSize: 13, fontWeight: 700 }}>
        <Icon name={danger ? 'x' : 'clock'} size={16} style={danger ? undefined : { animation: 'spin 1.4s linear infinite' }} />
        {text}
      </span>
      {danger && onRetry && (
        <button className="th" onClick={onRetry} style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--evil)' }}>
          ลองใหม่
        </button>
      )}
    </div>
  );
}
