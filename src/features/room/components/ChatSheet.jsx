// ChatSheet.jsx — slide-up in-game chat panel
import { useState } from 'react';
import { Icon, Avatar } from '../../../components/ui';
import { PLAYERS } from '../../../data';

export function ChatSheet({ onClose }) {
  const [msgs, setMsgs] = useState([
    { who: 'p4', text: 'ทีมนี้ไว้ใจได้ปะ 🤔', t: 'now' },
    { who: 'p3', text: 'ได้ๆ โหวตผ่านเลย', t: 'now' },
    { who: 'p6', text: 'เอ๊ะ ทำไมรีบจัง...', t: 'now' },
  ]);
  const [text, setText] = useState('');

  const send = () => {
    if (!text.trim()) return;
    setMsgs(m => [...m, { who: 'me', text, t: 'now' }]);
    setText('');
  };

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 70, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={onClose} />
      <div className="card-solid rise" style={{ position: 'relative', borderRadius: '26px 26px 0 0', maxHeight: '64%', display: 'flex', flexDirection: 'column', paddingBottom: 30 }}>
        <div className="row between" style={{ padding: '14px 18px 8px' }}>
          <div style={{ width: 40 }} />
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border-2)' }} />
          <button aria-label="ปิดแชต" className="row center" style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--surface-2)' }} onClick={onClose}>
            <Icon name="x" size={16} />
          </button>
        </div>
        <div className="col gap10" style={{ flex: 1, overflowY: 'auto', padding: '8px 16px' }}>
          {msgs.map((m, i) => {
            const p = PLAYERS.find(x => x.id === m.who);
            if (m.who === 'me') return <div key={i} className="bubble bubble-me">{m.text}</div>;
            return (
              <div key={i} className="row gap8" style={{ alignItems: 'flex-end' }}>
                <Avatar who={p} size={28} />
                <div className="col gap6">
                  <span className="tiny" style={{ fontWeight: 700, marginLeft: 4 }}>{p.name}</span>
                  <div className="bubble bubble-them">{m.text}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="row gap8 pad-x" style={{ paddingTop: 8 }}>
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="พิมพ์ข้อความ..."
            className="th"
            style={{ flex: 1, height: 46, borderRadius: 14, padding: '0 16px', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', outline: 'none', fontSize: 14 }}
          />
          <button className="row center" style={{ width: 46, height: 46, borderRadius: 14, background: 'var(--grad)', color: '#fff' }} onClick={send}>
            <Icon name="send" size={19} />
          </button>
        </div>
      </div>
    </div>
  );
}
