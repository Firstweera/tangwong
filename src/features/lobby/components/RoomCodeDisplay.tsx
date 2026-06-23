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
    <div className="command-card row between" style={{ padding: '15px 16px' }}>
      <div className="col" style={{ gap: 3 }}>
        <span className="section-note">รหัสห้อง · room code</span>
        <span className="mono" style={{ fontSize: 30, fontWeight: 700, letterSpacing: '0.16em', lineHeight: 1 }}>{code}</span>
      </div>
      <div className="row gap8">
        <button aria-label="copy code" className="icon-action" onClick={onCopy}>
          <Icon name="copy" size={19} />
        </button>
        <button aria-label="share room" className="icon-action primary" onClick={onShare}>
          <Icon name="share" size={18} />
        </button>
      </div>
    </div>
  );
}
