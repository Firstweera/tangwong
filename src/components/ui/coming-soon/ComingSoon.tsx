import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface ComingSoonProps {
  children: ReactNode;
  /** Badge text shown over the dimmed content. */
  label?: string;
  className?: string;
}

/**
 * ComingSoon — dims and disables a not-yet-built feature, overlaying a "เร็วๆ นี้"
 * badge. Reusable wrapper for previewing roadmap features without wiring them.
 */
export function ComingSoon({ children, label = 'เร็วๆ นี้', className }: ComingSoonProps) {
  return (
    <div className={cn('coming-soon', className)} style={{ position: 'relative' }} aria-disabled="true">
      <div style={{ opacity: 0.4, pointerEvents: 'none', filter: 'saturate(0.7)', userSelect: 'none' }}>
        {children}
      </div>
      <span
        className="tiny"
        style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          padding: '4px 12px', borderRadius: 999, fontWeight: 800, whiteSpace: 'nowrap',
          background: 'var(--surface-solid)', color: 'var(--text)',
          border: '1px solid var(--border-2)', boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
        }}
      >
        ✨ {label}
      </span>
    </div>
  );
}
