export interface AddBotControlProps {
  onClick?: () => void;
  /** Room is full — disabled + "เต็มแล้ว" label. */
  disabled?: boolean;
}

const dashed = {
  border: '2px dashed var(--border-2)',
  background: 'var(--surface-2)',
  color: 'var(--text)',
} as const;

/**
 * AddBotTile — dashed "เพิ่มบอท" cell sized to sit inside the player grid.
 */
export function AddBotTile({ onClick, disabled }: AddBotControlProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="col center gap6"
      style={{ borderRadius: 18, padding: '16px 10px', minHeight: 118, opacity: disabled ? 0.4 : 1, ...dashed }}
    >
      <div className="row center" style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--grad-soft)', color: 'var(--primary)' }}>
        <span style={{ fontSize: 22 }}>🤖</span>
      </div>
      <span className="th" style={{ fontSize: 13.5, fontWeight: 700 }}>เพิ่มบอท</span>
      <span className="tiny" style={{ fontWeight: 600 }}>{disabled ? 'เต็มแล้ว' : 'พร้อมทันที'}</span>
    </button>
  );
}

/**
 * AddBotButton — full-width dashed "เพิ่มบอท" button for the list / circle layouts.
 */
export function AddBotButton({ onClick, disabled }: AddBotControlProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="row center gap8"
      style={{ width: '100%', height: 50, marginTop: 12, borderRadius: 16, fontWeight: 700, opacity: disabled ? 0.4 : 1, ...dashed }}
    >
      <span style={{ fontSize: 18 }}>🤖</span>
      <span className="th" style={{ fontSize: 14 }}>{disabled ? 'ห้องเต็มแล้ว' : 'เพิ่มบอท'}</span>
    </button>
  );
}
