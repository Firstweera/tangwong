// ds.jsx — TangWong Design System reference

function Section({ id, kicker, title, sub, children }) {
  return (
    <section id={id} className="ds-sec">
      <div className="ds-h">{kicker}</div>
      <h2 className="ds-title th">{title}</h2>
      {sub && <p className="ds-sub th">{sub}</p>}
      {children}
    </section>
  );
}

function Tile({ label, children, style }) {
  return (
    <div className="ds-tile" style={style}>
      {label && <div className="ds-tile-label">{label}</div>}
      {children}
    </div>
  );
}

function Swatch({ name, hex, bg, text }) {
  return (
    <div className="sw" style={{ width: 150 }}>
      <div className="sw-chip" style={{ background: bg || hex }}>
        {text && <span style={{ position: 'absolute', left: 12, bottom: 8, color: text, fontWeight: 800, fontSize: 13 }}>Aa</span>}
      </div>
      <div className="sw-meta">
        <div className="sw-name th">{name}</div>
        <div className="sw-hex">{hex}</div>
      </div>
    </div>
  );
}

function Spec({ tok, val, children }) {
  return (
    <div className="spec">
      <span className="spec-tok">{tok}</span>
      {val && <span className="spec-val">{val}</span>}
      <span style={{ flex: 1 }}>{children}</span>
    </div>
  );
}

