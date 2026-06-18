import {
  cloneElement, createContext, isValidElement, useContext, useId, useRef,
  type CSSProperties, type HTMLAttributes, type MouseEvent, type ReactElement, type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';
import { useControllableState, useFocusTrap, useOnEscape } from '@/hooks';

export type SheetSide = 'bottom' | 'left' | 'right';

interface SheetCtx {
  open: boolean;
  setOpen: (v: boolean) => void;
  titleId: string;
  descId: string;
}
const SheetContext = createContext<SheetCtx | null>(null);

function useSheet(part: string): SheetCtx {
  const ctx = useContext(SheetContext);
  if (!ctx) throw new Error(`Sheet.${part} must be used within <Sheet.Root>`);
  return ctx;
}

export interface SheetRootProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

function SheetRoot({ open, defaultOpen = false, onOpenChange, children }: SheetRootProps) {
  const [isOpen, setOpen] = useControllableState({ value: open, defaultValue: defaultOpen, onChange: onOpenChange });
  const base = useId();
  return (
    <SheetContext.Provider value={{ open: isOpen, setOpen, titleId: `${base}-title`, descId: `${base}-desc` }}>
      {children}
    </SheetContext.Provider>
  );
}

function SheetTrigger({ children }: { children: ReactElement<{ onClick?: (e: MouseEvent) => void }> }) {
  const ctx = useSheet('Trigger');
  if (!isValidElement(children)) return null;
  return cloneElement(children, {
    onClick: (e: MouseEvent) => { children.props.onClick?.(e); ctx.setOpen(true); },
  });
}

const ALIGN: Record<SheetSide, string> = {
  bottom: 'items-end justify-center',
  left: 'items-stretch justify-start',
  right: 'items-stretch justify-end',
};

const PANEL: Record<SheetSide, string> = {
  bottom: 'w-full max-h-[86%] rounded-t-[26px] border-t px-5 pb-6 pt-3',
  left: 'h-full w-[84%] max-w-[320px] border-r px-5 py-6',
  right: 'h-full w-[84%] max-w-[320px] border-l px-5 py-6',
};

const ANIM: Record<SheetSide, string> = {
  bottom: 'dsSlideUp', left: 'dsSlideLeft', right: 'dsSlideRight',
};

export interface SheetContentProps extends HTMLAttributes<HTMLDivElement> {
  side?: SheetSide;
  dismissable?: boolean;
}

function SheetContent({ side = 'bottom', dismissable = true, className, style, children, ...rest }: SheetContentProps) {
  const ctx = useSheet('Content');
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, ctx.open);
  useOnEscape(ctx.open && dismissable, () => ctx.setOpen(false));

  if (!ctx.open) return null;

  const onBackdrop = (e: MouseEvent) => {
    if (dismissable && e.target === e.currentTarget) ctx.setOpen(false);
  };

  return (
    <div
      className={cn('absolute inset-0 z-60 flex', ALIGN[side])}
      style={{ background: 'rgba(4,6,12,0.58)', animation: 'dsFade var(--dur-base) var(--ease-out)' }}
      onMouseDown={onBackdrop}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={ctx.titleId}
        aria-describedby={ctx.descId}
        className={cn(
          'relative z-[70] overflow-y-auto border-line-2 bg-surface-solid shadow-[0_18px_40px_-12px_rgba(0,0,0,0.55)] focus:outline-none',
          PANEL[side],
          className,
        )}
        style={{ animation: `${ANIM[side]} var(--dur-slow) var(--ease-out)`, ...(style as CSSProperties) }}
        {...rest}
      >
        {side === 'bottom' && <div aria-hidden className="mx-auto mb-4 mt-1 h-1 w-9 rounded-full bg-line-2" />}
        {children}
      </div>
    </div>
  );
}

function SheetHeader({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4 flex items-start justify-between gap-3', className)} {...rest}>{children}</div>;
}

function SheetTitle({ className, children, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  const ctx = useSheet('Title');
  return <h2 id={ctx.titleId} className={cn('font-thai text-[21px] font-extrabold tracking-[-0.02em] text-ink', className)} {...rest}>{children}</h2>;
}

function SheetDescription({ className, children, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  const ctx = useSheet('Description');
  return <p id={ctx.descId} className={cn('mt-1 text-sm leading-relaxed text-muted', className)} {...rest}>{children}</p>;
}

function SheetFooter({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mt-6 flex items-center gap-2', className)} {...rest}>{children}</div>;
}

const XIcon = <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>;

function SheetClose({ className, children, onClick, ...rest }: HTMLAttributes<HTMLButtonElement> & { children?: ReactNode }) {
  const ctx = useSheet('Close');
  return (
    <button
      type="button"
      aria-label="close"
      onClick={(e) => { onClick?.(e); ctx.setOpen(false); }}
      className={cn('flex h-[34px] w-[34px] items-center justify-center rounded-[11px] bg-surface-2 text-muted transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary', className)}
      {...rest}
    >
      {children ?? XIcon}
    </button>
  );
}

export const Sheet = Object.assign(SheetRoot, {
  Root: SheetRoot,
  Trigger: SheetTrigger,
  Content: SheetContent,
  Header: SheetHeader,
  Title: SheetTitle,
  Description: SheetDescription,
  Footer: SheetFooter,
  Close: SheetClose,
});
