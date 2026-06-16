// Inputs — Input, TextArea, Select, SearchInput
import { Icon } from '../components/ui';

const cx = (...c) => c.filter(Boolean).join(' ');

// Input — single-line text field. `iconLeft`/`addonRight` accept icon names or nodes.
export function Input({
  value, onChange, placeholder, type = 'text', iconLeft, addonRight,
  invalid, disabled, inputMode, maxLength, ariaLabel, className = '', style,
}) {
  return (
    <div className={cx('ds-field', invalid && 'ds-field--invalid', className)} style={{ opacity: disabled ? 0.5 : 1, ...style }}>
      {iconLeft && (typeof iconLeft === 'string' ? <Icon name={iconLeft} size={18} style={{ color: 'var(--muted)' }} /> : iconLeft)}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value, e)}
        placeholder={placeholder}
        disabled={disabled}
        inputMode={inputMode}
        maxLength={maxLength}
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
      />
      {addonRight && (typeof addonRight === 'string' ? <Icon name={addonRight} size={18} style={{ color: 'var(--muted)' }} /> : addonRight)}
    </div>
  );
}

// TextArea — multi-line input.
export function TextArea({ value, onChange, placeholder, rows = 3, invalid, disabled, maxLength, ariaLabel, className = '', style }) {
  return (
    <div className={cx('ds-field', 'ds-field--area', invalid && 'ds-field--invalid', className)} style={{ opacity: disabled ? 0.5 : 1, ...style }}>
      <textarea
        value={value}
        onChange={(e) => onChange?.(e.target.value, e)}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        maxLength={maxLength}
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
      />
    </div>
  );
}

// Select — native select with a custom caret (keeps mobile native picker).
// options: array of strings or { value, label }.
export function Select({ value, onChange, options, placeholder, disabled, ariaLabel, className = '', style }) {
  const opts = options.map((o) => (typeof o === 'object' ? o : { value: o, label: o }));
  return (
    <div className={cx('ds-select-wrap', className)} style={style}>
      <div className="ds-field" style={{ opacity: disabled ? 0.5 : 1 }}>
        <select
          value={value ?? ''}
          onChange={(e) => onChange?.(e.target.value, e)}
          disabled={disabled}
          aria-label={ariaLabel}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <span className="ds-select-caret"><Icon name="chevR" size={16} style={{ transform: 'rotate(90deg)' }} /></span>
    </div>
  );
}

// SearchInput — Input preset with a search icon and clear affordance.
export function SearchInput({ value, onChange, placeholder = 'ค้นหา…', onClear, ariaLabel = 'search', className = '', style }) {
  return (
    <Input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      iconLeft="search"
      ariaLabel={ariaLabel}
      className={className}
      style={style}
      addonRight={
        value
          ? <button aria-label="clear" onClick={() => (onClear ? onClear() : onChange?.(''))} className="row center" style={{ color: 'var(--muted)' }}><Icon name="x" size={16} /></button>
          : null
      }
    />
  );
}
