import { Icon } from '@/components/ui';

export interface RoomCodeDisplayProps {
  code: string;
  onCopy?: () => void;
  onShare?: () => void;
}

/**
 * RoomCodeDisplay — the shareable room code with copy + share actions.
 * Core to the "join with a code" UX; reused anywhere a room is shown.
 */
export function RoomCodeDisplay({ code, onCopy, onShare }: RoomCodeDisplayProps) {
  return (
    <div className="card row between" style={{ padding: '14px 16px' }}>
      <div className="col" style={{ gap: 3 }}>
        <span className="eyebrow">รหัสห้อง · room code</span>
        <span className="mono" style={{ fontSize: 30, fontWeight: 700, letterSpacing: '0.16em', lineHeight: 1 }}>{code}</span>
      </div>
      <div className="row gap8">
        <button aria-label="copy code" className="row center" style={{ width: 44, height: 44, borderRadius: 13, background: 'var(--surface-3)' }} onClick={onCopy}>
          <Icon name="copy" size={19} />
        </button>
        <button aria-label="share room" className="row center" style={{ width: 44, height: 44, borderRadius: 13, background: 'var(--grad)', color: '#fff', boxShadow: '0 8px 18px -8px rgba(109,94,249,0.8)' }} onClick={onShare}>
          <Icon name="share" size={18} />
        </button>
      </div>
    </div>
  );
}
