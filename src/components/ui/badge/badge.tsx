import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type BadgeTone = 'primary' | 'secondary' | 'accent' | 'good' | 'evil' | 'neutral';
export type BadgeVariant = 'solid' | 'soft' | 'outline';

const TONE_VAR: Record<BadgeTone, string> = {
  primary: 'var(--primary)',
  secondary: 'var(--secondary)',
  accent: 'var(--accent)',
  good: 'var(--good)',
  evil: 'var(--evil)',
  neutral: 'var(--muted)',
};

function toneStyle(tone: BadgeTone, variant: BadgeVariant): CSSProperties {
  const c = TONE_VAR[tone];
  if (variant === 'solid') return { background: c, color: tone === 'neutral' ? 'var(--text)' : '#fff' };
  if (variant === 'outline') return { border: `1px solid ${c}`, color: c };
  // soft
  return { background: `color-mix(in srgb, ${c} 18%, transparent)`, color: c };
}

export interface BadgeProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  tone?: BadgeTone;
  variant?: BadgeVariant;
  /** Bare status dot (no content). Provide aria-label for meaning. */
  dot?: boolean;
  /** Numeric count; clamped to `max` with a “+”. */
  count?: number;
  max?: number;
  icon?: ReactNode;
  children?: ReactNode;
}

export function Badge({
  tone = 'evil', variant = 'solid', dot, count, max = 99, icon, children, className, style, ...rest
}: BadgeProps) {
  const content = count != null ? (count > max ? `${max}+` : count) : children;
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center gap-1 font-extrabold leading-none',
        dot ? 'h-2.5 w-2.5 rounded-full p-0' : 'h-5 min-w-5 rounded-full px-1.5 text-[11px]',
        className,
      )}
      style={{ ...toneStyle(tone, variant), ...style }}
      {...rest}
    >
      {!dot && icon}
      {!dot && content}
    </span>
  );
}
