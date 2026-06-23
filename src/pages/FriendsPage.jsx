// FriendsPage.jsx — friends list tab
import { Icon, Avatar } from '../components/ui';
import { FRIENDS } from '../data';
import { getFriendStatus } from '../features/friends/friendStatus';

export function FriendsPage({ go, showToast }) {
  return (
    <div className="scroll screen-anim" style={{ paddingBottom: 112 }}>
      <div className="page-head">
        <div className="page-title-row">
          <div>
            <h1 className="th page-title">เพื่อน</h1>
            <p className="th page-subtitle">ดูว่าใครว่าง ใครอยู่ในห้อง และชวนเข้าวงได้ทันที</p>
          </div>
          <button className="icon-action primary" onClick={() => showToast('เพิ่มเพื่อน', '➕')}><Icon name="plus" size={22} /></button>
        </div>
      </div>
      <div className="pad-x" style={{ marginBottom: 14 }}>
        <div className="field-shell">
          <Icon name="search" size={18} style={{ color: 'var(--muted)' }} />
          <input placeholder="ค้นหาเพื่อน หรือใส่ชื่อผู้ใช้" className="th" style={{ fontSize: 14 }} />
        </div>
      </div>
      <div className="pad-x"><div className="section-head"><span className="section-title th">ออนไลน์ตอนนี้</span><span className="section-note">{FRIENDS.filter(f => f.online).length} คน</span></div></div>
      <div className="pad-x col gap8" style={{ marginTop: 10 }}>
        {FRIENDS.map(f => {
          const { label, color } = getFriendStatus(f.status);
          return (
            <div key={f.id} className="status-card row between">
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
