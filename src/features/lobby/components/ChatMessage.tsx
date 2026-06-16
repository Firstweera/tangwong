import { Avatar } from '@/components/ui';
import type { Player } from '@/types';

export interface ChatMessageProps {
  text: string;
  /** The sender (omit for the current user). */
  player?: Player;
  /** Render as an outgoing (right-aligned) bubble. */
  me?: boolean;
}

/**
 * ChatMessage — a single chat bubble (incoming with avatar + name, or outgoing).
 * Reuses the prototype bubble styles. Social foundation for room + in-game chat.
 */
export function ChatMessage({ text, player, me }: ChatMessageProps) {
  if (me) return <div className="bubble bubble-me">{text}</div>;
  return (
    <div className="row gap8" style={{ alignItems: 'flex-end' }}>
      {player && <Avatar who={player} size={28} />}
      <div className="col gap6">
        {player && <span className="tiny" style={{ fontWeight: 700, marginLeft: 4 }}>{player.name}</span>}
        <div className="bubble bubble-them">{text}</div>
      </div>
    </div>
  );
}
