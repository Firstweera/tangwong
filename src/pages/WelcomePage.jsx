// WelcomePage.jsx — first-run entry: sign in (OAuth) or continue as a guest
// (pick a mascot + nickname). Ported from the prototype screen-welcome, wired to
// the production guest identity. OAuth is previewed (coming soon) until accounts
// land in Epic 9; the guest path is fully functional today.
import { useState } from 'react';
import { Logo, Avatar, Icon } from '../components/ui';
import { MASCOTS } from '../data';

// Brand glyphs — colored/filled marks, not part of the stroke icon set.
function BrandGlyph({ kind }) {
  if (kind === 'google') return (
    <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.5 12.2c0-.7-.06-1.4-.18-2H12v3.9h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2-1.9 3.3-4.7 3.3-7.9z" /><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .65-2.2 1-3.8 1-2.9 0-5.4-2-6.3-4.6H2v2.8A11 11 0 0 0 12 23z" /><path fill="#FBBC05" d="M5.7 14c-.23-.66-.36-1.37-.36-2.1s.13-1.43.36-2.1V7H2a11 11 0 0 0 0 9.9z" /><path fill="#EA4335" d="M12 5.3c1.6 0 3 .56 4.2 1.65l3-3A11 11 0 0 0 2 7l3.7 2.8C6.6 7.2 9.1 5.3 12 5.3z" /></svg>
  );
  return ( // apple
    <svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M16.4 12.6c0-2.2 1.8-3.3 1.9-3.4-1-1.5-2.6-1.7-3.2-1.7-1.4-.14-2.7.8-3.3.8s-1.7-.8-2.9-.78c-1.5.02-2.9.87-3.6 2.2-1.6 2.7-.4 6.7 1.1 8.9.74 1.07 1.6 2.3 2.8 2.25 1.1-.04 1.5-.72 2.9-.72s1.7.72 2.9.7c1.2-.02 2-1.1 2.7-2.17.85-1.25 1.2-2.45 1.2-2.5-.03-.02-2.3-.9-2.3-3.6zM14.2 5.9c.6-.74 1-1.77.9-2.8-.86.03-1.9.57-2.5 1.3-.56.64-1 1.7-.9 2.7.96.07 1.94-.5 2.5-1.2z" /></svg>
  );
}

// Mascot choices for the guest setup (all keys in MASCOTS).
const GUEST_MASCOTS = ['fox', 'cat', 'owl', 'raccoon', 'panda', 'rabbit', 'bear', 'tiger', 'frog', 'koala', 'lion', 'deer'];

/**
 * WelcomePage
 * @param onGuest  ({ mascot, name }) => void — completes guest onboarding
 * @param onOAuth  (provider) => void — sign-in attempt (previewed for now)
 */
