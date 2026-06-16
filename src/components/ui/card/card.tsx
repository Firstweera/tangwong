import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type CardVariant = 'glass' | 'solid' | 'outline';

const VARIANTS: Record<CardVariant, string> = {
  glass: 'bg-surface border border-line backdrop-blur-xl',
  solid: 'bg-surface-solid border border-line',
  outline: 'bg-transparent border border-line-2',
};

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  /** Adds press feedback + button semantics. Pair with onClick. */
  interactive?: boolean;
}

function CardRoot({ variant = 'glass', interactive, className, onClick, children, ...rest }: CardProps) {
  const clickable = interactive || !!onClick;
  return (
    <div
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); (e.currentTarget as HTMLElement).click(); } } : undefined}
      className={cn(
        'rounded-[22px] overflow-hidden',
        VARIANTS[variant],
        clickable && 'cursor-pointer transition-transform duration-150 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

function CardHeader({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-start justify-between gap-3 px-4 pt-4 pb-2', className)} {...rest}>{children}</div>;
}

function CardBody({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-4 py-2', className)} {...rest}>{children}</div>;
}

function CardFooter({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center gap-2 px-4 pb-4 pt-2', className)} {...rest}>{children}</div>;
}

export interface CardMediaProps extends HTMLAttributes<HTMLDivElement> {
  /** CSS aspect-ratio, e.g. "16/9" or "1". */
  ratio?: string;
  children?: ReactNode;
}

function CardMedia({ ratio, className, style, children, ...rest }: CardMediaProps) {
  return (
    <div className={cn('relative w-full overflow-hidden', className)} style={{ aspectRatio: ratio, ...style }} {...rest}>
      {children}
    </div>
  );
}

export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Body: CardBody,
  Footer: CardFooter,
  Media: CardMedia,
});
