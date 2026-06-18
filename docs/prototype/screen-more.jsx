// screen-more.jsx — Games catalog, Friends, Profile (tab destinations)

function GamesScreen({ go, showToast }) {
  const cats = [['ทั้งหมด', true], ['จับโกหก', false], ['บลัฟ', false], ['เล่าเรื่อง', false]];
  const [rules, setRules] = useState(null);
  return (
    <div className="scroll screen-anim" style={{ paddingBottom: 112 }}>
      <div className="pad-x pad-top" style={{ paddingBottom: 6 }}>
        <h1 className="th h1" style={{ fontSize: 28 }}>เลือกเกม</h1>
        <p className="body" style={{ marginTop: 4 }}>{GAMES.length} เกมปาร์ตี้ พร้อมเล่นทันที</p>
      </div>
      <div className="row gap8" style={{ overflowX: 'auto', padding: '12px 20px', scrollbarWidth: 'none' }}>
        {cats.map(([c, on]) => (
          <span key={c} className="chip th" style={{ flexShrink: 0, background: on ? 'var(--grad)' : 'var(--surface-2)', color: on ? '#fff' : 'var(--text)', border: on ? 'none' : '1px solid var(--border)' }}>{c}</span>
        ))}
      </div>
      <div className="pad-x col gap12">
        {GAMES.map(g => <GameCard key={g.id} game={g} height={164} onClick={() => go('lobby')} onRules={setRules} />)}
      </div>

      {/* coming soon */}
      <div className="pad-x" style={{ marginTop: 26 }}>
        <div className="row gap8" style={{ alignItems: 'center', marginBottom: 4 }}>
          <h2 className="th h2" style={{ fontSize: 18 }}>เกมที่กำลังจะมา</h2>
          <span style={{ fontSize: 16 }}>🔜</span>
        </div>
        <p className="body" style={{ fontSize: 13, marginBottom: 14 }}>เกมใหม่กำลังเดินทางมาที่โต๊ะของคุณ</p>
        <div className="col gap12">
          {UPCOMING.map(g => <ComingSoonCard key={g.id} game={g} onNotify={(game) => showToast(`จะเตือนเมื่อ ${game.th} เปิดให้เล่น`, '🔔')} />)}
        </div>
      </div>

      {rules && <RulesSheet game={rules} onClose={() => setRules(null)} onPlay={() => { setRules(null); go('lobby'); }} />}
    </div>
  );
}

function FriendsScreen({ go, showToast }) {
  const map = { 'in-room': ['อยู่ในห้อง', 'var(--primary)'], playing: ['กำลังเล่น', 'var(--accent)'], online: ['ออนไลน์', '#34D17E'], away: ['ไม่อยู่', 'var(--muted)'] };
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
          const [label, col] = map[f.status] || map.online;
          return (
            <div key={f.id} className="card-solid row between" style={{ padding: '10px 14px' }}>
              <div className="row gap12">
                <Avatar who={f} size={46} dot={f.online} />
                <div className="col" style={{ gap: 1 }}>
                  <span className="th h3" style={{ fontSize: 15 }}>{f.name} <span className="tiny">· {f.en}</span></span>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: col }}>● {label}</span>
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

function ProfileScreen({ go, openAccount, showToast }) {
  const stats = [['142', 'เกมที่เล่น'], ['68%', 'อัตราชนะ'], ['#3', 'อันดับเพื่อน']];
  const favs = [GAMES[0], GAMES[1], GAMES[2]];
  const ach = [['🏆', 'ราชาแห่งวง', true], ['🕵️', 'เมอร์ลินไร้เงา', true], ['🔥', 'ชนะ 5 ติด', true], ['🎭', 'นักบลัฟ', false], ['👑', 'หัวห้องตัวยง', false]];
  const handle = '@' + (ME.provider ? (ME.name === 'คุณ' ? 'player' : ME.name).toLowerCase().replace(/\s+/g, '_') : 'guest_' + ME.mascot);
  return (
    <div className="scroll screen-anim" style={{ paddingBottom: 112 }}>
      {/* header banner */}
      <div style={{ position: 'relative', height: 150 }}>
        <div style={{ position: 'absolute', inset: 0, background: 'var(--grad)', opacity: 0.9 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(rgba(255,255,255,0.16) 1px, transparent 1.4px)', backgroundSize: '14px 14px', opacity: 0.5 }} />
        <button className="row center" style={{ position: 'absolute', top: 56, right: 18, width: 40, height: 40, borderRadius: 12, background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(8px)', color: '#fff' }} onClick={openAccount}><Icon name="settings" size={19} /></button>
      </div>
      <div className="pad-x" style={{ marginTop: -44 }}>
        <div className="row between" style={{ alignItems: 'flex-end' }}>
          <div style={{ borderRadius: '50%', boxShadow: '0 0 0 4px var(--bg)' }}><Avatar who={ME} size={92} onClick={openAccount} /></div>
          <button className="btn btn-glass" style={{ height: 42, borderRadius: 13, marginBottom: 6 }} onClick={openAccount}>แก้ไข</button>
        </div>
        <div className="col" style={{ gap: 2, marginTop: 10 }}>
          <h1 className="th h1" style={{ fontSize: 26 }}>{ME.name} <span style={{ color: 'var(--muted)', fontWeight: 600, fontSize: 17 }}>{handle}</span></h1>
          <span className="th body row gap6" style={{ alignItems: 'center' }}>
            <span style={{ fontSize: 16 }}>{MASCOTS[ME.mascot].em}</span>
            {ME.provider
              ? <>เชื่อมบัญชีแล้ว · ชอบเกมจับโกหก</>
              : <span style={{ color: 'var(--accent)', fontWeight: 700 }}>บัญชีผู้เยี่ยมชม — แตะเพื่อผูกบัญชี</span>}
          </span>
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

Object.assign(window, { GamesScreen, FriendsScreen, ProfileScreen });
