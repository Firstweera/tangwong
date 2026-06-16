import {
  cloneElement, createContext, isValidElement, useContext, useId, useRef,
  type HTMLAttributes, type MouseEvent, type ReactElement, type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';
import { useControllableState, useFocusTrap, useOnEscape } from '@/hooks';

interface ModalCtx {
  open: boolean;
  setOpen: (v: boolean) => void;
  titleId: string;
  descId: string;
}
const ModalContext = createContext<ModalCtx | null>(null);

function useModal(part: string): ModalCtx {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error(`Modal.${part} must be used within <Modal.Root>`);
  return ctx;
}

/* ─────────────────────────── Root ─────────────────────────── */

export interface ModalRootProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

function ModalRoot({ open, defaultOpen = false, onOpenChange, children }: ModalRootProps) {
  const [isOpen, setOpen] = useControllableState({ value: open, defaultValue: defaultOpen, onChange: onOpenChange });
  const base = useId();
  return (
    <ModalContext.Provider value={{ open: isOpen, setOpen, titleId: `${base}-title`, descId: `${base}-desc` }}>
      {children}
    </ModalContext.Provider>
  );
}

/* ─────────────────────────── Trigger ─────────────────────────── */

export interface ModalTriggerProps { children: ReactElement<{ onClick?: (e: MouseEvent) => void }>; }

function ModalTrigger({ children }: ModalTriggerProps) {
  const ctx = useModal('Trigger');
  if (!isValidElement(children)) return null;
  return cloneElement(children, {
    onClick: (e: MouseEvent) => {
      children.props.onClick?.(e);
      ctx.setOpen(true);
    },
  });
}

/* ─────────────────────────── Content ─────────────────────────── */

export interface ModalContentProps extends HTMLAttributes<HTMLDivElement> {
  /** Allow Escape / backdrop click to close (default true). */
  dismissable?: boolean;
}

function ModalContent({ dismissable = true, className, children, ...rest }: ModalContentProps) {
  const ctx = useModal('Content');
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(ref, ctx.open);
  useOnEscape(ctx.open && dismissable, () => ctx.setOpen(false));

  if (!ctx.open) return null;

  const onBackdrop = (e: MouseEvent) => {
    if (dismissable && e.target === e.currentTarget) ctx.setOpen(false);
  };

  return (
    <div
      className="absolute inset-0 z-[60] flex items-center justify-center p-5"
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
          'relative z-[70] w-full max-w-[360px] rounded-[26px] border border-line-2 bg-surface-solid p-6',
          'shadow-[0_18px_40px_-12px_rgba(0,0,0,0.55)] focus:outline-none',
          className,
        )}
        style={{ animation: 'dsPop var(--dur-slow) var(--ease-spring)' }}
        {...rest}
      >
        {children}
      </div>
    </div>
  );
}

/* ─────────────────────────── Parts ─────────────────────────── */

function ModalHeader({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4 flex items-start justify-between gap-3', className)} {...rest}>{children}</div>;
}

function ModalTitle({ className, children, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  const ctx = useModal('Title');
  return <h2 id={ctx.titleId} className={cn('font-thai text-[21px] font-extrabold tracking-[-0.02em] text-ink', className)} {...rest}>{children}</h2>;
}

function ModalDescription({ className, children, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  const ctx = useModal('Description');
  return <p id={ctx.descId} className={cn('mt-1 text-sm leading-relaxed text-muted', className)} {...rest}>{children}</p>;
}

function ModalFooter({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mt-6 flex items-center gap-2', className)} {...rest}>{children}</div>;
}

export interface ModalCloseProps extends HTMLAttributes<HTMLButtonElement> { children?: ReactNode; }

const XIcon = <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>;

function ModalClose({ className, children, onClick, ...rest }: ModalCloseProps) {
  const ctx = useModal('Close');
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

export const Modal = Object.assign(ModalRoot, {
  Root: ModalRoot,
  Trigger: ModalTrigger,
  Content: ModalContent,
  Header: ModalHeader,
  Title: ModalTitle,
  Description: ModalDescription,
  Footer: ModalFooter,
  Close: ModalClose,
});
