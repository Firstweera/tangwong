// Logo.jsx — TangWong wordmark + icon
export function Logo({ size = 34, showWord = true }) {
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
