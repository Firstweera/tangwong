import { Icon } from '@/components/ui';

export interface InviteButtonProps {
  onClick?: () => void;
  /** `circle` = dashed avatar-sized add button (friend rows); `button` = labelled. */
  variant?: 'circle' | 'button';
  label?: string;
  size?: number;
}

/**
 * InviteButton — "invite a friend" affordance. The circle variant matches the
 * dashed add-slot in friend rows; the button variant is a labelled CTA.
 */
export function InviteButton({ onClick, variant = 'circle', label = 'เชิญ', size = 56 }: InviteButtonProps) {
  if (variant === 'button') {
    return (
      <button className="btn btn-glass" onClick={onClick}>
        <Icon name="plus" size={18} stroke={2.4} /> <span className="th">{label}</span>
      </button>
    );
  }
  return (
    <div className="col center gap8" style={{ flexShrink: 0 }}>
      <button
        aria-label={label}
        className="row center"
        style={{ width: size, height: size, borderRadius: '50%', border: '2px dashed var(--border-2)', color: 'var(--muted)' }}
        onClick={onClick}
      >
        <Icon name="plus" size={22} />
      </button>
      <span className="tiny" style={{ fontWeight: 600 }}>{label}</span>
    </div>
  );
}
