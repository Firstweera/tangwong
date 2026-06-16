// screen-lobby.jsx — room lobby with layout variations (grid / list / circle)

function ReadyPill({ ready }) {
  return (
    <span className="row gap6" style={{ fontSize: 10.5, fontWeight: 800, padding: '3px 8px', borderRadius: 8,
      background: ready ? 'rgba(52,209,126,0.16)' : 'var(--surface-2)',
      color: ready ? '#34D17E' : 'var(--muted)', alignItems: 'center' }}>
      {ready ? <><Icon name="check" size={11} stroke={3.2} /> พร้อม</> : 'รอ...'}
    </span>
  );
}

function LobbyScreen({ go, layout, showToast }) {
  const ROOM = '4F2K9';
  const [ready, setReady] = useState({ p2: true, p3: true, p4: false, p5: true, p6: false, p7: true });
  const meReady = ready.me || false;
  const players = PLAYERS;
  const readyCount = players.filter(p => p.id === 'me' ? meReady : ready[p.id]).length;
  const allReady = readyCount === players.length;

  const toggleMe = () => setReady(r => ({ ...r, me: !r.me }));
  const isReady = (p) => p.id === 'me' ? meReady : ready[p.id];

  const copyCode = () => showToast('คัดลอกรหัสห้องแล้ว', '📋');

  /* ── player views per layout ── */
  const PlayerGrid = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {players.map((p, i) => (
        <div key={p.id} className="card-solid col center gap8 rise" style={{ padding: '16px 10px 12px', position: 'relative', animationDelay: i * 0.04 + 's' }}>
          {p.id === 'me' && <span style={{ position: 'absolute', top: 8, left: 10, fontSize: 9.5, fontWeight: 800, color: 'var(--primary)' }}>YOU</span>}
          <Avatar who={p} size={56} dot crown={i === 0} />
          <span className="th h3" style={{ fontSize: 14 }}>{p.name}</span>
          <ReadyPill ready={isReady(p)} />
        </div>
      ))}
    </div>
  );

  const PlayerList = () => (
    <div className="card-solid" style={{ overflow: 'hidden' }}>
      {players.map((p, i) => (
        <div key={p.id} className="row between rise" style={{ padding: '11px 14px', borderTop: i ? '1px solid var(--border)' : 'none', animationDelay: i * 0.03 + 's' }}>
          <div className="row gap12">
            <Avatar who={p} size={44} dot crown={i === 0} />
            <div className="col" style={{ gap: 1 }}>
              <span className="th h3" style={{ fontSize: 15 }}>{p.name} {p.id === 'me' && <span style={{ color: 'var(--primary)', fontSize: 11, fontWeight: 800 }}>· คุณ</span>}</span>
              <span className="tiny">{i === 0 ? 'หัวห้อง · Host' : 'ผู้เล่น'}</span>
            </div>
          </div>
          <ReadyPill ready={isReady(p)} />
        </div>
      ))}
    </div>
  );

  const PlayerCircle = () => {
    const n = players.length, R = 116, cx = 50, cy = 50;
    return (
      <div className="ring-stage" style={{ height: 300 }}>
        <div className="spin-slow" style={{ position: 'absolute', top: '50%', left: '50%', width: 232, height: 232,
             border: '1.5px dashed var(--border-2)', borderRadius: '50%', transform: 'translate(-50%,-50%)' }} />
        <div className="ring-center col center gap6" style={{ width: 130 }}>
          <Logo size={30} showWord={false} />
          <span className="th" style={{ fontWeight: 800, fontSize: 15 }}>ตั้งวง</span>
          <span className="tiny" style={{ fontWeight: 700 }}>{readyCount}/{players.length} พร้อม</span>
        </div>
        {players.map((p, i) => {
          const ang = (-90 + i * 360 / n) * Math.PI / 180;
          const x = cx + (R / 2.32) * Math.cos(ang);
          const y = cy + (R / 2.32) * Math.sin(ang);
          return (
            <div key={p.id} className="ring-seat rise" style={{ left: x + '%', top: y + '%', animationDelay: i * 0.05 + 's' }}>
              <Avatar who={p} size={52} dot crown={i === 0} ring={isReady(p) ? '#34D17E' : false} />
              <span className="ring-name th">{p.name}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="screen screen-anim">
      <div className="scroll" style={{ paddingBottom: 96 }}>
        {/* top bar */}
        <div className="row between pad-x pad-top" style={{ paddingBottom: 8 }}>
          <button className="row center" style={{ width: 42, height: 42, borderRadius: 13, background: 'var(--surface-2)', border: '1px solid var(--border)' }} onClick={() => go('home')}>
            <Icon name="chevL" size={20} />
          </button>
          <div className="col center" style={{ gap: 0 }}>
            <span className="th h3">ห้องของแพรวา</span>
            <span className="tiny">{players.length} คน · กำลังจัดทีม</span>
          </div>
          <button className="row center" style={{ width: 42, height: 42, borderRadius: 13, background: 'var(--surface-2)', border: '1px solid var(--border)' }} onClick={() => showToast('ตั้งค่าห้อง', '⚙️')}>
            <Icon name="settings" size={19} />
          </button>
        </div>

        {/* room code */}
        <div className="pad-x" style={{ marginTop: 12 }}>
          <div className="card row between" style={{ padding: '14px 16px' }}>
            <div className="col" style={{ gap: 3 }}>
              <span className="eyebrow">รหัสห้อง · room code</span>
              <span className="mono" style={{ fontSize: 30, fontWeight: 700, letterSpacing: '0.16em', lineHeight: 1 }}>{ROOM}</span>
            </div>
            <div className="row gap8">
              <button className="row center" style={{ width: 44, height: 44, borderRadius: 13, background: 'var(--surface-3)' }} onClick={copyCode}><Icon name="copy" size={19} /></button>
              <button className="row center" style={{ width: 44, height: 44, borderRadius: 13, background: 'var(--grad)', color: '#fff', boxShadow: '0 8px 18px -8px rgba(109,94,249,0.8)' }} onClick={() => showToast('แชร์ลิงก์ห้องแล้ว', '🔗')}><Icon name="share" size={18} /></button>
            </div>
          </div>
        </div>

        {/* voice channel indicator */}
        <div className="pad-x" style={{ marginTop: 10 }}>
          <div className="card row between" style={{ padding: '10px 14px' }}>
            <div className="row gap10">
              <div className="row center" style={{ width: 34, height: 34, borderRadius: 11, background: 'rgba(52,209,126,0.16)', color: '#34D17E' }}><Icon name="mic" size={17} /></div>
              <div className="col" style={{ gap: 1 }}>
                <span className="th" style={{ fontSize: 13.5, fontWeight: 700 }}>ห้องเสียง · Voice</span>
                <span className="tiny" style={{ color: '#34D17E', fontWeight: 700 }}>● 4 คนกำลังคุย</span>
              </div>
            </div>
            <div className="row"><AvatarStack people={[PLAYERS[3], PLAYERS[2], PLAYERS[1], PLAYERS[4]]} size={28} max={4} /></div>
          </div>
        </div>

        {/* selected game */}
        <div className="pad-x" style={{ marginTop: 18 }}>
          <div className="row between" style={{ marginBottom: 10 }}>
            <h2 className="th h2" style={{ fontSize: 18 }}>เกมที่เลือก</h2>
            <button className="chip" onClick={() => showToast('เลือกเกมอื่น', '🎲')}><Icon name="dice" size={14} /> เปลี่ยนเกม</button>
          </div>
          <GameCard game={GAMES[0]} height={150} onClick={() => {}} />
        </div>

        {/* players */}
        <div className="pad-x" style={{ marginTop: 20 }}>
          <div className="row between" style={{ marginBottom: 12 }}>
            <h2 className="th h2" style={{ fontSize: 18 }}>ผู้เล่น <span style={{ color: 'var(--muted)', fontWeight: 600 }}>{players.length}/{GAMES[0].players.split('–')[1]}</span></h2>
            <span className="chip" style={{ background: 'rgba(52,209,126,0.14)', color: '#34D17E', border: 'none' }}>{readyCount}/{players.length} พร้อม</span>
          </div>
          {layout === 'list' ? <PlayerList /> : layout === 'circle' ? <PlayerCircle /> : <PlayerGrid />}
        </div>
      </div>

      {/* bottom action bar */}
      <div className="pad-x" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 12, paddingBottom: 26,
           background: 'linear-gradient(transparent, var(--bg) 32%)' }}>
        <div className="row gap10">
          <button className={'btn ' + (meReady ? 'btn-glass' : 'btn-accent')} style={{ flex: '0 0 auto', width: 120 }} onClick={toggleMe}>
            {meReady ? <><Icon name="check" size={18} stroke={3} /> พร้อม</> : 'กดพร้อม'}
          </button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => go('game')}>
            <span className="sheen" />
            <span className="th" style={{ fontWeight: 800 }}>เริ่มเกม</span>
            <Icon name="arrowR" size={20} stroke={2.6} />
          </button>
        </div>
        <div className="tiny center row" style={{ marginTop: 8, opacity: 0.7 }}>
          {allReady ? 'ทุกคนพร้อมแล้ว — เริ่มได้เลย!' : 'คุณคือหัวห้อง · เริ่มเกมได้ทุกเมื่อ'}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LobbyScreen });
