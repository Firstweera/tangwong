// Actions — Button, IconButton, SegmentedControl
import { Icon } from '../components/ui';

const cx = (...c) => c.filter(Boolean).join(' ');

// Button — wraps the prototype's .btn system (variants identical to existing UI).
// variant: primary | accent | glass | ghost | good | evil
// size: md | lg ; block; iconLeft / iconRight: icon name string or node.
export function Button({
  children, variant = 'primary', size = 'md', block, disabled,
  iconLeft, iconRight, onClick, type = 'button', className = '', style,
}) {
  const sheen = variant === 'primary' || variant === 'accent';
  const renderIcon = (i) => (typeof i === 'string' ? <Icon name={i} size={18} /> : i);
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cx('btn', `btn-${variant}`, size === 'lg' && 'btn-lg', block && 'btn-block', className)}
      style={style}
    >
      {sheen && <span className="sheen" />}
      {iconLeft && renderIcon(iconLeft)}
      {children}
      {iconRight && renderIcon(iconRight)}
    </button>
  );
}

// IconButton — square rounded icon-only button. variant: surface | glass | grad | ghost.
export function IconButton({
  icon, size = 42, iconSize, variant = 'surface', radius = 13, onClick, label, disabled, style, className = '',
}) {
  const bg = {
    surface: { background: 'var(--surface-2)', border: '1px solid var(--border)' },
    glass: { background: 'var(--surface)', border: '1px solid var(--border-2)', backdropFilter: 'blur(18px)' },
    grad: { background: 'var(--grad)', color: '#fff', border: 'none' },
    ghost: { background: 'transparent', border: 'none' },
  }[variant];
  return (
    <button
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cx('row center', className)}
      style={{ width: size, height: size, borderRadius: radius, flexShrink: 0, opacity: disabled ? 0.4 : 1, ...bg, ...style }}
    >
      {typeof icon === 'string' ? <Icon name={icon} size={iconSize || Math.round(size * 0.5)} /> : icon}
    </button>
  );
}

// SegmentedControl — single-select pill toggle.
// options: array of strings, or { value, label } objects.
export function SegmentedControl({ value, options, onChange, block, className = '', style }) {
  const opts = options.map((o) => (typeof o === 'object' ? o : { value: o, label: o }));
  return (
    <div className={cx('ds-seg', block && 'ds-seg--block', className)} style={style} role="tablist">
      {opts.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          className={cx('ds-seg-opt', value === o.value && 'on')}
          onClick={() => onChange?.(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
