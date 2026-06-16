import { useState } from 'react';
import { Icon } from '@/components/ui';
import type { ChatMessage as ChatMessageType, Player } from '@/types';
import { ChatMessage } from './ChatMessage';

export interface ChatPanelProps {
  messages: ChatMessageType[];
  players: Player[];
  meId?: string;
  /** Called with the typed text on send. */
  onSend?: (text: string) => void;
  onClose?: () => void;
  placeholder?: string;
}

/**
 * ChatPanel — slide-up room/game chat: message stream + composer. Presentation
 * only; no transport (Socket.io wired later). Reusable across lobby and games.
 */
export function ChatPanel({ messages, players, meId = 'me', onSend, onClose, placeholder = 'พิมพ์ข้อความ...' }: ChatPanelProps) {
  const [text, setText] = useState('');
  const send = () => {
    if (!text.trim()) return;
    onSend?.(text);
    setText('');
  };

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 70, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={onClose} />
      <div className="card-solid rise" role="dialog" aria-label="chat" style={{ position: 'relative', borderRadius: '26px 26px 0 0', maxHeight: '64%', display: 'flex', flexDirection: 'column', paddingBottom: 30 }}>
        <div className="row between" style={{ padding: '14px 18px 8px' }}>
          <div style={{ width: 40 }} />
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border-2)' }} />
          <button aria-label="close chat" className="row center" style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--surface-2)' }} onClick={onClose}>
            <Icon name="x" size={16} />
          </button>
        </div>
        <div className="col gap10" style={{ flex: 1, overflowY: 'auto', padding: '8px 16px' }}>
          {messages.map((m, i) => (
            <ChatMessage key={i} text={m.text} me={m.who === meId} player={players.find((p) => p.id === m.who)} />
          ))}
        </div>
        <div className="row gap8 pad-x" style={{ paddingTop: 8 }}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder={placeholder}
            className="th"
            style={{ flex: 1, height: 46, borderRadius: 14, padding: '0 16px', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', outline: 'none', fontSize: 14 }}
          />
          <button aria-label="send" className="row center" style={{ width: 46, height: 46, borderRadius: 14, background: 'var(--grad)', color: '#fff' }} onClick={send}>
            <Icon name="send" size={19} />
          </button>
        </div>
      </div>
    </div>
  );
}