export default function WelcomePage({ onGuest, onOAuth }) {
  const [step, setStep] = useState('auth');   // 'auth' | 'guest'
  const [mascot, setMascot] = useState('fox');
  const [name, setName] = useState('');

  const oauth = [
    ['google', 'เข้าสู่ระบบด้วย Google', '#fff', '#1f1f1f'],
    ['apple', 'เข้าสู่ระบบด้วย Apple', '#000', '#fff'],
  ];

  const Backdrop = () => (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', top: -80, left: '50%', transform: 'translateX(-50%)', width: 460, height: 360,
        background: 'radial-gradient(circle, var(--primary), transparent 62%)', opacity: 0.18, filter: 'blur(10px)',
      }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)', backgroundSize: '28px 28px', maskImage: 'linear-gradient(#000, transparent 78%)', opacity: 0.28 }} />
    </div>
  );

  if (step === 'auth') return (
    <div className="screen screen-anim" style={{ display: 'flex', flexDirection: 'column' }}>
      <Backdrop />
      {/* brand block */}
      <div className="col" style={{ flex: 1, justifyContent: 'center', padding: '28px 48px 0 24px', position: 'relative' }}>
        <div className="command-card" style={{ padding: 20, minHeight: 360 }}>
          <div className="row between" style={{ alignItems: 'flex-start' }}>
            <Logo variant="wordmark" size={44} />
          </div>
          <div className="col center" style={{ minHeight: 210, justifyContent: 'center' }}>
            <div className="pop"><Logo variant="illustration" size={210} /></div>
          </div>
          <h1 className="th page-title" style={{ fontSize: 29 }}>เปิดวงเกม<br />กับเพื่อน</h1>
          <p className="th page-subtitle">
            ห้องพร้อมแชต โหวต และบทบาทลับ<br />อ่านสถานะเกมง่ายบนมือถือ
          </p>
        </div>
      </div>

      {/* auth block */}
      <div className="col gap10" style={{ padding: '20px 48px 32px 24px', position: 'relative' }}>
        {oauth.map(([kind, label, bg, fg]) => (
          <button key={kind} className="btn btn-lg btn-block" onClick={() => onOAuth?.(kind)}
            style={{ background: bg, color: fg, border: kind === 'google' ? '1px solid var(--border-2)' : 'none', boxShadow: '0 8px 22px -12px rgba(0,0,0,0.6)' }}>
            <BrandGlyph kind={kind} />
            <span className="th" style={{ fontWeight: 700 }}>{label}</span>
          </button>
        ))}

        <div className="row gap12" style={{ alignItems: 'center', margin: '6px 0' }}>
          <div className="divider" style={{ flex: 1 }} />
          <span className="th tiny" style={{ fontWeight: 600, color: 'var(--muted)' }}>หรือ</span>
          <div className="divider" style={{ flex: 1 }} />
        </div>

        <button className="btn btn-glass btn-lg btn-block" onClick={() => setStep('guest')}>
          <span style={{ fontSize: 18 }}>🎭</span>
          <span className="th" style={{ fontWeight: 700 }}>เล่นเลยแบบกั๊ก · Guest</span>
        </button>
        <p className="th tiny" style={{ textAlign: 'center', marginTop: 4, color: 'var(--muted)', lineHeight: 1.5 }}>
          Guest เล่นได้ทันที บัญชีจริงผูกตามมาภายหลัง
        </p>
      </div>
    </div>
  );

  // ── guest setup ──
  return (
    <div className="screen screen-anim" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* top bar */}
      <div className="row pad-x" style={{ paddingTop: 'calc(14px + env(safe-area-inset-top))', paddingBottom: 8 }}>
        <button className="row center" style={{ width: 42, height: 42, borderRadius: 13, background: 'var(--surface-2)', border: '1px solid var(--border)' }} onClick={() => setStep('auth')}>
          <Icon name="chevL" size={20} />
        </button>
      </div>

      <div className="scroll" style={{ padding: '4px 24px 0' }}>
        <h1 className="th page-title">สร้างตัวละคร</h1>
        <p className="th page-subtitle">ชื่อและมาสคอตนี้จะใช้ในห้อง แชต และโต๊ะเกม</p>

        {/* preview */}
        <div className="col center" style={{ margin: '22px 0 18px' }}>
          <div className="pop" key={mascot} style={{ position: 'relative' }}>
            <Avatar who={{ mascot }} size={104} ring="var(--brass-1)" />
          </div>
          <span className="th h2" style={{ fontSize: 19, marginTop: 14 }}>{name.trim() || 'ผู้เล่นใหม่'}</span>
        </div>

        {/* name input */}
        <div className="field-shell" style={{ marginBottom: 20 }}>
          <input value={name} onChange={e => setName(e.target.value.slice(0, 16))} maxLength={16}
            placeholder="ชื่อเล่น · nickname" className="th"
            style={{ fontSize: 16, fontWeight: 700 }} />
          <span className="th tiny mono" style={{ opacity: 0.6 }}>{name.length}/16</span>
        </div>

        {/* mascot picker */}
        <div className="section-head"><span className="section-title th">เลือกมาสคอต</span><span className="section-note">12 ตัวเลือก</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 12, paddingBottom: 130 }}>
          {GUEST_MASCOTS.map(k => {
            const active = k === mascot;
            return (
              <button key={k} className="col center" onClick={() => setMascot(k)}
                style={{
                  aspectRatio: '1', borderRadius: 18, background: active ? 'var(--grad-soft)' : 'var(--surface-2)',
                  border: active ? '2px solid var(--primary)' : '1px solid var(--border)', position: 'relative',
                }}>
                <Avatar who={{ mascot: k }} size={46} />
                {active && <span className="row center" style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%', background: 'var(--primary)', color: '#fff', border: '2px solid var(--surface-solid)' }}><Icon name="check" size={12} stroke={3.5} /></span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* sticky CTA */}
      <div className="pad-x" style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 14,
        paddingBottom: 'calc(30px + env(safe-area-inset-bottom))',
        background: 'linear-gradient(transparent, var(--bg) 34%)',
      }}>
        <button className="btn btn-primary btn-lg btn-block" disabled={!name.trim()}
          onClick={() => onGuest?.({ mascot, name: name.trim() })}>
          <span className="sheen" />
          <span className="th" style={{ fontWeight: 800 }}>เริ่มเล่น</span>
          <Icon name="arrowR" size={20} stroke={2.6} />
        </button>
      </div>
    </div>
  );
}
