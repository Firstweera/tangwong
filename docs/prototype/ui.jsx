// ui.jsx — shared primitives: Icon, Avatar, AvatarStack, Logo, GameCard, QuestTrack, Confetti, Toast

const { useState, useEffect, useRef } = React;

/* ───────────────── Icons (stroke, 24-grid, currentColor) ───────────────── */
const ICONS = {
  home:    'M3 10.5 12 3l9 7.5M5 9.5V20a1 1 0 0 0 1 1h3v-6h6v6h3a1 1 0 0 0 1-1V9.5',
  dice:    'M4 8.5 12 4l8 4.5v7L12 20l-8-4.5z M12 4v16 M4 8.5 12 13l8-4.5',
  users:   'M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19 M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7 M20 19v-1.4a3.5 3.5 0 0 0-2.6-3.4 M15.5 4.2a3.5 3.5 0 0 1 0 6.6',
  user:    'M18 20v-1.5A4.5 4.5 0 0 0 13.5 14h-3A4.5 4.5 0 0 0 6 18.5V20 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  copy:    'M9 9.5A1.5 1.5 0 0 1 10.5 8h7A1.5 1.5 0 0 1 19 9.5v8a1.5 1.5 0 0 1-1.5 1.5h-7A1.5 1.5 0 0 1 9 17.5z M14.5 8V6.5A1.5 1.5 0 0 0 13 5H6.5A1.5 1.5 0 0 0 5 6.5v7A1.5 1.5 0 0 0 6.5 15H8',
  mic:     'M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3 M6 11a6 6 0 0 0 12 0 M12 17v4 M9 21h6',
  chat:    'M20 12a7 7 0 0 1-7 7H8l-4 2 1.2-3.6A7 7 0 1 1 20 12z',
  crown:   'M4 8l3.5 3L12 5l4.5 6L20 8l-1.5 9H5.5z',
  check:   'M5 12.5 10 17.5 19.5 7',
  x:       'M6 6l12 12 M18 6 6 18',
  chevR:   'M9 5l7 7-7 7',
  chevL:   'M15 5l-7 7 7 7',
  share:   'M16 6l-4-4-4 4 M12 2v13 M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7',
  plus:    'M12 5v14 M5 12h14',
  settings:'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6 M19.4 13.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-2.7-1.1l-.1.1A2 2 0 1 1 4.5 17l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.1-2.7L4.1 7A2 2 0 1 1 7 4.2l.1.1a1.6 1.6 0 0 0 1.8.3H9A1.6 1.6 0 0 0 10 3.1V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1A2 2 0 1 1 19.5 7l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1h.1a2 2 0 1 1 0 4H21a1.6 1.6 0 0 0-1.5 1z',
  trophy:  'M7 4h10v4a5 5 0 0 1-10 0z M7 6H4v1a3 3 0 0 0 3 3 M17 6h3v1a3 3 0 0 1-3 3 M12 13v4 M8.5 21h7 M9.5 21a2.5 2.5 0 0 1 5 0',
  clock:   'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18 M12 7v5l3 2',
  shield:  'M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z',
  sword:   'M14.5 3.5 21 3l-.5 6.5-9 9-3 .5.5-3z M5 16l3 3 M3 21l3-3',
  bell:    'M18 15V10a6 6 0 0 0-12 0v5l-2 3h16z M9.5 21a2.5 2.5 0 0 0 5 0',
  search:  'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14 M20 20l-4-4',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z M19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z',
  lock:    'M7 11V8a5 5 0 0 1 10 0v3 M5 11h14v9H5z',
  send:    'M4 12 21 4l-5 17-4-7-7-2z M11 14l5-6',
  qr:      'M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h2v2h-2z M18 14h2v2h-2z M14 18h2v2h-2z M18 18h2v2h-2z',
  arrowR:  'M5 12h14 M13 6l6 6-6 6',
  fire:    'M12 3c1 3-1 4-1 6 0 1.5 1 2.5 1 2.5S15 9 14 6c2 1.5 4 4 4 7a6 6 0 1 1-12 0c0-2 1-3.5 2-4.5 0 1.5 1 2 1 2 0-3 1-5 3-7.5z',
  eye:     'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6',
  star:    'M12 3l2.6 6 6.4.5-4.9 4.2 1.5 6.3L12 16.8 6.4 20l1.5-6.3L3 9.5 9.4 9z',
  exit:    'M14 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2 M9 12h11 M17 8l4 4-4 4',
  flag:    'M5 21V4 M5 5h11l-1.5 3L16 11H5',
  vote:    'M9 12l2 2 4-4 M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18',
  book:    'M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15.5a1.5 1.5 0 0 0-1.5-1.5H4z M20 5.5A1.5 1.5 0 0 0 18.5 4H13v15.5a1.5 1.5 0 0 1 1.5-1.5H20z',
  more:    'M5 12h.01 M12 12h.01 M19 12h.01',
};

