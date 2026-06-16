// Feedback — Badge, Tag, Tooltip, Toast
import { Icon, useToast } from '../components/ui';

const cx = (...c) => c.filter(Boolean).join(' ');

// Solid background per tone (used by Badge + solid Tag).
const TONE_BG = {
  primary: 'var(--primary)',
  secondary: 'var(--secondary)',
  accent: 'var(--accent)',
  good: 'var(--good)',
  evil: 'var(--evil)',
  neutral: 'var(--surface-3)',
};

// Badge — small count / status indicator. Use `dot` for a bare status dot.
export function Badge({ children, tone = 'evil', dot, max = 99, className = '', style }) {
  const content = typeof children === 'number' && children > max ? `${max}+` : children;
  return (
    <span
      className={cx('ds-badge', dot && 'ds-badge--dot', className)}
      style={{ background: TONE_BG[tone], color: tone === 'neutral' ? 'var(--text)' : '#fff', ...style }}
    >
      {!dot && content}
    </span>
  );
}

// Tag — labeled chip. `solid` fills with the tone colour; `icon` + `onRemove` optional.
export function Tag({ children, tone = 'neutral', solid, icon, onRemove, className = '', style }) {
  const solidStyle = solid ? { background: TONE_BG[tone], color: tone === 'neutral' ? 'var(--text)' : '#fff' } : { color: tone === 'neutral' ? undefined : TONE_BG[tone] };
  return (
    <span className={cx('ds-tag', solid && 'ds-tag--solid', className)} style={{ ...solidStyle, ...style }}>
      {icon && (typeof icon === 'string' ? <Icon name={icon} size={13} /> : icon)}
      {children}
      {onRemove && (
        <button aria-label="remove" onClick={onRemove} className="row center" style={{ color: 'inherit', opacity: 0.7, marginRight: -2 }}>
          <Icon name="x" size={12} stroke={2.5} />
        </button>
      )}
    </span>
  );
}

// Tooltip — hover/focus label above its child. CSS-driven (no JS positioning).
export function Tooltip({ label, children, className = '', style }) {
  return (
    <span className={cx('ds-tip-wrap', className)} tabIndex={0} style={style}>
      {children}
      <span role="tooltip" className="ds-tip th">{label}</span>
    </span>
  );
}

// Toast — presentational toast node (the prototype's .toast). For app-wide
// usage prefer the `useToast` hook, re-exported here as the canonical API.
export function Toast({ message, icon, className = '', style }) {
  return (
    <div className={cx('toast', className)} style={style}>
      {icon && <span style={{ fontSize: 15 }}>{icon}</span>}
      <span>{message}</span>
    </div>
  );
}

export { useToast };
