// screen-welcome.jsx — entry: OAuth login or guest (pick mascot + name)

// brand glyphs (colored, filled — not part of the stroke icon set)
function BrandGlyph({ kind }) {
  if (kind === 'line') return (
    <svg width="22" height="22" viewBox="0 0 24 24"><path fill="#fff" d="M12 3C6.5 3 2 6.6 2 11.1c0 4 3.6 7.4 8.4 8 .3.07.78.22.9.5.1.26.07.66.03.92l-.14.86c-.04.26-.2 1 .9.55s5.9-3.5 8.05-5.98C21.5 14.3 22 12.8 22 11.1 22 6.6 17.5 3 12 3z"/><path fill="#06C755" d="M9.2 9.1H8.1c-.17 0-.3.14-.3.3v3.2c0 .17.13.3.3.3h1.1c.17 0 .3-.13.3-.3V9.4c0-.16-.13-.3-.3-.3zm6.3 0h-1.1c-.17 0-.3.14-.3.3v1.9l-1.5-2.06s-.04-.05-.06-.06h-.02l-.02-.02h-1.2c-.16 0-.3.14-.3.3v3.2c0 .17.14.3.3.3h1.1c.17 0 .3-.13.3-.3v-1.9l1.5 2.07c.03.04.06.07.1.09l.04.01h1.16c.16 0 .3-.13.3-.3V9.4c0-.16-.14-.3-.3-.3z"/></svg>
  );
  if (kind === 'google') return (
    <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.5 12.2c0-.7-.06-1.4-.18-2H12v3.9h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2-1.9 3.3-4.7 3.3-7.9z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .65-2.2 1-3.8 1-2.9 0-5.4-2-6.3-4.6H2v2.8A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.7 14c-.23-.66-.36-1.37-.36-2.1s.13-1.43.36-2.1V7H2a11 11 0 0 0 0 9.9z"/><path fill="#EA4335" d="M12 5.3c1.6 0 3 .56 4.2 1.65l3-3A11 11 0 0 0 2 7l3.7 2.8C6.6 7.2 9.1 5.3 12 5.3z"/></svg>
  );
  return ( // apple
    <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#fff" d="M16.4 12.6c0-2.2 1.8-3.3 1.9-3.4-1-1.5-2.6-1.7-3.2-1.7-1.4-.14-2.7.8-3.3.8s-1.7-.8-2.9-.78c-1.5.02-2.9.87-3.6 2.2-1.6 2.7-.4 6.7 1.1 8.9.74 1.07 1.6 2.3 2.8 2.25 1.1-.04 1.5-.72 2.9-.72s1.7.72 2.9.7c1.2-.02 2-1.1 2.7-2.17.85-1.25 1.2-2.45 1.2-2.5-.03-.02-2.3-.9-2.3-3.6zM14.2 5.9c.6-.74 1-1.77.9-2.8-.86.03-1.9.57-2.5 1.3-.56.64-1 1.7-.9 2.7.96.07 1.94-.5 2.5-1.2z"/></svg>
  );
}

const GUEST_MASCOTS = ['fox', 'cat', 'owl', 'raccoon', 'panda', 'rabbit', 'bear', 'tiger', 'frog', 'koala', 'lion', 'deer'];

