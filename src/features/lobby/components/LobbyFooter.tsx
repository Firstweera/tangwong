import { Icon } from '@/components/ui';
import { BottomBar } from '@/components/layout';
import { StartGameButton } from './StartGameButton';

export interface LobbyFooterProps {
  meReady: boolean;
  onToggleReady?: () => void;
  onStart?: () => void;
  allReady?: boolean;
  /** Host can start any time; non-hosts only toggle ready. */
  isHost?: boolean;
}

/**
 * LobbyFooter — sticky action bar: ready toggle + start CTA + status hint.
 * Encapsulates the lobby's bottom controls for reuse across room types.
 */
export function LobbyFooter({ meReady, onToggleReady, onStart, allReady, isHost = true }: LobbyFooterProps) {
  return (
    <BottomBar>
      <div className="row gap10">
        <button
          className={'btn ' + (meReady ? 'btn-glass' : 'btn-accent')}
          style={{ flex: '0 0 auto', width: 120 }}
          onClick={onToggleReady}
        >
          {meReady ? <><Icon name="check" size={18} stroke={3} /> พร้อม</> : 'กดพร้อม'}
        </button>
        <StartGameButton onClick={onStart} style={{ flex: 1 }} />
      </div>
      <div className="tiny center row" style={{ marginTop: 8, opacity: 0.7 }}>
        {allReady ? 'ทุกคนพร้อมแล้ว — เริ่มได้เลย!' : isHost ? 'คุณคือหัวห้อง · เริ่มเกมได้ทุกเมื่อ' : 'รอหัวห้องเริ่มเกม'}
      </div>
    </BottomBar>
  );
}
