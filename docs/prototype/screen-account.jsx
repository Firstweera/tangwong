// screen-account.jsx — account management sheet (edit name / mascot / link auth / logout)

const ACCT_MASCOTS = ['fox', 'cat', 'owl', 'raccoon', 'panda', 'rabbit', 'bear', 'tiger', 'frog', 'koala', 'lion', 'deer'];

const PROVIDER_META = {
  google: { label: 'Google', bg: '#fff', fg: '#1f1f1f',
    glyph: <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.5 12.2c0-.7-.06-1.4-.18-2H12v3.9h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2-1.9 3.3-4.7 3.3-7.9z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .65-2.2 1-3.8 1-2.9 0-5.4-2-6.3-4.6H2v2.8A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.7 14c-.23-.66-.36-1.37-.36-2.1s.13-1.43.36-2.1V7H2a11 11 0 0 0 0 9.9z"/><path fill="#EA4335" d="M12 5.3c1.6 0 3 .56 4.2 1.65l3-3A11 11 0 0 0 2 7l3.7 2.8C6.6 7.2 9.1 5.3 12 5.3z"/></svg> },
  apple: { label: 'Apple', bg: '#000', fg: '#fff',
    glyph: <svg width="17" height="17" viewBox="0 0 24 24"><path fill="#fff" d="M16.4 12.6c0-2.2 1.8-3.3 1.9-3.4-1-1.5-2.6-1.7-3.2-1.7-1.4-.14-2.7.8-3.3.8s-1.7-.8-2.9-.78c-1.5.02-2.9.87-3.6 2.2-1.6 2.7-.4 6.7 1.1 8.9.74 1.07 1.6 2.3 2.8 2.25 1.1-.04 1.5-.72 2.9-.72s1.7.72 2.9.7c1.2-.02 2-1.1 2.7-2.17.85-1.25 1.2-2.45 1.2-2.5-.03-.02-2.3-.9-2.3-3.6zM14.2 5.9c.6-.74 1-1.77.9-2.8-.86.03-1.9.57-2.5 1.3-.56.64-1 1.7-.9 2.7.96.07 1.94-.5 2.5-1.2z"/></svg> },
};

function AccountSheet({ onClose, onSaved, onLogout, showToast }) {
  const [name, setName] = useState(ME.name === 'คุณ' ? '' : ME.name);
  const [mascot, setMascot] = useState(ME.mascot);
  const [provider, setProvider] = useState(ME.provider || null);
  const isGuest = !provider;

  const link = (p) => {
    setProvider(p);
    ME.provider = p; ME.guest = false;
    showToast(`เชื่อมบัญชี ${PROVIDER_META[p].label} แล้ว`, '🔗');
  };

  const save = () => {
    ME.name = name.trim() || 'ผู้เล่นใหม่';
    ME.mascot = mascot;
    ME.provider = provider;
    ME.guest = !provider;
    onSaved && onSaved();
    showToast('บันทึกโปรไฟล์แล้ว', '✅');
    onClose();
  };

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 80, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={onClose} />
      <div className="card-solid rise" style={{ position: 'relative', borderRadius: '26px 26px 0 0', maxHeight: '92%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* grabber + title */}
        <div className="row between" style={{ padding: '14px 18px 6px' }}>
          <div style={{ width: 32 }} />
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border-2)' }} />
          <button className="row center tap" style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--surface-2)' }} onClick={onClose}><Icon name="x" size={16} /></button>
        </div>
        <h2 className="th h2 pad-x" style={{ fontSize: 20, paddingBottom: 6 }}>บัญชีของฉัน</h2>

        <div className="scroll" style={{ padding: '8px 20px 6px' }}>
          {/* live preview */}
          <div className="col center" style={{ marginBottom: 18 }}>
            <div className="pop" key={mascot}><Avatar who={{ mascot }} size={88} ring="var(--brass-1)" /></div>
            <span className="th h2" style={{ fontSize: 18, marginTop: 12 }}>{name.trim() || 'ผู้เล่นใหม่'}</span>
            <span className="tiny" style={{ fontWeight: 700, marginTop: 2, color: isGuest ? 'var(--accent)' : '#34D17E' }}>
              {isGuest ? '🎭 บัญชีผู้เยี่ยมชม' : `● เชื่อมกับ ${PROVIDER_META[provider].label}`}
            </span>
          </div>

          {/* name */}
          <span className="eyebrow">ชื่อเล่น · nickname</span>
          <div className="card row" style={{ padding: '0 16px', height: 54, alignItems: 'center', margin: '10px 0 20px' }}>
            <input value={name} onChange={e => setName(e.target.value.slice(0, 16))} maxLength={16}
              placeholder="ตั้งชื่อเล่น" className="th"
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 16, fontWeight: 700 }} />
            <span className="tiny mono" style={{ opacity: 0.6 }}>{name.length}/16</span>
          </div>

          {/* mascot */}
          <span className="eyebrow">มาสคอต · icon</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 9, margin: '12px 0 22px' }}>
            {ACCT_MASCOTS.map(k => {
              const active = k === mascot;
              return (
                <button key={k} className="tap row center" onClick={() => setMascot(k)}
                  style={{ aspectRatio: '1', borderRadius: 14, background: active ? 'var(--grad-soft)' : 'var(--surface-2)',
                           border: active ? '2px solid var(--primary)' : '1px solid var(--border)', position: 'relative' }}>
                  <Avatar who={{ mascot: k }} size={34} />
                  {active && <span className="row center" style={{ position: 'absolute', top: -5, right: -5, width: 19, height: 19, borderRadius: '50%', background: 'var(--primary)', color: '#fff', border: '2px solid var(--surface-solid)' }}><Icon name="check" size={11} stroke={3.5} /></span>}
                </button>
              );
            })}
          </div>

          {/* account linking */}
          <span className="eyebrow">บัญชี · account</span>
          <div className="col gap10" style={{ margin: '12px 0 4px' }}>
            {isGuest ? (
              <>
                <div className="row gap8" style={{ alignItems: 'flex-start', padding: '10px 13px', borderRadius: 13,
                     background: 'rgba(255,159,67,0.12)', border: '1px solid rgba(255,159,67,0.28)' }}>
                  <span style={{ fontSize: 15 }}>⚠️</span>
                  <span className="th tiny" style={{ color: 'var(--accent)', fontWeight: 700, lineHeight: 1.45 }}>ผูกบัญชีเพื่อบันทึกความคืบหน้า สถิติ และเล่นข้ามอุปกรณ์ได้</span>
                </div>
                {Object.keys(PROVIDER_META).map(p => {
                  const m = PROVIDER_META[p];
                  return (
                    <button key={p} className="btn btn-lg btn-block tap" onClick={() => link(p)}
                      style={{ background: m.bg, color: m.fg, border: p === 'google' ? '1px solid var(--border-2)' : 'none' }}>
                      {m.glyph}<span className="th" style={{ fontWeight: 700 }}>ผูกกับ {m.label}</span>
                    </button>
                  );
                })}
              </>
            ) : (
              <div className="card row between" style={{ padding: '12px 14px' }}>
                <div className="row gap10" style={{ alignItems: 'center' }}>
                  <div className="row center" style={{ width: 36, height: 36, borderRadius: 11, background: PROVIDER_META[provider].bg, border: '1px solid var(--border)' }}>{PROVIDER_META[provider].glyph}</div>
                  <div className="col" style={{ gap: 1 }}>
                    <span className="th h3" style={{ fontSize: 14 }}>{PROVIDER_META[provider].label}</span>
                    <span className="tiny" style={{ color: '#34D17E', fontWeight: 700 }}>● เชื่อมต่อแล้ว</span>
                  </div>
                </div>
                <Icon name="check" size={20} stroke={3} style={{ color: '#34D17E' }} />
              </div>
            )}
          </div>
        </div>

        {/* sticky actions */}
        <div className="pad-x col gap10" style={{ paddingTop: 12, paddingBottom: 26, borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-primary btn-lg btn-block tap" onClick={save}>
            <span className="sheen" /><span className="th" style={{ fontWeight: 800 }}>บันทึก</span>
          </button>
          <button className="row center gap8 tap" onClick={() => { onClose(); onLogout && onLogout(); }}
            style={{ height: 44, color: 'var(--evil)', fontWeight: 700 }}>
            <Icon name="exit" size={18} /><span className="th">ออกจากระบบ</span>
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { AccountSheet });
