// screen-home.jsx — landing / home

function StepDot({ n, title, sub, color }) {
  return (
    <div className="row gap12" style={{ alignItems: 'flex-start' }}>
      <div className="row center" style={{ width: 30, height: 30, borderRadius: 10, flexShrink: 0,
           background: color, color: '#fff', fontWeight: 800, fontSize: 14 }}>{n}</div>
      <div className="col" style={{ gap: 1, paddingTop: 2 }}>
        <span className="th h3">{title}</span>
        <span className="tiny">{sub}</span>
      </div>
    </div>
  );
}

function HomeScreen({ go, showToast }) {
  const avalon = GAMES[0];
  const [code, setCode] = useState('');
  const onlineFriends = FRIENDS.filter(f => f.online);

  return (
    <div className="scroll screen-anim" style={{ paddingBottom: 112 }}>
      {/* header */}
      <div className="row between pad-x pad-top" style={{ paddingBottom: 10 }}>
        <Logo size={32} />
        <div className="row gap10">
          <button className="row center" style={{ width: 42, height: 42, borderRadius: 13, background: 'var(--surface-2)', border: '1px solid var(--border)', position: 'relative' }}>
            <Icon name="bell" size={20} />
            <span style={{ position: 'absolute', top: 9, right: 10, width: 8, height: 8, borderRadius: 4, background: 'var(--accent)', boxShadow: '0 0 0 2px var(--surface-solid)' }} />
          </button>
          <Avatar who={ME} size={42} onClick={() => showToast('โปรไฟล์ของคุณ', '🦊')} />
        </div>
      </div>

      {/* hero */}
      <div className="pad-x" style={{ paddingTop: 14 }}>
        <div className="row gap6" style={{ alignItems: 'center', marginBottom: 14 }}>
          <span style={{ width: 7, height: 7, borderRadius: 4, background: '#34D17E', boxShadow: '0 0 8px #34D17E' }} />
          <span className="eyebrow">เล่นด้วยกัน ได้ทุกที่ · play anywhere</span>
        </div>
        <h1 className="th display" style={{ fontSize: 40 }}>
          รวมเพื่อน<br /><span className="grad-text">เริ่มเกม</span>
        </h1>
        <p className="body" style={{ marginTop: 12, fontSize: 14.5, maxWidth: 290 }}>
          Gather your friends. Start the game. สร้างห้อง แชร์โค้ด แล้วเล่นบอร์ดเกมปาร์ตี้ด้วยกันได้ทันที
        </p>
      </div>

      {/* CTAs */}
      <div className="pad-x col gap12" style={{ marginTop: 20 }}>
        <button className="btn btn-primary btn-lg btn-block" onClick={() => go('lobby')}>
          <span className="sheen" />
          <Icon name="plus" size={22} stroke={2.6} />
          <span className="th">สร้างห้อง · Create Room</span>
        </button>

        <div className="card row" style={{ padding: 6, gap: 6, height: 58 }}>
          <div className="row gap8" style={{ flex: 1, paddingLeft: 12, alignItems: 'center' }}>
            <Icon name="qr" size={19} style={{ color: 'var(--muted)' }} />
            <input
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="ใส่รหัสห้อง · ROOM CODE"
              className="mono"
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text)',
                       fontSize: 15, fontWeight: 700, letterSpacing: '0.1em', width: '100%' }}
            />
          </div>
          <button className="btn btn-ghost" style={{ height: 46, borderRadius: 13, padding: '0 18px' }}
                  onClick={() => code.length >= 4 ? go('lobby') : showToast('ใส่รหัสห้องก่อนนะ', '🔑')}>
            เข้าร่วม
          </button>
        </div>
      </div>

      {/* online friends */}
      <div style={{ marginTop: 26 }}>
        <div className="row between pad-x" style={{ marginBottom: 12 }}>
          <h2 className="th h2">เพื่อนออนไลน์ <span style={{ color: 'var(--muted)', fontWeight: 600, fontSize: 15 }}>{onlineFriends.length}</span></h2>
          <button className="tiny row gap6" style={{ fontWeight: 700, color: 'var(--primary)' }} onClick={() => showToast('ระบบเพื่อน เร็วๆ นี้', '👥')}>
            ทั้งหมด <Icon name="chevR" size={13} stroke={2.6} />
          </button>
        </div>
        <div className="row gap16" style={{ overflowX: 'auto', padding: '4px 20px 6px', scrollbarWidth: 'none' }}>
          <div className="col center gap8" style={{ flexShrink: 0 }}>
            <button className="row center" style={{ width: 56, height: 56, borderRadius: '50%', border: '2px dashed var(--border-2)', color: 'var(--muted)' }} onClick={() => showToast('เชิญเพื่อน', '✉️')}>
              <Icon name="plus" size={22} />
            </button>
            <span className="tiny" style={{ fontWeight: 600 }}>เชิญ</span>
          </div>
          {onlineFriends.map(f => {
            const map = { 'in-room': ['ในห้อง', 'var(--primary)'], playing: ['กำลังเล่น', 'var(--accent)'], online: ['ออนไลน์', '#34D17E'], away: ['ไม่อยู่', 'var(--muted)'] };
            const [label, col] = map[f.status] || map.online;
            return (
              <div key={f.id} className="col center gap8" style={{ flexShrink: 0, width: 60 }}>
                <Avatar who={f} size={56} dot={f.status === 'online'} ring={f.status === 'in-room' ? 'var(--primary)' : f.status === 'playing' ? 'var(--accent)' : false} />
                <div className="col center" style={{ gap: 1 }}>
                  <span className="th" style={{ fontSize: 12, fontWeight: 700 }}>{f.en}</span>
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: col }}>{label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* featured games */}
      <div style={{ marginTop: 26 }}>
        <div className="row between pad-x" style={{ marginBottom: 12 }}>
          <h2 className="th h2">เกมยอดนิยม</h2>
          <button className="tiny row gap6" style={{ fontWeight: 700, color: 'var(--primary)' }} onClick={() => go('games')}>
            ดูทั้งหมด <Icon name="chevR" size={13} stroke={2.6} />
          </button>
        </div>
        <div className="pad-x">
          <GameCard game={avalon} big height={190} onClick={() => go('lobby')} />
        </div>
        <div className="pad-x" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
          {GAMES.slice(1).map(g => <GameCard key={g.id} game={g} height={150} onClick={() => go('lobby')} />)}
        </div>
      </div>

      {/* how it works */}
      <div className="pad-x" style={{ marginTop: 28 }}>
        <div className="card-solid col gap16" style={{ padding: 20 }}>
          <h3 className="th h2" style={{ fontSize: 18 }}>เริ่มเล่นใน 30 วินาที</h3>
          <StepDot n="1" title="สร้างห้อง" sub="Create a room with one tap" color="var(--primary)" />
          <StepDot n="2" title="แชร์รหัส" sub="Share the code — friends join instantly" color="var(--secondary)" />
          <StepDot n="3" title="เริ่มเกม" sub="Pick a game and play together" color="var(--accent)" />
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { HomeScreen });
