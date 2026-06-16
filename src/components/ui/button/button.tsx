import { forwardRef, type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'accent' | 'glass' | 'ghost' | 'good' | 'evil';
export type ButtonSize = 'sm' | 'md' | 'lg';

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-11 px-4 text-sm rounded-[14px]',
  md: 'h-[54px] px-5 text-[15.5px] rounded-2xl',
  lg: 'h-[60px] px-6 text-[17px] rounded-[19px]',
};

// Variants that need a gradient/brand shadow carry an inline style; the rest are
// pure token utilities. Keeps fidelity with the prototype's .btn system.
const VARIANTS: Record<ButtonVariant, { className: string; style?: CSSProperties }> = {
  primary: { className: 'text-white', style: { background: 'var(--grad)', boxShadow: '0 10px 26px -8px rgba(109,94,249,0.7)' } },
  accent: { className: 'text-[#3a2406]', style: { background: 'linear-gradient(135deg, #FFB65C, var(--accent))', boxShadow: '0 10px 26px -8px rgba(255,159,67,0.6)' } },
  good: { className: 'text-white', style: { background: 'linear-gradient(135deg, #5C9BFF, #3B6FE0)', boxShadow: '0 10px 24px -10px rgba(76,141,255,0.8)' } },
  evil: { className: 'text-white', style: { background: 'linear-gradient(135deg, #FF6E7C, #E0384A)', boxShadow: '0 10px 24px -10px rgba(255,92,108,0.8)' } },
  glass: { className: 'bg-surface text-ink border border-line-2 backdrop-blur-xl' },
  ghost: { className: 'bg-surface-2 text-ink' },
};

function Spinner() {
  return (
    <svg className="animate-spin" width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Stretch to full width. */
  block?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', block, loading, leftIcon, rightIcon, disabled, className, style, children, type = 'button', ...rest },
  ref,
) {
  const v = VARIANTS[variant];
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-bold tracking-[-0.01em]',
        'transition-transform duration-150 ease-out active:scale-[0.96]',
        'disabled:pointer-events-none disabled:opacity-40',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0',
        SIZES[size],
        v.className,
        block && 'w-full',
        className,
      )}
      style={{ ...v.style, ...style }}
      {...rest}
    >
      {loading ? <Spinner /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  );
});

/* ─────────────────────────── IconButton ─────────────────────────── */

export type IconButtonVariant = 'surface' | 'glass' | 'grad' | 'ghost';

const ICON_VARIANTS: Record<IconButtonVariant, { className: string; style?: CSSProperties }> = {
  surface: { className: 'bg-surface-2 border border-line text-ink' },
  glass: { className: 'bg-surface border border-line-2 text-ink backdrop-blur-xl' },
  grad: { className: 'text-white border-0', style: { background: 'var(--grad)' } },
  ghost: { className: 'bg-transparent text-ink' },
};

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Accessible name — required for icon-only buttons. */
  'aria-label': string;
  icon: ReactNode;
  variant?: IconButtonVariant;
  size?: number;
  radius?: number;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, variant = 'surface', size = 42, radius = 13, disabled, className, style, type = 'button', ...rest },
  ref,
) {
  const v = ICON_VARIANTS[variant];
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={cn(
        'inline-flex shrink-0 items-center justify-center transition-transform duration-150 ease-out active:scale-95',
        'disabled:pointer-events-none disabled:opacity-40',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        v.className,
        className,
      )}
      style={{ width: size, height: size, borderRadius: radius, ...v.style, ...style }}
      {...rest}
    >
      {icon}
    </button>
  );
});

/* ─────────────────────────── ButtonGroup ─────────────────────────── */

export interface ButtonGroupProps {
  children: ReactNode;
  className?: string;
  'aria-label'?: string;
}

export function ButtonGroup({ children, className, ...rest }: ButtonGroupProps) {
  return (
    <div role="group" className={cn('flex items-center gap-2', className)} {...rest}>
      {children}
    </div>
  );
}
