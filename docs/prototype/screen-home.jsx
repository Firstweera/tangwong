// screen-home.jsx — landing / home

function RoundTableHero({ go }) {
  const seats = [PLAYERS[1], PLAYERS[3], ME, PLAYERS[4], PLAYERS[2]]; // cat, owl, you, panda, raccoon
  const pos = [[11, 65], [30, 50], [50, 44], [70, 50], [89, 65]];
  return (
    <div className="pad-x" style={{ paddingTop: 8 }}>
      <div className="felt felt-stitch" style={{ position: 'relative', borderRadius: 26, height: 330, padding: '18px 18px 0', overflow: 'hidden',
        boxShadow: '0 24px 54px -18px rgba(0,0,0,0.65), inset 0 0 0 2px rgba(255,215,138,0.45), inset 0 0 70px rgba(0,0,0,0.4)' }}>
        {/* live badge */}
        <div className="row gap6" style={{ position: 'absolute', top: 15, right: 15, zIndex: 3, fontSize: 11, fontWeight: 800, color: '#fff',
          padding: '5px 10px', borderRadius: 9, background: 'rgba(0,0,0,0.34)', border: '1px solid rgba(255,255,255,0.16)', backdropFilter: 'blur(6px)', alignItems: 'center' }}>
          <span style={{ width: 7, height: 7, borderRadius: 4, background: '#34D17E', boxShadow: '0 0 8px #34D17E' }} /> LIVE · 6 กำลังเล่น
        </div>
        {/* headline */}
        <div className="row gap6" style={{ marginBottom: 9, position: 'relative', zIndex: 2, alignItems: 'center', paddingRight: 130 }}>
          <span style={{ fontSize: 14 }}>🎲</span>
          <span className="eyebrow" style={{ color: 'rgba(255,255,255,0.82)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>social deduction</span>
        </div>
        <h1 className="th display" style={{ fontSize: 36, color: '#fff', position: 'relative', zIndex: 2, textShadow: '0 2px 16px rgba(0,0,0,0.45)' }}>
          รวมวง<br /><span style={{ color: 'var(--brass-1)' }}>เริ่มเกม</span>
        </h1>
        {/* table scene */}
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* implied table felt ring under the cards */}
          <div style={{ position: 'absolute', left: '50%', top: '63%', transform: 'translate(-50%,-50%)', width: '78%', height: '46%',
            borderRadius: '50%', border: '2px dashed rgba(255,215,138,0.28)', boxShadow: 'inset 0 0 40px rgba(0,0,0,0.3)' }} />
          {seats.map((p, i) => (
            <div key={i} className="col center gap4" style={{ position: 'absolute', left: pos[i][0] + '%', top: pos[i][1] + '%', transform: 'translate(-50%,-50%)' }}>
              <Avatar who={p} size={i === 2 ? 54 : 46} dot ring={i === 2 ? 'var(--brass-1)' : false} />
            </div>
          ))}
          {/* center: fanned deck + chip + die */}
          <div style={{ position: 'absolute', left: '50%', top: '80%', transform: 'translate(-50%,-50%)' }}><CardFan count={5} w={42} h={58} /></div>
          <div style={{ position: 'absolute', left: '23%', top: '82%', transform: 'translate(-50%,-50%) rotate(-8deg)' }}><Token kind="good" size={34} /></div>
          <div style={{ position: 'absolute', left: '77%', top: '83%', transform: 'translate(-50%,-50%) rotate(12deg)' }}><Die face={5} size={34} /></div>
        </div>
      </div>
    </div>
  );
}

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

function HomeScreen({ go, openAccount, showToast }) {
  const avalon = GAMES[0];
  const [code, setCode] = useState('');
  const [rules, setRules] = useState(null);
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
          <Avatar who={ME} size={42} dot={!ME.guest} onClick={openAccount} />
        </div>
      </div>

      {/* hero table scene */}
      <RoundTableHero go={go} />
      <div className="pad-x" style={{ paddingTop: 16 }}>
        <p className="body" style={{ fontSize: 14.5, maxWidth: 320 }}>
          Gather your friends around the table. สร้างห้อง ชวนเพื่อนมาล้อมวง แล้วเล่นบอร์ดเกมจับโกหกด้วยกันได้ทันที
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
          <GameCard game={avalon} big height={190} onClick={() => go('lobby')} onRules={setRules} />
        </div>
        <div className="pad-x" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
          {GAMES.slice(1).map(g => <GameCard key={g.id} game={g} height={150} onClick={() => go('lobby')} onRules={setRules} />)}
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

      {rules && <RulesSheet game={rules} onClose={() => setRules(null)} onPlay={() => { setRules(null); go('lobby'); }} />}
    </div>
  );
}

Object.assign(window, { HomeScreen });
