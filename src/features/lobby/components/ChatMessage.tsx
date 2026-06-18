import { Avatar } from '@/components/ui';
import { formatChatTime } from '@/features/chat';
import type { ChatMessage as ChatMessageModel, Player } from '@/types';

export interface ChatMessageProps {
  message: ChatMessageModel;
  /** The sender (omit for the current user). */
  player?: Player;
  /** Render as an outgoing (right-aligned) bubble. */
  me?: boolean;
  /** The current player's id — highlights reactions they made. */
  meId?: string;
  /** Tap the bubble to open the reaction picker for this message. */
  onSelect?: () => void;
  /** Tap an existing reaction chip to toggle the current player's vote. */
  onToggleReaction?: (emoji: string) => void;
}

/**
 * ChatMessage — a single user chat bubble (incoming with avatar + name, or
 * outgoing) with timestamp and emoji reaction chips. Reuses the prototype
 * bubble styles. Social foundation for room + in-game chat.
 */
export function ChatMessage({ message, player, me, meId, onSelect, onToggleReaction }: ChatMessageProps) {
  const time = <span className="tiny" style={{ color: 'var(--muted)' }}>{formatChatTime(message.ts)}</span>;

  const reactions = message.reactions.length > 0 && (
    <div className="row gap6" style={{ flexWrap: 'wrap', justifyContent: me ? 'flex-end' : 'flex-start' }}>
      {message.reactions.map((r) => {
        const mine = meId != null && r.by.includes(meId);
        return (
          <button
            key={r.emoji}
            onClick={() => onToggleReaction?.(r.emoji)}
            className="row center gap6"
            style={{
              height: 26, padding: '0 9px', borderRadius: 13, fontSize: 13,
              background: mine ? 'var(--grad-soft)' : 'var(--surface-2)',
              border: `1px solid ${mine ? 'var(--primary)' : 'var(--border)'}`,
              color: 'var(--text)',
            }}
          >
            <span>{r.emoji}</span>
            <span className="tiny" style={{ fontWeight: 700 }}>{r.by.length}</span>
          </button>
        );
      })}
    </div>
  );

  if (me) {
    return (
      <div className="col gap6" style={{ alignItems: 'flex-end' }}>
        <button className="bubble bubble-me" style={{ textAlign: 'left' }} onClick={onSelect}>{message.text}</button>
        {reactions}
        {time}
      </div>
    );
  }

  return (
    <div className="row gap8" style={{ alignItems: 'flex-end' }}>
      {player && <Avatar who={player} size={28} />}
      <div className="col gap6" style={{ alignItems: 'flex-start' }}>
        {player && <span className="tiny" style={{ fontWeight: 700, marginLeft: 4 }}>{player.name}</span>}
        <button className="bubble bubble-them" style={{ textAlign: 'left' }} onClick={onSelect}>{message.text}</button>
        {reactions}
        {time}
      </div>
    </div>
  );
}