function WelcomeScreen({ onAuth }) {
  const [step, setStep] = useState('auth');     // auth | guest
  const [mascot, setMascot] = useState('fox');
  const [name, setName] = useState('');

  const oauth = [
    ['google', 'เข้าสู่ระบบด้วย Google', '#fff', '#1f1f1f'],
    ['apple', 'เข้าสู่ระบบด้วย Apple', '#000', '#fff'],
  ];

  /* soft glow backdrop */
  const Backdrop = () => (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)', width: 460, height: 420,
           background: 'radial-gradient(circle, var(--primary), transparent 64%)', opacity: 0.22, filter: 'blur(12px)' }} />
    </div>
  );

  if (step === 'auth') return (
    <div className="screen-anim" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
      <Backdrop />
      {/* brand block */}
      <div className="col center" style={{ flex: 1, justifyContent: 'center', padding: '0 28px', position: 'relative', textAlign: 'center' }}>
        <div className="pop"><Logo variant="illustration" size={248} /></div>
        <div style={{ marginTop: 4 }}><Logo variant="wordmark" size={46} /></div>
        <p className="th body" style={{ fontSize: 14.5, marginTop: 14, maxWidth: 280 }}>
          รวมเพื่อน ล้อมวง เล่นบอร์ดเกมปาร์ตี้ด้วยกัน
        </p>
      </div>

      {/* auth block */}
      <div className="col gap10" style={{ padding: '20px 24px 32px', position: 'relative' }}>
        {oauth.map(([kind, label, bg, fg]) => (
          <button key={kind} className="btn btn-lg btn-block tap" onClick={() => onAuth({ provider: kind })}
            style={{ background: bg, color: fg, border: kind === 'google' ? '1px solid var(--border-2)' : 'none', boxShadow: '0 8px 22px -12px rgba(0,0,0,0.6)' }}>
            <BrandGlyph kind={kind} />
            <span className="th" style={{ fontWeight: 700 }}>{label}</span>
          </button>
        ))}

        <div className="row gap12" style={{ alignItems: 'center', margin: '6px 0' }}>
          <div className="divider" style={{ flex: 1 }} />
          <span className="tiny" style={{ fontWeight: 600 }}>หรือ</span>
          <div className="divider" style={{ flex: 1 }} />
        </div>

        <button className="btn btn-glass btn-lg btn-block tap" onClick={() => setStep('guest')}>
          <span style={{ fontSize: 18 }}>🎭</span>
          <span className="th" style={{ fontWeight: 700 }}>เล่นเลยแบบกั๊ก · Guest</span>
        </button>
        <p className="tiny center" style={{ textAlign: 'center', marginTop: 4, opacity: 0.65, lineHeight: 1.5 }}>
          การเข้าใช้งานถือว่ายอมรับเงื่อนไขการใช้บริการ
        </p>
      </div>
    </div>
  );

  // ── guest setup ──
  const m = MASCOTS[mascot];
  return (
    <div className="screen-anim" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
      {/* top bar */}
      <div className="row pad-x pad-top" style={{ paddingBottom: 8 }}>
        <button className="row center tap" style={{ width: 42, height: 42, borderRadius: 13, background: 'var(--surface-2)', border: '1px solid var(--border)' }} onClick={() => setStep('auth')}>
          <Icon name="chevL" size={20} />
        </button>
      </div>

      <div className="scroll" style={{ padding: '4px 24px 0' }}>
        <h1 className="th h1" style={{ fontSize: 28 }}>สร้างตัวละคร</h1>
        <p className="body" style={{ marginTop: 6 }}>เลือกมาสคอตและตั้งชื่อเล่นของคุณ</p>

        {/* preview */}
        <div className="col center" style={{ margin: '22px 0 18px' }}>
          <div className="pop" key={mascot} style={{ position: 'relative' }}>
            <Avatar who={{ mascot }} size={104} ring="var(--brass-1)" />
          </div>
          <span className="th h2" style={{ fontSize: 19, marginTop: 14 }}>{name.trim() || 'ผู้เล่นใหม่'}</span>
        </div>

        {/* name input */}
        <div className="card row" style={{ padding: '0 16px', height: 56, alignItems: 'center', marginBottom: 20 }}>
          <input value={name} onChange={e => setName(e.target.value.slice(0, 16))} maxLength={16}
            placeholder="ชื่อเล่น · nickname" className="th"
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 16, fontWeight: 700 }} />
          <span className="tiny mono" style={{ opacity: 0.6 }}>{name.length}/16</span>
        </div>

        {/* mascot picker */}
        <span className="eyebrow">เลือกมาสคอต · pick your animal</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 12, paddingBottom: 130 }}>
          {GUEST_MASCOTS.map(k => {
            const active = k === mascot;
            return (
              <button key={k} className="tap col center" onClick={() => setMascot(k)}
                style={{ aspectRatio: '1', borderRadius: 18, background: active ? 'var(--grad-soft)' : 'var(--surface-2)',
                         border: active ? '2px solid var(--primary)' : '1px solid var(--border)', position: 'relative' }}>
                <Avatar who={{ mascot: k }} size={46} />
                {active && <span className="row center" style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%', background: 'var(--primary)', color: '#fff', border: '2px solid var(--surface-solid)' }}><Icon name="check" size={12} stroke={3.5} /></span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* sticky CTA */}
      <div className="pad-x" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 14, paddingBottom: 30,
           background: 'linear-gradient(transparent, var(--bg) 34%)' }}>
        <button className="btn btn-primary btn-lg btn-block tap" disabled={!name.trim()}
          onClick={() => onAuth({ provider: 'guest', mascot, name: name.trim() })}>
          <span className="sheen" />
          <span className="th" style={{ fontWeight: 800 }}>เริ่มเล่น</span>
          <Icon name="arrowR" size={20} stroke={2.6} />
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { WelcomeScreen });
