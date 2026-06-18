// ProfilePage.jsx — user profile tab
import { Icon, Avatar, GameCard } from '../components/ui';
import { GAMES, MASCOTS } from '../data';

export function ProfilePage({ go, showToast, guest, player, openEditProfile }) {
  const stats = [['142', 'เกมที่เล่น'], ['68%', 'อัตราชนะ'], ['#3', 'อันดับเพื่อน']];
  const favs = [GAMES[0], GAMES[1], GAMES[2]];
  const ach = [['🏆', 'ราชาแห่งวง', true], ['🕵️', 'เมอร์ลินไร้เงา', true], ['🔥', 'ชนะ 5 ติด', true], ['🎭', 'นักบลัฟ', false], ['👑', 'หัวห้องตัวยง', false]];

  const mascotEmoji = guest ? MASCOTS[guest.mascot]?.em : '🦊';
  const displayName = player?.name ?? 'ผู้เล่น';
  const handleId = player?.id?.replace('guest_', '') ?? 'guest';

  return (
    <div className="scroll screen-anim" style={{ paddingBottom: 112 }}>
      {/* header banner */}
      <div style={{ position: 'relative', height: 150 }}>
        <div style={{ position: 'absolute', inset: 0, background: 'var(--grad)', opacity: 0.9 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(rgba(255,255,255,0.16) 1px, transparent 1.4px)', backgroundSize: '14px 14px', opacity: 0.5 }} />
        <button className="row center" style={{ position: 'absolute', top: 56, right: 18, width: 40, height: 40, borderRadius: 12, background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(8px)', color: '#fff' }} onClick={() => openEditProfile?.()}><Icon name="settings" size={19} /></button>
      </div>
      <div className="pad-x" style={{ marginTop: -44 }}>
        <div className="row between" style={{ alignItems: 'flex-end' }}>
          <div style={{ borderRadius: '50%', boxShadow: '0 0 0 4px var(--bg)' }}>
            <Avatar who={player} size={92} onClick={() => openEditProfile?.()} />
          </div>
          <button className="btn btn-glass" style={{ height: 42, borderRadius: 13, marginBottom: 6 }} onClick={() => openEditProfile?.()}>แก้ไข</button>
        </div>
        <div className="col" style={{ gap: 2, marginTop: 10 }}>
          <h1 className="th h1" style={{ fontSize: 26 }}>{displayName} <span style={{ color: 'var(--muted)', fontWeight: 600, fontSize: 17 }}>@{handleId}</span></h1>
          <button className="th body row gap6" style={{ alignItems: 'center', background: 'none', textAlign: 'left', padding: 0 }} onClick={() => openEditProfile?.()}>
            <span style={{ fontSize: 16 }}>{mascotEmoji}</span>
            <span style={{ color: 'var(--accent)', fontWeight: 700 }}>บัญชีผู้เยี่ยมชม — แตะเพื่อผูกบัญชี</span>
          </button>
        </div>
        {/* stats */}
        <div className="card-solid row" style={{ marginTop: 16, padding: '14px 0' }}>
          {stats.map(([v, l], i) => (
            <div key={l} className="col center" style={{ flex: 1, gap: 2, borderLeft: i ? '1px solid var(--border)' : 'none' }}>
              <span className="th" style={{ fontSize: 22, fontWeight: 800 }}>{v}</span>
              <span className="tiny" style={{ fontWeight: 600 }}>{l}</span>
            </div>
          ))}
        </div>
        {/* favorites */}
        <h2 className="th h2" style={{ fontSize: 18, marginTop: 22, marginBottom: 12 }}>เกมโปรด</h2>
        <div className="row gap10" style={{ overflowX: 'auto', scrollbarWidth: 'none', margin: '0 -20px', padding: '0 20px' }}>
          {favs.map(g => <div key={g.id} style={{ width: 150, flexShrink: 0 }}><GameCard game={g} height={150} onClick={() => go('lobby')} /></div>)}
        </div>
        {/* achievements */}
        <h2 className="th h2" style={{ fontSize: 18, marginTop: 22, marginBottom: 12 }}>ความสำเร็จ</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8 }}>
          {ach.map(([em, name, on], i) => (
            <div key={i} className="col center gap6" title={name}>
              <div className="row center" style={{ width: '100%', aspectRatio: '1', borderRadius: 16, background: on ? 'var(--surface-3)' : 'var(--surface-2)', border: '1px solid var(--border)', fontSize: 24, filter: on ? 'none' : 'grayscale(1)', opacity: on ? 1 : 0.4 }}>{em}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