function Icon({ name, size = 22, stroke = 2, fill = 'none', style }) {
  const d = ICONS[name];
  return (
    <svg className="ic" width={size} height={size} viewBox="0 0 24 24" fill={fill}
         stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={style}>
      {d.split(' M').map((seg, i) => <path key={i} d={i === 0 ? seg : 'M' + seg} />)}
    </svg>
  );
}

/* ───────────────── Avatar ───────────────── */
function Avatar({ who, size = 44, ring, dot, crown, bot, faded, style, onClick }) {
  const m = MASCOTS[who?.mascot] || MASCOTS.fox;
  return (
    <div className={'av' + (ring ? ' av-ring' : '')}
         onClick={onClick}
         style={{
           width: size, height: size, fontSize: size * 0.52,
           background: `linear-gradient(140deg, ${m.g[0]}, ${m.g[1]})`,
           '--ring': ring === true ? 'var(--secondary)' : ring,
           opacity: faded ? 0.4 : 1, cursor: onClick ? 'pointer' : 'default',
           ...style,
         }}>
      <span className="em">{m.em}</span>
      {crown && <span className="crown">👑</span>}
      {bot && <span style={{ position: 'absolute', bottom: -2, right: -2, width: '38%', height: '38%', minWidth: 14, minHeight: 14,
              borderRadius: '50%', background: 'var(--surface-solid)', border: '1.5px solid var(--border-2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.24 }}>🤖</span>}
      {dot && !bot && <span className="dot-on" />}
    </div>
  );
}

function AvatarStack({ people, size = 30, max = 4 }) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  return (
    <div className="row" style={{ paddingLeft: size * 0.32 }}>
      {shown.map((p, i) => (
        <div key={p.id} style={{ marginLeft: -size * 0.32, zIndex: 10 - i,
             borderRadius: '50%', boxShadow: '0 0 0 2.5px var(--surface-solid)' }}>
          <Avatar who={p} size={size} />
        </div>
      ))}
      {extra > 0 && (
        <div className="row center" style={{ marginLeft: -size * 0.32, width: size, height: size,
             borderRadius: '50%', background: 'var(--surface-3)', boxShadow: '0 0 0 2.5px var(--surface-solid)',
             fontSize: size * 0.34, fontWeight: 700, color: 'var(--muted)', zIndex: 1 }}>
          +{extra}
        </div>
      )}
    </div>
  );
}

/* ───────────────── Logo ───────────────── */
function Logo({ size = 34, showWord = true }) {
  return (
    <div className="row gap10" style={{ alignItems: 'center' }}>
      <div style={{ width: size, height: size, borderRadius: size * 0.32, background: 'var(--grad)',
           position: 'relative', boxShadow: '0 6px 16px -6px rgba(109,94,249,0.8)', flexShrink: 0 }}>
        {/* three dots gathered in a circle = ตั้งวง */}
        <svg viewBox="0 0 36 36" width={size} height={size} style={{ position: 'absolute', inset: 0 }}>
          <circle cx="18" cy="11" r="3.1" fill="#fff" />
          <circle cx="11.2" cy="22" r="3.1" fill="#fff" fillOpacity="0.92" />
          <circle cx="24.8" cy="22" r="3.1" fill="#fff" fillOpacity="0.82" />
        </svg>
      </div>
      {showWord && (
        <div className="col" style={{ lineHeight: 1 }}>
          <span className="th" style={{ fontSize: size * 0.5, fontWeight: 800, letterSpacing: '-0.01em' }}>ตั้งวง</span>
          <span style={{ fontSize: size * 0.27, fontWeight: 700, letterSpacing: '0.18em', color: 'var(--muted)', marginTop: 2 }}>TANGWONG</span>
        </div>
      )}
    </div>
  );
}

/* ───────────────── GameCard ───────────────── */
function GameCard({ game, onClick, onRules, height = 168, big }) {
  return (
    <div className="gamecard" onClick={onClick} style={{ height }}>
      <div className="glow" style={{ background: `linear-gradient(150deg, ${game.g[0]}, ${game.g[1]})` }} />
      <div className="grain" />
      <div style={{ position: 'absolute', right: -14, bottom: -18, fontSize: big ? 130 : 96, opacity: 0.9,
           filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.3))', transform: 'rotate(-8deg)' }}>{game.emoji}</div>
      <div className="col" style={{ position: 'relative', height: '100%', padding: 16, justifyContent: 'space-between' }}>
        <div className="row between" style={{ alignItems: 'flex-start', gap: 8 }}>
          <span className="th" style={{ fontSize: 11.5, fontWeight: 700, padding: '5px 10px', borderRadius: 9,
                background: 'rgba(0,0,0,0.22)', backdropFilter: 'blur(6px)', color: 'rgba(255,255,255,0.95)' }}>{game.th_tag}</span>
          {onRules && game.rules && (
            big ? (
              <button className="th tap row gap6" onClick={(e) => { e.stopPropagation(); onRules(game); }}
                style={{ alignItems: 'center', flexShrink: 0, fontSize: 12.5, fontWeight: 700, color: '#fff',
                         padding: '6px 12px', borderRadius: 11, background: 'rgba(0,0,0,0.28)',
                         border: '1px solid rgba(255,255,255,0.22)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
                <Icon name="book" size={15} /> อ่านกฎ
              </button>
            ) : (
              <button className="tap row center" onClick={(e) => { e.stopPropagation(); onRules(game); }} aria-label="อ่านกฎ"
                style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 11, color: '#fff',
                         background: 'rgba(0,0,0,0.28)', border: '1px solid rgba(255,255,255,0.22)',
                         backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
                <Icon name="book" size={16} />
              </button>
            )
          )}
        </div>
        <div>
          <div className="th" style={{ fontSize: big ? 30 : 23, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', textShadow: '0 2px 10px rgba(0,0,0,0.25)' }}>{game.th}</div>
          <div className="row gap10" style={{ marginTop: 6, color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: 600 }}>
            <span className="row gap6" style={{ alignItems: 'center' }}><Icon name="users" size={14} /> {game.players}</span>
            <span style={{ opacity: 0.5 }}>·</span>
            <span className="row gap6" style={{ alignItems: 'center' }}><Icon name="clock" size={14} /> {game.mins}'</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────── RulesSheet ───────────────── */
function RulesSheet({ game, onClose, onPlay }) {
  const r = game.rules;
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 75, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={onClose} />
      <div className="card-solid rise" style={{ position: 'relative', borderRadius: '26px 26px 0 0', maxHeight: '88%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* cover header */}
        <div style={{ position: 'relative', padding: '20px 18px 18px', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(150deg, ${game.g[0]}, ${game.g[1]})` }} />
          <div className="grain" style={{ position: 'absolute', inset: 0 }} />
          <div style={{ position: 'absolute', right: -10, bottom: -24, fontSize: 120, opacity: 0.9, transform: 'rotate(-8deg)', filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.3))' }}>{game.emoji}</div>
          <div className="row between" style={{ position: 'relative', alignItems: 'flex-start' }}>
            <span className="th" style={{ fontSize: 11.5, fontWeight: 700, padding: '5px 10px', borderRadius: 9, background: 'rgba(0,0,0,0.24)', color: '#fff' }}>{game.th_tag}</span>
            <button className="row center tap" style={{ width: 34, height: 34, borderRadius: 11, background: 'rgba(0,0,0,0.28)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }} onClick={onClose}><Icon name="x" size={17} /></button>
          </div>
          <div className="th" style={{ position: 'relative', fontSize: 30, fontWeight: 800, color: '#fff', marginTop: 14, letterSpacing: '-0.02em', textShadow: '0 2px 10px rgba(0,0,0,0.25)' }}>{game.th}</div>
          <div className="row gap10" style={{ position: 'relative', marginTop: 6, color: 'rgba(255,255,255,0.92)', fontSize: 12.5, fontWeight: 600 }}>
            <span className="row gap6" style={{ alignItems: 'center' }}><Icon name="users" size={14} /> {game.players} คน</span>
            <span style={{ opacity: 0.5 }}>·</span>
            <span className="row gap6" style={{ alignItems: 'center' }}><Icon name="clock" size={14} /> {game.mins} นาที</span>
          </div>
        </div>

        {/* scrollable body */}
        <div className="scroll" style={{ padding: '18px 18px 8px' }}>
          {/* objective */}
          <div className="card" style={{ padding: 14, marginBottom: 20 }}>
            <div className="row gap8" style={{ alignItems: 'center', marginBottom: 7 }}>
              <Icon name="trophy" size={17} style={{ color: 'var(--accent)' }} />
              <span className="eyebrow">เป้าหมาย · objective</span>
            </div>
            <p className="th body" style={{ fontSize: 13.5, color: 'var(--text)' }}>{r.goal}</p>
          </div>

          {/* how to play */}
          <span className="eyebrow">วิธีเล่น · how to play</span>
          <div className="col gap10" style={{ marginTop: 12, marginBottom: 20 }}>
            {r.steps.map((s, i) => (
              <div key={i} className="row gap12" style={{ alignItems: 'flex-start' }}>
                <div className="row center" style={{ position: 'relative', width: 40, height: 40, borderRadius: 13, background: 'var(--surface-3)', fontSize: 20, flexShrink: 0 }}>
                  {s[0]}
                  <span className="mono" style={{ position: 'absolute', top: -5, left: -5, width: 19, height: 19, borderRadius: '50%', background: 'var(--grad)', color: '#fff', fontSize: 10.5, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                </div>
                <div className="col" style={{ gap: 2, paddingTop: 2, flex: 1 }}>
                  <span className="th h3" style={{ fontSize: 14.5 }}>{s[1]}</span>
                  <span className="th tiny" style={{ lineHeight: 1.45 }}>{s[2]}</span>
                </div>
              </div>
            ))}
          </div>

          {/* tips */}
          {r.tips && (
            <>
              <span className="eyebrow">เคล็ดลับ · tips</span>
              <div className="col gap8" style={{ marginTop: 10 }}>
                {r.tips.map((tp, i) => (
                  <div key={i} className="row gap8" style={{ alignItems: 'flex-start', padding: '10px 13px', borderRadius: 13, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                    <Icon name="sparkle" size={15} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }} />
                    <span className="th tiny" style={{ color: 'var(--text)', lineHeight: 1.45 }}>{tp}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* sticky play CTA */}
        <div className="pad-x" style={{ paddingTop: 12, paddingBottom: 24, borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-primary btn-lg btn-block" onClick={() => onPlay && onPlay(game)}>
            <span className="sheen" />
            <Icon name="arrowR" size={20} stroke={2.6} /> <span className="th" style={{ fontWeight: 800 }}>เล่นเกมนี้</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────────────── QuestTrack ───────────────── */
function QuestTrack({ results, current }) {
  // results: array like ['success','fail',null,null,null]; current index
  return (
    <div className="quest-track">
      {QUESTS.map((q, i) => {
        const r = results[i];
        const cls = r === 'success' ? 'success' : r === 'fail' ? 'fail' : i === current ? 'current' : '';
        return (
          <div key={i} className={'mcoin ' + cls}>
            {r === 'success' ? <Icon name="shield" size={17} fill="currentColor" stroke={0} />
              : r === 'fail' ? <Icon name="x" size={15} stroke={3.5} />
              : q.size}
            {q.fails === 2 && !r && <span style={{ position: 'absolute', bottom: -15, fontSize: 8.5, fontWeight: 800, color: 'var(--evil)' }}>2✗</span>}
          </div>
        );
      })}
    </div>
  );
}

/* ───────────────── Confetti ───────────────── */
function Confetti({ count = 46, colors = ['#6D5EF9', '#00D4FF', '#FF9F43', '#34D17E', '#FF5C6C', '#fff'] }) {
  const pieces = useRef([...Array(count)].map(() => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    dur: 1.6 + Math.random() * 1.6,
    color: colors[(Math.random() * colors.length) | 0],
    rot: Math.random() * 360,
    w: 6 + Math.random() * 6,
  }))).current;
  return (
    <div className="confetti">
      {pieces.map((p, i) => (
        <i key={i} style={{ left: p.left + '%', background: p.color, animationDelay: p.delay + 's',
             animationDuration: p.dur + 's', width: p.w, height: p.w * 1.5, transform: `rotate(${p.rot}deg)` }} />
      ))}
    </div>
  );
}

/* ───────────────── Toast ───────────────── */
function useToast() {
  const [toast, setToast] = useState(null);
  const show = (msg, icon) => {
    setToast({ msg, icon });
    clearTimeout(show._t);
    show._t = setTimeout(() => setToast(null), 1900);
  };
  const node = toast && (
    <div className="toast" key={toast.msg}>
      {toast.icon && <span style={{ fontSize: 15 }}>{toast.icon}</span>}
      <span>{toast.msg}</span>
    </div>
  );
  return [node, show];
}

/* ───────────────── Tabletop props: CardBack, CardFan, Token, Die ───────────────── */
function CardBack({ w = 46, h = 64, style }) {
  return (
    <div className="pcard pcard-back" style={{ width: w, height: h, ...style }}>
      <div className="pcard-emblem">
        <svg viewBox="0 0 36 36" width="60%" height="60%">
          <circle cx="18" cy="11" r="3.4" fill="#fff" />
          <circle cx="11.2" cy="22" r="3.4" fill="#fff" fillOpacity="0.9" />
          <circle cx="24.8" cy="22" r="3.4" fill="#fff" fillOpacity="0.8" />
        </svg>
      </div>
    </div>
  );
}

function CardFan({ count = 5, w = 44, h = 62, spread = 22, rise = 9 }) {
  const mid = (count - 1) / 2;
  return (
    <div className="card-fan" style={{ width: w, height: h + rise + 16 }}>
      {[...Array(count)].map((_, i) => {
        const off = i - mid;
        return <CardBack key={i} w={w} h={h} style={{
          transform: `translateX(-50%) rotate(${off * spread / count * 1.6}deg) translateY(${Math.abs(off) * rise}px)`,
          zIndex: i, top: 4,
        }} />;
      })}
    </div>
  );
}

function Token({ kind = 'good', size = 44, children, style }) {
  const glyph = children ?? (kind === 'good' ? '✓' : kind === 'evil' ? '✕' : '');
  return (
    <div className={'token tk-' + kind} style={{ width: size, height: size, fontSize: size * 0.42, ...style }}>
      <span>{glyph}</span>
    </div>
  );
}

const DIE_PIPS = {
  1: [[50, 50]], 2: [[30, 30], [70, 70]], 3: [[28, 28], [50, 50], [72, 72]],
  4: [[30, 30], [70, 30], [30, 70], [70, 70]], 5: [[30, 30], [70, 30], [50, 50], [30, 70], [70, 70]],
  6: [[30, 25], [30, 50], [30, 75], [70, 25], [70, 50], [70, 75]],
};
function Die({ face = 5, size = 40, style }) {
  return (
    <div className="die" style={{ width: size, height: size, ...style }}>
      {DIE_PIPS[face].map((p, i) => <i key={i} style={{ left: p[0] + '%', top: p[1] + '%', width: size * 0.16, height: size * 0.16 }} />)}
    </div>
  );
}

/* ───────────────── ComingSoonCard ───────────────── */
function ComingSoonCard({ game, height = 164, onNotify }) {
  return (
    <div className="gamecard" style={{ height, cursor: 'default' }}>
      <div className="glow" style={{ background: `linear-gradient(150deg, ${game.g[0]}, ${game.g[1]})`, filter: 'saturate(0.55)', opacity: 0.7 }} />
      <div className="grain" />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,11,20,0.42)', backdropFilter: 'blur(1px)' }} />
      <div style={{ position: 'absolute', right: -14, bottom: -18, fontSize: 96, opacity: 0.5,
           filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.3)) grayscale(0.3)', transform: 'rotate(-8deg)' }}>{game.emoji}</div>
      <div className="col" style={{ position: 'relative', height: '100%', padding: 16, justifyContent: 'space-between' }}>
        <div className="row between" style={{ alignItems: 'flex-start', gap: 8 }}>
          <span className="th" style={{ fontSize: 11.5, fontWeight: 700, padding: '5px 10px', borderRadius: 9,
                background: 'rgba(0,0,0,0.3)', color: 'rgba(255,255,255,0.9)' }}>{game.th_tag}</span>
          <span className="th row gap6" style={{ alignItems: 'center', fontSize: 10.5, fontWeight: 800, letterSpacing: '0.02em', padding: '5px 9px', borderRadius: 8,
                background: 'rgba(0,0,0,0.34)', color: '#fff', border: '1px solid rgba(255,255,255,0.28)', backdropFilter: 'blur(6px)' }}>
            <Icon name="lock" size={12} /> {game.when}
          </span>
        </div>
        <div className="row between" style={{ alignItems: 'flex-end' }}>
          <div>
            <div className="th" style={{ fontSize: 23, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>{game.th}</div>
            <div className="row gap10" style={{ marginTop: 6, color: 'rgba(255,255,255,0.82)', fontSize: 12, fontWeight: 600 }}>
              <span className="row gap6" style={{ alignItems: 'center' }}><Icon name="users" size={14} /> {game.players}</span>
              <span style={{ opacity: 0.5 }}>·</span>
              <span className="row gap6" style={{ alignItems: 'center' }}><Icon name="clock" size={14} /> {game.mins}'</span>
            </div>
          </div>
          {onNotify && (
            <button className="th tap row gap6" onClick={(e) => { e.stopPropagation(); onNotify(game); }}
              style={{ alignItems: 'center', flexShrink: 0, fontSize: 12, fontWeight: 700, color: '#fff',
                       padding: '8px 12px', borderRadius: 11, background: 'rgba(255,255,255,0.16)',
                       border: '1px solid rgba(255,255,255,0.28)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
              <Icon name="bell" size={14} /> เตือนฉัน
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ICONS, Icon, Avatar, AvatarStack, Logo, GameCard, ComingSoonCard, RulesSheet, QuestTrack, Confetti, useToast, CardBack, CardFan, Token, Die });
