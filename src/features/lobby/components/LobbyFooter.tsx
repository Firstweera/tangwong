import { Icon } from '@/components/ui';
import { BottomBar } from '@/components/layout';
import { StartGameButton } from './StartGameButton';

export interface LobbyFooterProps {
  meReady: boolean;
  onToggleReady?: () => void;
  onStart?: () => void;
  allReady?: boolean;
  /** Host can start; non-hosts only toggle ready. */
  isHost?: boolean;
  /** Minimum players this game needs to start. */
  minPlayers?: number;
  /** Current player count in the room. */
  playerCount?: number;
  /** Players currently marked ready (for the "รอพร้อม" label). */
  readyCount?: number;
}

/**
 * LobbyFooter — sticky action bar: ready toggle + start CTA + status hint.
 * Start needs the game's minimum player count AND everyone ready.
 */
export function LobbyFooter({ meReady, onToggleReady, onStart, allReady = false, isHost = true, minPlayers = 0, playerCount = 0, readyCount = 0 }: LobbyFooterProps) {
  const enoughPlayers = playerCount >= minPlayers;
  const canStart = isHost && enoughPlayers && allReady;

  const startLabel = !enoughPlayers
    ? `ต้องการอีก ${minPlayers - playerCount} คน`
    : !allReady
      ? `รอพร้อม (${readyCount}/${playerCount})`
      : 'เริ่มเกม';

  const hint = !isHost
    ? 'รอหัวห้องเริ่มเกม'
    : !enoughPlayers
      ? `เกมนี้ต้องการอย่างน้อย ${minPlayers} คน — เพิ่มบอทเพื่อเติมที่นั่ง`
      : !allReady
        ? 'รอให้ทุกคนกดพร้อม'
        : 'ทุกคนพร้อมแล้ว — เริ่มได้เลย!';

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
        <StartGameButton onClick={onStart} disabled={!canStart} label={startLabel} style={{ flex: 1 }} />
      </div>
      <div className="tiny center row" style={{ marginTop: 8, color: 'var(--muted)', fontWeight: 700 }}>
        {hint}
      </div>
    </BottomBar>
  );
}
