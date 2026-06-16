// FriendsPage.jsx — friends list tab
import { Icon, Avatar } from '../components/ui';
import { FRIENDS } from '../data';
import { getFriendStatus } from '../features/friends/friendStatus';

export function FriendsPage({ go, showToast }) {
  return (
    <div className="scroll screen-anim" style={{ paddingBottom: 112 }}>
      <div className="row between pad-x pad-top" style={{ paddingBottom: 10 }}>
        <h1 className="th h1" style={{ fontSize: 28 }}>เพื่อน</h1>
        <button className="row center" style={{ width: 42, height: 42, borderRadius: 13, background: 'var(--grad)', color: '#fff' }} onClick={() => showToast('เพิ่มเพื่อน', '➕')}><Icon name="plus" size={22} /></button>
      </div>
      <div className="pad-x" style={{ marginBottom: 14 }}>
        <div className="card row gap8" style={{ padding: '0 14px', height: 48, alignItems: 'center' }}>
          <Icon name="search" size={18} style={{ color: 'var(--muted)' }} />
          <input placeholder="ค้นหาเพื่อน หรือใส่ชื่อผู้ใช้" className="th" style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 14 }} />
        </div>
      </div>
      <div className="pad-x"><span className="eyebrow">ออนไลน์ตอนนี้ · {FRIENDS.filter(f => f.online).length}</span></div>
      <div className="pad-x col gap8" style={{ marginTop: 10 }}>
        {FRIENDS.map(f => {
          const { label, color } = getFriendStatus(f.status);
          return (
            <div key={f.id} className="card-solid row between" style={{ padding: '10px 14px' }}>
              <div className="row gap12">
                <Avatar who={f} size={46} dot={f.online} />
                <div className="col" style={{ gap: 1 }}>
                  <span className="th h3" style={{ fontSize: 15 }}>{f.name} <span className="tiny">· {f.en}</span></span>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color }}>● {label}</span>
                </div>
              </div>
              <button className="chip th" style={{ background: f.status === 'in-room' ? 'var(--grad)' : 'var(--surface-2)', color: f.status === 'in-room' ? '#fff' : 'var(--text)', border: f.status === 'in-room' ? 'none' : '1px solid var(--border)' }}
                      onClick={() => f.status === 'in-room' ? go('lobby') : showToast('ชวนเข้าห้องแล้ว', '✉️')}>
                {f.status === 'in-room' ? 'เข้าร่วม' : 'ชวนเล่น'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