function DS() {
  const [theme, setTheme] = useState('dark');
  const accent = ['#6D5EF9', '#00D4FF'];
  const accentVars = {
    '--primary': accent[0], '--secondary': accent[1],
    '--grad': `linear-gradient(135deg, ${accent[0]} 0%, ${accent[1]} 115%)`,
    '--grad-soft': `linear-gradient(135deg, ${accent[0]}38, ${accent[1]}1f)`,
    '--grad-warm': `linear-gradient(135deg, var(--accent), ${accent[0]})`,
  };

  const nav = [
    ['brand', '🎯', 'Brand'], ['color', '🎨', 'Color'], ['type', '🔤', 'Typography'],
    ['space', '📐', 'Spacing & Elevation'], ['avatars', '🦊', 'Avatars & Mascots'],
    ['buttons', '🔘', 'Buttons'], ['surfaces', '🃏', 'Surfaces'], ['games', '🎮', 'Game Cards'],
    ['gameui', '🛡️', 'Game UI'], ['icons', '✦', 'Iconography'],
  ];

  const colors = [
    ['Primary', '#6D5EF9'], ['Secondary', '#00D4FF'], ['Accent', '#FF9F43'],
    ['Good (ฝ่ายดี)', '#4C8DFF'], ['Evil (ฝ่ายชั่ว)', '#FF5C6C'], ['Online', '#34D17E'],
  ];
  const neutrals = theme === 'dark'
    ? [['Background', '#0C111D'], ['Surface', '#1A2233'], ['Text', '#FFFFFF', '#0C111D'], ['Muted', '#93A0B7']]
    : [['Background', '#EEF1FA'], ['Surface', '#FFFFFF'], ['Text', '#131A2B', '#fff'], ['Muted', '#69748C']];

  const type = [
    ['Display', 'รวมเพื่อน เริ่มเกม', 40, 800, 'th display'],
    ['H1', 'เลือกเกมปาร์ตี้', 30, 800, 'th h1'],
    ['H2', 'ผู้เล่นในห้อง', 21, 700, 'th h2'],
    ['H3 / Body bold', 'เมอร์ลิน · ฝ่ายดี', 16, 700, 'th h3'],
    ['Body', 'สร้างห้อง แชร์โค้ด แล้วเล่นด้วยกันได้ทันที', 14, 400, 'th body'],
    ['Eyebrow', 'PLAY TOGETHER · เล่นด้วยกัน', 11.5, 700, 'eyebrow'],
    ['Mono / code', 'ROOM 4F2K9', 15, 700, 'mono'],
  ];

  const btns = [
    ['btn btn-primary', 'สร้างห้อง'], ['btn btn-accent', 'เสนอทีม'], ['btn btn-good', 'เห็นชอบ'],
    ['btn btn-evil', 'ปฏิเสธ'], ['btn btn-glass', 'แชร์'], ['btn btn-ghost', 'เข้าร่วม'],
  ];

  const Btn = ({ cls, label, icon, dis }) => (
    <button className={cls} disabled={dis} style={{ pointerEvents: 'none' }}>
      {icon && <Icon name={icon} size={18} />}<span className="th">{label}</span>
    </button>
  );

  return (
    <div className="ds app" data-theme={theme} style={accentVars}>
      <div className="ds-shell">
        {/* sidebar */}
        <aside className="ds-side">
          <Logo size={32} />
          <div className="ds-nav">
            {nav.map(([id, em, label]) => (
              <a key={id} href={'#' + id}><span style={{ fontSize: 15 }}>{em}</span>{label}</a>
            ))}
          </div>
          <div style={{ marginTop: 'auto', paddingTop: 24 }}>
            <div className="ds-tile-label">Appearance</div>
            <div className="ds-toggle">
              <button className={theme === 'dark' ? 'on' : ''} onClick={() => setTheme('dark')}>Dark</button>
              <button className={theme === 'light' ? 'on' : ''} onClick={() => setTheme('light')}>Light</button>
            </div>
          </div>
        </aside>

        {/* main */}
        <main className="ds-main">
          {/* BRAND */}
          <Section id="brand" kicker="Design System" title="TangWong · ตั้งวง"
            sub="ระบบดีไซน์สำหรับแพลตฟอร์มบอร์ดเกมปาร์ตี้ — โทนสนุก เป็นกันเอง แต่ดูพรีเมียม เหมือน Discord ผสม Supercell. The TangWong design language: friendly, social, premium.">
            <div className="ds-grid" style={{ gridTemplateColumns: '1.3fr 1fr' }}>
              <Tile label="LOGO LOCKUP">
                <div className="col gap20" style={{ alignItems: 'flex-start' }}>
                  <Logo size={52} />
                  <div className="divider" style={{ width: '100%' }} />
                  <div className="row gap20 wrap" style={{ alignItems: 'center' }}>
                    <Logo size={34} showWord={false} />
                    <div style={{ background: '#fff', padding: 10, borderRadius: 14 }}><Logo size={28} showWord={false} /></div>
                    <div style={{ background: 'var(--grad)', padding: 10, borderRadius: 14 }}>
                      <span className="th" style={{ color: '#fff', fontWeight: 800, fontSize: 22, padding: '0 6px' }}>ตั้งวง</span>
                    </div>
                  </div>
                </div>
              </Tile>
              <Tile label="MEANING & VOICE">
                <p className="th" style={{ fontSize: 15, lineHeight: 1.6 }}>
                  <b>ตั้งวง</b> — "การรวมตัวเป็นวงกลมกับเพื่อน" the circle is our core motif:
                  players gather in a ring to play.
                </p>
                <div style={{ marginTop: 16 }} className="ds-tile-label">TAGLINE</div>
                <p className="th" style={{ fontSize: 17, fontWeight: 800 }}>"Play Together, Anywhere."</p>
                <div style={{ marginTop: 16 }} className="ds-tile-label">PERSONALITY</div>
                <div className="row gap8 wrap">
                  {['Friendly', 'Social', 'Clever', 'Fun', 'Welcoming'].map(p => <span key={p} className="chip">{p}</span>)}
                </div>
              </Tile>
            </div>
          </Section>

          {/* COLOR */}
          <Section id="color" kicker="Foundations" title="Color"
            sub="พาเลตหลักสร้างจากม่วงล้ำลึก ฟ้าสว่าง และส้มอบอุ่น บนพื้นหลังสเลตเข้ม. สีฝ่ายดี/ฝ่ายชั่วใช้สื่อสารกลไกเกม.">
            <div className="ds-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <Tile label="BRAND & SEMANTIC">
                <div className="ds-stage">{colors.map(([n, h]) => <Swatch key={n} name={n} hex={h} />)}</div>
              </Tile>
              <Tile label={'NEUTRALS · ' + theme.toUpperCase()}>
                <div className="ds-stage">{neutrals.map(([n, h, t]) => <Swatch key={n} name={n} hex={h} text={t} />)}</div>
              </Tile>
            </div>
            <div className="ds-grid" style={{ gridTemplateColumns: '1fr' }}>
              <Tile label="GRADIENTS & ACCENT THEMES">
                <div className="ds-stage">
                  <div style={{ width: 200, height: 76, borderRadius: 16, background: 'var(--grad)' }} />
                  <div style={{ width: 200, height: 76, borderRadius: 16, background: 'var(--grad-warm)' }} />
                  <div style={{ width: 200, height: 76, borderRadius: 16, background: 'var(--grad-soft)', border: '1px solid var(--border)' }} />
                  {[['#FF6FA3', '#FF9F43'], ['#34D17E', '#00D4FF'], ['#8B5CF6', '#6D5EF9']].map((g, i) =>
                    <div key={i} style={{ width: 92, height: 76, borderRadius: 16, background: `linear-gradient(135deg, ${g[0]}, ${g[1]})` }} />)}
                </div>
              </Tile>
            </div>
          </Section>

          {/* TYPE */}
          <Section id="type" kicker="Foundations" title="Typography"
            sub="Plus Jakarta Sans สำหรับภาษาอังกฤษ + Noto Sans Thai สำหรับภาษาไทย — เรขาคณิต อ่านง่าย เป็นมิตร. JetBrains Mono สำหรับรหัสห้อง.">
            <Tile label="TYPE SCALE">
              <div className="col">
                {type.map(([name, sample, size, weight, cls], i) => (
                  <div key={name} className="spec" style={{ alignItems: 'center' }}>
                    <span className="spec-tok" style={{ minWidth: 150 }}>{name}</span>
                    <span className="spec-val" style={{ minWidth: 96 }}>{size}px · {weight}</span>
                    <span className={cls} style={{ fontSize: Math.min(size, 30), flex: 1 }}>{sample}</span>
                  </div>
                ))}
              </div>
            </Tile>
          </Section>

          {/* SPACING */}
          <Section id="space" kicker="Foundations" title="Spacing & Elevation"
            sub="ระยะห่างเป็นทวีคูณของ 4 · มุมโค้งมนนุ่มนวล · เงานุ่มสร้างมิติ.">
            <div className="ds-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <Tile label="RADIUS">
                <div className="ds-stage">
                  {[['chip', 11], ['button', 16], ['card', 22], ['sheet', 26]].map(([n, r]) => (
                    <div key={n} className="col gap8" style={{ alignItems: 'center' }}>
                      <div style={{ width: 76, height: 76, borderRadius: r, background: 'var(--surface-3)', border: '1px solid var(--border-2)' }} />
                      <span className="sw-hex">{n} · {r}px</span>
                    </div>
                  ))}
                </div>
              </Tile>
              <Tile label="ELEVATION">
                <div className="ds-stage" style={{ gap: 28 }}>
                  <div className="col gap8" style={{ alignItems: 'center' }}>
                    <div style={{ width: 92, height: 70, borderRadius: 18, background: 'var(--surface-solid)', boxShadow: 'var(--shadow)' }} />
                    <span className="sw-hex">card shadow</span>
                  </div>
                  <div className="col gap8" style={{ alignItems: 'center' }}>
                    <div style={{ width: 92, height: 70, borderRadius: 18, background: 'var(--grad)', boxShadow: '0 12px 30px -8px rgba(109,94,249,0.75)' }} />
                    <span className="sw-hex">primary glow</span>
                  </div>
                </div>
              </Tile>
            </div>
            <Tile label="SPACING TOKENS">
              <div className="ds-stage" style={{ alignItems: 'flex-end' }}>
                {[6, 8, 10, 12, 16, 20, 26].map(s => (
                  <div key={s} className="col gap8" style={{ alignItems: 'center' }}>
                    <div style={{ width: s, height: s, background: 'var(--primary)', borderRadius: 3 }} />
                    <span className="sw-hex">{s}</span>
                  </div>
                ))}
              </div>
            </Tile>
          </Section>

          {/* AVATARS */}
          <Section id="avatars" kicker="Components" title="Avatars & Mascots"
            sub="คาแรกเตอร์สัตว์น่ารักเป็นเอกลักษณ์ของแบรนด์ แต่ละตัวมีดิสก์ไล่เฉดสีเฉพาะ. States: ring, online dot, host crown.">
            <Tile label="MASCOT ROSTER">
              <div className="ds-stage" style={{ gap: 18 }}>
                {Object.keys(MASCOTS).map(k => (
                  <div key={k} className="col gap8" style={{ alignItems: 'center' }}>
                    <Avatar who={{ mascot: k }} size={54} />
                    <span className="sw-hex">{k}</span>
                  </div>
                ))}
              </div>
            </Tile>
            <div className="ds-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <Tile label="STATES">
                <div className="ds-stage" style={{ gap: 22 }}>
                  <div className="col gap8" style={{ alignItems: 'center' }}><Avatar who={ME} size={56} /><span className="sw-hex">default</span></div>
                  <div className="col gap8" style={{ alignItems: 'center' }}><Avatar who={ME} size={56} dot /><span className="sw-hex">online</span></div>
                  <div className="col gap8" style={{ alignItems: 'center' }}><Avatar who={ME} size={56} ring="var(--accent)" /><span className="sw-hex">selected</span></div>
                  <div className="col gap8" style={{ alignItems: 'center', paddingTop: 8 }}><Avatar who={ME} size={56} crown /><span className="sw-hex">host</span></div>
                  <div className="col gap8" style={{ alignItems: 'center' }}><Avatar who={ME} size={56} faded /><span className="sw-hex">inactive</span></div>
                </div>
              </Tile>
              <Tile label="AVATAR STACK">
                <div className="col gap16">
                  <AvatarStack people={PLAYERS} size={40} max={4} />
                  <AvatarStack people={PLAYERS.slice(0, 3)} size={32} max={4} />
                </div>
              </Tile>
            </div>
          </Section>

          {/* BUTTONS */}
          <Section id="buttons" kicker="Components" title="Buttons"
            sub="ปุ่มหลักใช้ไล่เฉดแบรนด์ · ปุ่มฝ่ายดี/ชั่วสำหรับการโหวต · ปุ่มกระจกสำหรับงานรอง. สูง 54–60px เพื่อรองรับการแตะบนมือถือ.">
            <Tile label="VARIANTS">
              <div className="ds-stage">{btns.map(([c, l]) => <Btn key={c} cls={c} label={l} />)}</div>
            </Tile>
            <div className="ds-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <Tile label="WITH ICON · SIZES">
                <div className="ds-stage">
                  <Btn cls="btn btn-primary btn-lg" label="สร้างห้อง" icon="plus" />
                  <Btn cls="btn btn-good" label="เห็นชอบ" icon="check" />
                  <Btn cls="btn btn-glass" label="แชร์" icon="share" />
                </div>
              </Tile>
              <Tile label="DISABLED">
                <div className="ds-stage"><Btn cls="btn btn-accent btn-lg" label="เสนอทีม (0/3)" dis /></div>
              </Tile>
            </div>
          </Section>

          {/* SURFACES */}
          <Section id="surfaces" kicker="Components" title="Surfaces & Tags"
            sub="การ์ดกระจก (glass) วางบนพื้นไล่เฉด · การ์ดทึบสำหรับรายการ · ชิปและแบดจ์สำหรับสถานะ.">
            <div className="ds-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <Tile label="GLASS CARD">
                <div className="card" style={{ padding: 18 }}>
                  <div className="eyebrow">รหัสห้อง · room code</div>
                  <div className="mono" style={{ fontSize: 28, fontWeight: 700, letterSpacing: '0.16em', marginTop: 6 }}>4F2K9</div>
                </div>
              </Tile>
              <Tile label="SOLID CARD · LIST ROW">
                <div className="card-solid row between" style={{ padding: '12px 14px' }}>
                  <div className="row gap12"><Avatar who={PLAYERS[1]} size={42} dot /><div className="col"><span className="th h3">มิ้นท์</span><span className="tiny">ผู้เล่น</span></div></div>
                  <span className="chip" style={{ background: 'rgba(52,209,126,0.16)', color: '#34D17E', border: 'none' }}>✓ พร้อม</span>
                </div>
              </Tile>
            </div>
            <Tile label="CHIPS & BADGES">
              <div className="ds-stage">
                <span className="chip">ทั้งหมด</span>
                <span className="chip"><Icon name="dice" size={14} /> เปลี่ยนเกม</span>
                <span className="chip" style={{ background: 'var(--grad)', color: '#fff', border: 'none' }}>เลือกอยู่</span>
                <span style={{ fontSize: 10.5, fontWeight: 800, padding: '4px 8px', borderRadius: 8, background: '#FF5C6C', color: '#fff' }}>🔥 HOT</span>
                <span style={{ fontSize: 10.5, fontWeight: 800, padding: '4px 8px', borderRadius: 8, background: '#34D17E', color: '#fff' }}>NEW</span>
              </div>
            </Tile>
          </Section>

          {/* GAME CARDS */}
          <Section id="games" kicker="Components" title="Game Cards"
            sub="การ์ดเกมแต่ละใบมีไล่เฉดและมาสคอตเฉพาะตัว มีป้ายหมวดหมู่ จำนวนผู้เล่น และเวลา.">
            <div className="ds-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              {GAMES.map(g => <GameCard key={g.id} game={g} height={168} />)}
            </div>
          </Section>

          {/* GAME UI */}
          <Section id="gameui" kicker="Components" title="Game UI · Avalon"
            sub="ส่วนประกอบเฉพาะเกม: แทร็กภารกิจ · การ์ดบทบาทลับ · ปุ่มโหวต · ป้ายสถานะที่นั่ง.">
            <div className="ds-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <Tile label="QUEST TRACK">
                <div className="row center" style={{ padding: '14px 0 20px' }}>
                  <QuestTrack results={['success', 'fail', null, null, null]} current={2} />
                </div>
              </Tile>
              <Tile label="VOTE ACTIONS">
                <div className="row gap10">
                  <button className="btn btn-evil" style={{ flex: 1, pointerEvents: 'none' }}><Icon name="x" size={18} stroke={3} /><span className="th">ปฏิเสธ</span></button>
                  <button className="btn btn-good" style={{ flex: 1, pointerEvents: 'none' }}><Icon name="check" size={18} stroke={3} /><span className="th">เห็นชอบ</span></button>
                </div>
              </Tile>
            </div>
            <Tile label="SECRET ROLE CARD">
              <div className="role-card" style={{ background: 'linear-gradient(135deg, rgba(109,94,249,0.28), rgba(0,212,255,0.12))', maxWidth: 380 }}>
                <div className="row gap12">
                  <div className="row center" style={{ width: 44, height: 44, borderRadius: 13, background: 'var(--good)', fontSize: 22 }}>🧙</div>
                  <div className="col" style={{ gap: 2 }}>
                    <span className="th h3">เมอร์ลิน · <span style={{ color: 'var(--good)' }}>ฝ่ายดี</span></span>
                    <span className="tiny">รู้ว่าใครคือฝ่ายชั่ว แต่ต้องปกปิดตัวตน</span>
                  </div>
                </div>
              </div>
            </Tile>
          </Section>

          {/* ICONS */}
          <Section id="icons" kicker="Components" title="Iconography"
            sub="ชุดไอคอนเส้น สไตล์เดียวกันทั้งระบบ น้ำหนักเส้น 2px มุมโค้งมน.">
            <Tile label={Object.keys(ICONS).length + ' ICONS'}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(86px, 1fr))', gap: 10 }}>
                {Object.keys(ICONS).map(n => (
                  <div key={n} className="icon-cell"><Icon name={n} size={24} /><span>{n}</span></div>
                ))}
              </div>
            </Tile>
          </Section>

          <div style={{ marginTop: 80, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
            <Logo size={26} />
            <p className="tiny" style={{ marginTop: 12 }}>TangWong Design System · v1.0 · ตั้งวง — Play Together, Anywhere.</p>
          </div>
        </main>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<DS />);
