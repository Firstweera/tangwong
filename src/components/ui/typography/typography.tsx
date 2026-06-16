import type { ElementType, HTMLAttributes, LabelHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/* ─────────────────────────── Heading ─────────────────────────── */

type HeadingLevel = 1 | 2 | 3 | 'display';

const HEADING_STYLES: Record<string, string> = {
  display: 'text-[34px] font-extrabold tracking-[-0.03em] leading-[1.04]',
  '1': 'text-[30px] font-extrabold tracking-[-0.025em] leading-[1.08]',
  '2': 'text-[21px] font-bold tracking-[-0.02em]',
  '3': 'text-[16px] font-bold tracking-[-0.01em]',
};

const HEADING_TAG: Record<string, ElementType> = { display: 'h1', '1': 'h1', '2': 'h2', '3': 'h3' };

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  level?: HeadingLevel;
  /** Paint the text with the brand gradient. */
  gradient?: boolean;
  /** Use the Thai display font. */
  thai?: boolean;
  /** Override the rendered element (defaults to the semantic tag for the level). */
  as?: ElementType;
  children?: ReactNode;
}

export function Heading({ level = 1, gradient, thai, as, className, children, ...rest }: HeadingProps) {
  const Comp = as ?? HEADING_TAG[String(level)];
  return (
    <Comp
      className={cn(HEADING_STYLES[String(level)], thai && 'font-thai', gradient ? 'grad-text' : 'text-ink', className)}
      {...rest}
    >
      {children}
    </Comp>
  );
}

/* ─────────────────────────── Text ─────────────────────────── */

type Tone = 'default' | 'muted' | 'faint' | 'primary' | 'good' | 'evil';
type Weight = 'normal' | 'medium' | 'semibold' | 'bold';

const TONE: Record<Tone, string> = {
  default: 'text-ink',
  muted: 'text-muted',
  faint: 'text-faint',
  primary: 'text-primary',
  good: 'text-good',
  evil: 'text-evil',
};
const WEIGHT: Record<Weight, string> = {
  normal: 'font-normal', medium: 'font-medium', semibold: 'font-semibold', bold: 'font-bold',
};

export interface TextProps extends HTMLAttributes<HTMLElement> {
  tone?: Tone;
  weight?: Weight;
  thai?: boolean;
  as?: ElementType;
  children?: ReactNode;
}

export function Text({ tone = 'default', weight = 'normal', thai, as = 'p', className, children, ...rest }: TextProps) {
  const Comp = as;
  return (
    <Comp className={cn('text-sm leading-normal', TONE[tone], WEIGHT[weight], thai && 'font-thai', className)} {...rest}>
      {children}
    </Comp>
  );
}

/* ─────────────────────────── Caption ─────────────────────────── */

export interface CaptionProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  thai?: boolean;
  children?: ReactNode;
}

export function Caption({ tone = 'muted', thai, className, children, ...rest }: CaptionProps) {
  return (
    <span className={cn('text-xs', TONE[tone], thai && 'font-thai', className)} {...rest}>
      {children}
    </span>
  );
}

/* ─────────────────────────── Label ─────────────────────────── */

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  thai?: boolean;
  children?: ReactNode;
}

/** Uppercase eyebrow / form label. Renders <label> when `htmlFor` is set. */
export function Label({ htmlFor, thai, className, children, ...rest }: LabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn('inline-block text-[11.5px] font-bold uppercase tracking-[0.14em] text-muted', thai && 'font-thai', className)}
      {...rest}
    >
      {children}
    </label>
  );
}
