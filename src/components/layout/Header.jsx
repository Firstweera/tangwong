// Header.jsx — top bar: [left action] [title + subtitle] [right action]
// Matches the pattern used in LobbyScreen and GameScreen.

export function Header({ left, title, subtitle, right }) {
  return (
    <div className="row between pad-x pad-top" style={{ paddingBottom: 8 }}>
      <div style={{ width: 42 }}>{left}</div>
      <div className="col center" style={{ gap: 0, flex: 1, textAlign: 'center' }}>
        {title && <span className="th h3">{title}</span>}
        {subtitle && <span className="tiny">{subtitle}</span>}
      </div>
      <div style={{ width: 42 }}>{right}</div>
    </div>
  );
}

// IconButton — the 42×42 rounded icon button used in every header
export function IconButton({ children, onClick, style, ...rest }) {
  return (
    <button
      type="button"
      className="row center"
      style={{ width: 42, height: 42, borderRadius: 13, background: 'var(--surface-2)', border: '1px solid var(--border)', ...style }}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  );
}
