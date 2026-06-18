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
  const game = GAMES[0];
  const minP = parseInt(game.players.split('–')[0], 10);   // 5
  const maxP = parseInt(game.players.split('–')[1], 10);    // 10

  const [ready, setReady] = useState({ p2: true, p3: true, p4: false });
  const [hostId, setHostId] = useState('me');
  // start the room below the minimum so the host needs to fill seats
  const [removed, setRemoved] = useState(['p5', 'p6', 'p7']);
  const [bots, setBots] = useState([]);
  const [menuFor, setMenuFor] = useState(null);
  const meReady = ready.me || false;

  const realPlayers = PLAYERS.filter(p => !removed.includes(p.id));
  const players = [...realPlayers, ...bots];
  const isReady = (p) => p.id === 'me' ? meReady : p.bot ? true : !!ready[p.id];
  const readyCount = players.filter(isReady).length;
  const allReady = readyCount === players.length;
  const enough = players.length >= minP;
  const atMax = players.length >= maxP;
  const amHost = hostId === 'me';
  const canStart = amHost && enough && allReady;

  const toggleMe = () => setReady(r => ({ ...r, me: !r.me }));
  const canManage = (p) => amHost && p.id !== 'me' && p.id !== hostId;

  const copyCode = () => showToast('คัดลอกรหัสห้องแล้ว', '📋');
  const doTransfer = (p) => { setHostId(p.id); setMenuFor(null); showToast(`โอนสิทธิ์หัวห้องให้ ${p.name} แล้ว`, '👑'); };
  const doKick = (p) => {
    setMenuFor(null);
    if (p.bot) { setBots(b => b.filter(x => x.id !== p.id)); showToast(`นำ ${p.name} ออกแล้ว`, '🤖'); }
    else { setRemoved(r => [...r, p.id]); showToast(`นำ ${p.name} ออกจากห้องแล้ว`, '🚫'); }
  };
  const addBot = () => {
    if (atMax) { showToast('ห้องเต็มแล้ว', '⚠️'); return; }
    const used = new Set(bots.map(b => b.mascot));
    const def = BOT_POOL.find(b => !used.has(b.mascot)) || BOT_POOL[bots.length % BOT_POOL.length];
    const id = 'bot' + (bots.length + 1);
    setBots(b => [...b, { ...def, id, en: 'Bot', bot: true }]);
    showToast(`เพิ่ม ${def.name} แล้ว`, '🤖');
  };

  // simulate the human players readying up shortly after entering
  useEffect(() => {
    const t = setTimeout(() => setReady(r => ({ ...r, p4: true })), 2600);
    return () => clearTimeout(t);
  }, []);

  // click-away to close the player menu
  useEffect(() => {
    if (!menuFor) return;
    const h = (e) => { if (!e.target.closest('[data-pmenu]')) setMenuFor(null); };
    document.addEventListener('pointerdown', h);
    return () => document.removeEventListener('pointerdown', h);
  }, [menuFor]);

  const MoreBtn = ({ p, style }) => (
    <button data-pmenu className="row center tap" aria-label="จัดการผู้เล่น"
      onClick={(e) => { e.stopPropagation(); setMenuFor(menuFor === p.id ? null : p.id); }}
      style={{ width: 28, height: 28, borderRadius: 9, background: 'var(--surface-3)', color: 'var(--muted)',
               border: '1px solid var(--border)', ...style }}>
      <Icon name="more" size={17} stroke={2.6} />
    </button>
  );

  const MenuCard = ({ p }) => (
    <div className="card-solid pop" data-pmenu style={{ width: 212, padding: 6, borderRadius: 14,
         boxShadow: 'var(--shadow)', border: '1px solid var(--border-2)' }}>
      <div className="row gap8" style={{ padding: '6px 8px 8px', alignItems: 'center' }}>
        <Avatar who={p} size={26} bot={p.bot} />
        <span className="th" style={{ fontSize: 12.5, fontWeight: 700 }}>{p.name}</span>
      </div>
      <div className="divider" style={{ margin: '0 4px 4px' }} />
      {!p.bot && (
        <button className="row gap10 tap" style={{ width: '100%', padding: '11px 10px', borderRadius: 10, alignItems: 'center' }}
                onClick={(e) => { e.stopPropagation(); doTransfer(p); }}>
          <span style={{ fontSize: 18 }}>👑</span>
          <span className="th" style={{ fontSize: 13.5, fontWeight: 700 }}>โอนสิทธิ์เจ้าของห้อง</span>
        </button>
      )}
      <button className="row gap10 tap" style={{ width: '100%', padding: '11px 10px', borderRadius: 10, alignItems: 'center' }}
              onClick={(e) => { e.stopPropagation(); doKick(p); }}>
        <span style={{ fontSize: 18 }}>{p.bot ? '🗑️' : '🚫'}</span>
        <span className="th" style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--evil)' }}>{p.bot ? 'นำบอทออก' : 'นำออกจากห้อง'}</span>
      </button>
    </div>
  );

  const AddBotTile = () => (
    <button className="tap col center gap6" onClick={addBot} disabled={atMax}
      style={{ borderRadius: 18, border: '2px dashed var(--border-2)', background: 'var(--surface-2)',
               padding: '16px 10px', minHeight: 118, opacity: atMax ? 0.4 : 1, color: 'var(--text)' }}>
      <div className="row center" style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--grad-soft)', color: 'var(--primary)' }}>
        <span style={{ fontSize: 22 }}>🤖</span>
      </div>
      <span className="th" style={{ fontSize: 13.5, fontWeight: 700 }}>เพิ่มบอท</span>
      <span className="tiny" style={{ fontWeight: 600 }}>{atMax ? 'เต็มแล้ว' : 'พร้อมทันที'}</span>
    </button>
  );

  /* ── player views per layout ── */
  const PlayerGrid = () => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {players.map((p, i) => (
        <div key={p.id} className="card-solid col center gap8 rise" style={{ padding: '16px 10px 12px', position: 'relative', animationDelay: i * 0.04 + 's' }}>
          {p.id === 'me' && <span style={{ position: 'absolute', top: 8, left: 10, fontSize: 9.5, fontWeight: 800, color: 'var(--primary)' }}>YOU</span>}
          {canManage(p) && <MoreBtn p={p} style={{ position: 'absolute', top: 8, right: 8 }} />}
          {menuFor === p.id && <div style={{ position: 'absolute', top: 40, zIndex: 35, ...(i % 2 === 0 ? { left: 8 } : { right: 8 }) }}><MenuCard p={p} /></div>}
          <Avatar who={p} size={56} dot crown={p.id === hostId} bot={p.bot} />
          <span className="th h3" style={{ fontSize: 14 }}>{p.name}</span>
          <ReadyPill ready={isReady(p)} />
        </div>
      ))}
      <AddBotTile />
    </div>
  );

  const PlayerList = () => (
    <div className="col gap10">
      <div className="card-solid" style={{ overflow: 'visible' }}>
        {players.map((p, i) => (
          <div key={p.id} className="row between rise" style={{ padding: '11px 14px', borderTop: i ? '1px solid var(--border)' : 'none', position: 'relative', animationDelay: i * 0.03 + 's' }}>
            <div className="row gap12">
              <Avatar who={p} size={44} dot crown={p.id === hostId} bot={p.bot} />
              <div className="col" style={{ gap: 1 }}>
                <span className="th h3" style={{ fontSize: 15 }}>{p.name} {p.id === 'me' && <span style={{ color: 'var(--primary)', fontSize: 11, fontWeight: 800 }}>· คุณ</span>}</span>
                <span className="tiny">{p.id === hostId ? 'หัวห้อง · Host' : p.bot ? 'บอท · พร้อมเสมอ' : 'ผู้เล่น'}</span>
              </div>
            </div>
            <div className="row gap8" style={{ alignItems: 'center' }}>
              <ReadyPill ready={isReady(p)} />
              {canManage(p) && <MoreBtn p={p} />}
            </div>
            {menuFor === p.id && <div style={{ position: 'absolute', top: 50, right: 12, zIndex: 35 }}><MenuCard p={p} /></div>}
          </div>
        ))}
      </div>
      <button className="tap row center gap8" onClick={addBot} disabled={atMax}
        style={{ height: 50, borderRadius: 16, border: '2px dashed var(--border-2)', background: 'var(--surface-2)',
                 color: 'var(--text)', fontWeight: 700, opacity: atMax ? 0.4 : 1 }}>
        <span style={{ fontSize: 18 }}>🤖</span>
        <span className="th" style={{ fontSize: 14 }}>{atMax ? 'ห้องเต็มแล้ว' : 'เพิ่มบอท'}</span>
      </button>
    </div>
  );

  const PlayerCircle = () => {
    const n = players.length, R = 116, cx = 50, cy = 50;
    return (
      <div className="ring-stage" style={{ height: 300 }}>
        <div className="brass-rim" style={{ position: 'absolute', top: '50%', left: '50%', width: 256, height: 256, borderRadius: '50%', transform: 'translate(-50%,-50%)' }} />
        <div className="felt" style={{ position: 'absolute', top: '50%', left: '50%', width: 232, height: 232, borderRadius: '50%', transform: 'translate(-50%,-50%)',
             boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5), inset 0 0 0 2px rgba(255,215,138,0.25)' }}>
          <div style={{ position: 'absolute', inset: '13%', borderRadius: '50%', border: '2px dashed rgba(255,215,138,0.3)' }} />
        </div>
        <div className="ring-center col center gap6" style={{ width: 130 }}>
          <Logo size={30} showWord={false} />
          <span className="th" style={{ fontWeight: 800, fontSize: 15, color: '#fff' }}>ตั้งวง</span>
          <span className="tiny nameplate" style={{ fontWeight: 700 }}>{readyCount}/{players.length} พร้อม</span>
        </div>
        {players.map((p, i) => {
          const ang = (-90 + i * 360 / n) * Math.PI / 180;
          const x = cx + (R / 2.32) * Math.cos(ang);
          const y = cy + (R / 2.32) * Math.sin(ang);
          const manage = canManage(p);
          const anchor = x < 36 ? { left: 0 } : x > 64 ? { right: 0 } : { left: '50%', transform: 'translateX(-50%)' };
          return (
            <div key={p.id} className="ring-seat rise" style={{ left: x + '%', top: y + '%', animationDelay: i * 0.05 + 's', zIndex: menuFor === p.id ? 36 : 1 }}>
              <div data-pmenu={manage ? '' : undefined} onClick={manage ? (e) => { e.stopPropagation(); setMenuFor(menuFor === p.id ? null : p.id); } : undefined}
                   style={{ position: 'relative', cursor: manage ? 'pointer' : 'default' }}>
                <Avatar who={p} size={52} dot crown={p.id === hostId} bot={p.bot} ring={isReady(p) ? '#34D17E' : false} />
                {manage && <span className="row center" style={{ position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderRadius: '50%', background: 'var(--surface-solid)', border: '1px solid var(--border-2)', color: 'var(--muted)' }}><Icon name="more" size={13} stroke={2.8} /></span>}
              </div>
              <span className="ring-name th nameplate" style={{ marginTop: 2 }}>{p.name}</span>
              {menuFor === p.id && <div style={{ position: 'absolute', top: 60, ...anchor }}><MenuCard p={p} /></div>}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="screen screen-anim">
      <div className="scroll" style={{ paddingBottom: 150 }}>
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

        {/* voice channel — coming soon */}
        <div className="pad-x" style={{ marginTop: 10 }}>
          <div className="card row between" style={{ padding: '10px 14px', position: 'relative', overflow: 'hidden' }}>
            <div className="row gap10" style={{ opacity: 0.5 }}>
              <div className="row center" style={{ width: 34, height: 34, borderRadius: 11, background: 'var(--surface-3)', color: 'var(--muted)', position: 'relative' }}>
                <Icon name="mic" size={17} />
                <span style={{ position: 'absolute', width: 24, height: 2, borderRadius: 2, background: 'var(--muted)', transform: 'rotate(-45deg)' }} />
              </div>
              <div className="col" style={{ gap: 1 }}>
                <span className="th" style={{ fontSize: 13.5, fontWeight: 700 }}>ห้องเสียง · Voice</span>
                <span className="tiny" style={{ fontWeight: 600 }}>คุยกันด้วยเสียงระหว่างเล่น</span>
              </div>
            </div>
            <span className="th row gap6" style={{ alignItems: 'center', fontSize: 11, fontWeight: 800, padding: '5px 10px', borderRadius: 9,
                  background: 'var(--surface-3)', color: 'var(--muted)', border: '1px solid var(--border)', flexShrink: 0 }}>
              <span style={{ fontSize: 12 }}>🔜</span> เร็วๆ นี้
            </span>
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
          <div className="row between" style={{ marginBottom: 6 }}>
            <h2 className="th h2" style={{ fontSize: 18 }}>ผู้เล่น <span style={{ color: enough ? 'var(--muted)' : 'var(--accent)', fontWeight: 700 }}>{players.length}/{maxP}</span></h2>
            <span className="chip" style={{ background: allReady ? 'rgba(52,209,126,0.14)' : 'var(--surface-2)', color: allReady ? '#34D17E' : 'var(--muted)', border: allReady ? 'none' : '1px solid var(--border)' }}>{readyCount}/{players.length} พร้อม</span>
          </div>
          {!enough && (
            <div className="row gap8 rise" style={{ alignItems: 'center', marginBottom: 12, padding: '9px 12px', borderRadius: 12,
                 background: 'rgba(255,159,67,0.12)', border: '1px solid rgba(255,159,67,0.28)' }}>
              <span style={{ fontSize: 15 }}>👥</span>
              <span className="th tiny" style={{ fontWeight: 700, color: 'var(--accent)' }}>ต้องการอีก {minP - players.length} คนจึงจะเริ่มได้ — เพิ่มบอทเพื่อเติมที่นั่ง</span>
            </div>
          )}
          {enough && <div style={{ height: 6 }} />}
          {layout === 'list' ? <PlayerList /> : layout === 'circle' ? <PlayerCircle /> : <PlayerGrid />}
          {layout === 'circle' && (
            <button className="tap row center gap8" onClick={addBot} disabled={atMax}
              style={{ width: '100%', height: 50, marginTop: 6, borderRadius: 16, border: '2px dashed var(--border-2)', background: 'var(--surface-2)',
                       color: 'var(--text)', fontWeight: 700, opacity: atMax ? 0.4 : 1 }}>
              <span style={{ fontSize: 18 }}>🤖</span>
              <span className="th" style={{ fontSize: 14 }}>{atMax ? 'ห้องเต็มแล้ว' : 'เพิ่มบอท'}</span>
            </button>
          )}
        </div>
      </div>

      {/* bottom action bar */}
      <div className="pad-x" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 12, paddingBottom: 26,
           background: 'linear-gradient(transparent, var(--bg) 32%)' }}>
        <div className="row gap10">
          <button className={'btn ' + (meReady ? 'btn-glass' : 'btn-accent')} style={{ flex: '0 0 auto', width: 120 }} onClick={toggleMe}>
            {meReady ? <><Icon name="check" size={18} stroke={3} /> พร้อม</> : 'กดพร้อม'}
          </button>
          <button className="btn btn-primary" style={{ flex: 1 }} disabled={!canStart} onClick={() => canStart && go('game')}>
            <span className="sheen" />
            <span className="th" style={{ fontWeight: 800 }}>
              {!enough ? `ต้องการอีก ${minP - players.length} คน` : !allReady ? `รอพร้อม (${readyCount}/${players.length})` : 'เริ่มเกม'}
            </span>
            {canStart && <Icon name="arrowR" size={20} stroke={2.6} />}
          </button>
        </div>
        <div className="tiny center row" style={{ marginTop: 8, opacity: 0.7, justifyContent: 'center', textAlign: 'center' }}>
          {!amHost ? 'รอหัวห้องเริ่มเกม'
            : !enough ? `เกมนี้ต้องการอย่างน้อย ${minP} คน`
            : !allReady ? 'รอให้ทุกคนกดพร้อม'
            : 'ทุกคนพร้อมแล้ว — เริ่มได้เลย!'}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LobbyScreen });
