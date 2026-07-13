// GameShell — reusable in-game chrome shared by all games.
//
// Owns: top bar (exit / timer / mode chips / chat), chat open/close state,
// the useChat hook, Confetti on good-team win, and the pre-game loading screen.
//
// Games compose this with their own slots:
//   track     — quest track / score track above the table
//   table     — player ring or board
//   roleStrip — role reveal card / knowledge strip
//   actionBar — bottom CTAs for the current phase
//
// When hasState=false the shell renders a generic loading/waiting screen; pass
// loadingContent to inject a game-specific action (e.g. "Start game" for host).
import type { ReactNode } from 'react';
import { Icon, Confetti } from '@/components/ui';
import { IconButton } from '@/components/layout';
import { ChatPanel } from '@/features/lobby';
import { useChat } from '@/features/chat';
import { useState } from 'react';
import type { WinResult } from '../engine/types';
import type { Player } from '@/types';

export interface GameShellProps {
  // Identity (for chat)
  roomId: string;
  meId: string;
  players: Player[];

  // State flags
  hasState: boolean;
  loading?: boolean;
  onlineMode?: boolean;
  winner?: WinResult | null;
  /** An online action is in flight — passed through so slots can disable controls. */
  busy?: boolean;

  // Timer — the game component manages the countdown and passes timeLeft here;
  // omit (or pass undefined) for phases without a timer.
  timeLeft?: number;

  // Callbacks
  onExit: () => void;

  // Extra chips rendered between the timer and the chat button in the top bar.
  // Use for game-specific controls (e.g. 🤖 auto toggle).
  extraChips?: ReactNode;

  /** When set, the chat input is disabled and this reason string is shown. */
  chatInputDisabled?: string;

  // Layout slots — rendered when hasState=true
  track?: ReactNode;
  table?: ReactNode;
  roleStrip?: ReactNode;
  actionBar?: ReactNode;

  // Injected into the loading screen (e.g. host "Start game" button).
  loadingContent?: ReactNode;
}

export function GameShell({
  roomId,
  meId,
  players,
  hasState,
  loading = false,
  onlineMode = false,
  winner,
  timeLeft,
  onExit,
  extraChips,
  chatInputDisabled,
  track,
  table,
  roleStrip,
  actionBar,
  loadingContent,
}: GameShellProps) {
  const [chatOpen, setChatOpen] = useState(false);
  const chat = useChat(roomId, meId);
  const goodWin = winner?.winnerTeam === 'good';

  if (!hasState) {
    return (
      <div className="screen col center" style={{ gap: 12 }}>
        <span style={{ fontSize: 40 }}>{loading ? '⌛' : '🎴'}</span>
        <span className="th h2">{loading ? 'กำลังโหลดเกม...' : 'รอเริ่มเกม'}</span>
        {loadingContent}
        <button className="btn btn-glass btn-lg" onClick={onExit}>กลับห้อง</button>
      </div>
    );
  }

  return (
    <div className="screen screen-anim game-shell">
      {winner && goodWin && <Confetti />}

      {/* top bar */}
      <div className="row between pad-x pad-top game-shell-topbar">
        <IconButton onClick={onExit} aria-label="ออกจากเกม" style={{ width: 40, height: 40, borderRadius: 12 }}>
          <Icon name="exit" size={18} />
        </IconButton>
        <div className="row gap8">
          {timeLeft !== undefined && (
            <div className="chip" style={{ background: 'var(--surface)', borderColor: 'var(--border-2)' }}>
              <Icon name="clock" size={14} style={{ color: timeLeft <= 10 ? 'var(--evil)' : 'var(--accent)' }} />
              <span className="mono" style={{ fontWeight: 700, color: timeLeft <= 10 ? 'var(--evil)' : 'var(--text)' }}>
                0:{String(timeLeft).padStart(2, '0')}
              </span>
            </div>
          )}
          {extraChips}
        </div>
        <IconButton onClick={() => setChatOpen(true)} aria-label="เปิดแชต" style={{ width: 40, height: 40, borderRadius: 12 }}>
          <Icon name="chat" size={18} />
        </IconButton>
      </div>

      {track}

      <div className="game-shell-content">
        <div className="game-shell-table">{table}</div>
        {roleStrip}
      </div>

      <div className="pad-x game-shell-action">
        {actionBar}
      </div>

      {chatOpen && (
        <ChatPanel
          messages={chat.messages}
          players={players}
          meId={meId}
          onSend={chat.sendMessage}
          onReact={chat.toggleReaction}
          onClose={() => setChatOpen(false)}
          inputDisabled={chatInputDisabled}
        />
      )}
    </div>
  );
}
