// Overlay — Modal, Drawer, BottomSheet
// All render absolutely within the nearest positioned ancestor (the .app
// device frame), consistent with how the prototype layers tabbar/toast.
import { useEffect } from 'react';
import { Icon } from '../components/ui';

const cx = (...c) => c.filter(Boolean).join(' ');

// Shared backdrop + Escape-to-close + body of any overlay.
function Overlay({ open, onClose, align, children, dismissable = true }) {
  useEffect(() => {
    if (!open || !dismissable) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, dismissable, onClose]);

  if (!open) return null;
  return (
    <div
      className={cx('ds-overlay', `ds-overlay--${align}`)}
      onClick={dismissable ? (e) => { if (e.target === e.currentTarget) onClose?.(); } : undefined}
    >
      {children}
    </div>
  );
}

// Optional header shared by overlays: title + close button.
function OverlayHeader({ title, onClose }) {
  if (!title && !onClose) return null;
  return (
    <div className="row between" style={{ marginBottom: title ? 16 : 0 }}>
      {title ? <span className="th h2">{title}</span> : <span />}
      {onClose && (
        <button aria-label="close" onClick={onClose} className="row center" style={{ width: 34, height: 34, borderRadius: 11, background: 'var(--surface-2)', color: 'var(--muted)' }}>
          <Icon name="x" size={18} />
        </button>
      )}
    </div>
  );
}

// Modal — centered dialog.
export function Modal({ open, onClose, title, children, dismissable = true, showClose = true, style }) {
  return (
    <Overlay open={open} onClose={onClose} align="center" dismissable={dismissable}>
      <div className="ds-modal" style={style}>
        <OverlayHeader title={title} onClose={showClose ? onClose : undefined} />
        {children}
      </div>
    </Overlay>
  );
}

// BottomSheet — mobile sheet rising from the bottom edge, with grab handle.
export function BottomSheet({ open, onClose, title, children, dismissable = true, showClose = false, style }) {
  return (
    <Overlay open={open} onClose={onClose} align="bottom" dismissable={dismissable}>
      <div className="ds-sheet" style={style}>
        <div className="ds-sheet-grab" />
        <OverlayHeader title={title} onClose={showClose ? onClose : undefined} />
        {children}
      </div>
    </Overlay>
  );
}

// Drawer — side panel. side: 'right' (default) | 'left'.
export function Drawer({ open, onClose, title, children, side = 'right', dismissable = true, showClose = true, style }) {
  return (
    <Overlay open={open} onClose={onClose} align={side} dismissable={dismissable}>
      <div className={cx('ds-drawer', side === 'left' && 'ds-drawer--left')} style={style}>
        <OverlayHeader title={title} onClose={showClose ? onClose : undefined} />
        {children}
      </div>
    </Overlay>
  );
}
