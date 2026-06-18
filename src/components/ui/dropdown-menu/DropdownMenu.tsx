import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/ui';

export interface DropdownMenuItem {
  label: string;
  /** Leading emoji/glyph. */
  emoji?: string;
  onClick: () => void;
  /** Render in the destructive (red) style. */
  danger?: boolean;
}

export interface DropdownMenuProps {
  items: DropdownMenuItem[];
  ariaLabel?: string;
  /** Icon name for the trigger button (default: kebab "more"). */
  triggerIcon?: string;
  className?: string;
}

/**
 * DropdownMenu — a small, dependency-free popover menu with a kebab trigger.
 * A transparent backdrop captures the outside click; Escape closes it. Generic
 * and reusable (player actions, list rows, etc.).
 */
export function DropdownMenu({ items, ariaLabel = 'เมนู', triggerIcon = 'more', className }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className={cn('dropdown', className)} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
        className="row center"
        style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
      >
        <Icon name={triggerIcon} size={16} stroke={2.8} />
      </button>

      {open && (
        <>
          {/* outside-click catcher */}
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 80 }}
            onClick={(e) => { e.stopPropagation(); setOpen(false); }}
          />
          <div
            role="menu"
            className="card-solid rise"
            style={{
              position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 81,
              minWidth: 196, padding: 6, borderRadius: 14,
              boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
            }}
          >
            {items.map((item, i) => (
              <button
                key={i}
                role="menuitem"
                onClick={(e) => { e.stopPropagation(); setOpen(false); item.onClick(); }}
                className="row gap10"
                style={{
                  width: '100%', alignItems: 'center', padding: '10px 12px', borderRadius: 10,
                  background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
                  fontSize: 14, fontWeight: 700,
                  color: item.danger ? 'var(--evil, #FF5C6C)' : 'var(--text)',
                }}
              >
                {item.emoji && <span style={{ fontSize: 16 }}>{item.emoji}</span>}
                <span className="th">{item.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
