import { createContext, useContext, useId, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useOnEscape } from '@/hooks';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

interface TooltipCtx {
  open: boolean;
  id: string;
  placement: TooltipPlacement;
  show: () => void;
  hide: () => void;
}
const TooltipContext = createContext<TooltipCtx | null>(null);

function useTooltip(part: string): TooltipCtx {
  const ctx = useContext(TooltipContext);
  if (!ctx) throw new Error(`Tooltip.${part} must be used within <Tooltip.Root>`);
  return ctx;
}

export interface TooltipRootProps {
  placement?: TooltipPlacement;
  children: ReactNode;
  className?: string;
}

function TooltipRoot({ placement = 'top', children, className }: TooltipRootProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  useOnEscape(open, () => setOpen(false));
  return (
    <TooltipContext.Provider value={{ open, id, placement, show: () => setOpen(true), hide: () => setOpen(false) }}>
      <span className={cn('relative inline-flex', className)}>{children}</span>
    </TooltipContext.Provider>
  );
}

export interface TooltipTriggerProps { children: ReactNode; className?: string; }

function TooltipTrigger({ children, className }: TooltipTriggerProps) {
  const ctx = useTooltip('Trigger');
  return (
    <span
      aria-describedby={ctx.open ? ctx.id : undefined}
      tabIndex={0}
      className={cn('inline-flex', className)}
      onMouseEnter={ctx.show}
      onMouseLeave={ctx.hide}
      onFocus={ctx.show}
      onBlur={ctx.hide}
    >
      {children}
    </span>
  );
}

const PLACEMENT: Record<TooltipPlacement, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

export interface TooltipContentProps { children: ReactNode; className?: string; }

function TooltipContent({ children, className }: TooltipContentProps) {
  const ctx = useTooltip('Content');
  return (
    <span
      role="tooltip"
      id={ctx.id}
      hidden={!ctx.open}
      className={cn(
        'pointer-events-none absolute z-[75] whitespace-nowrap rounded-[11px] border border-line-2 bg-elev px-2.5 py-1.5',
        'text-xs font-semibold text-ink shadow-[0_12px_30px_-12px_rgba(0,0,0,0.5)] backdrop-blur-xl',
        'transition-opacity duration-150 ease-out',
        ctx.open ? 'opacity-100' : 'opacity-0',
        PLACEMENT[ctx.placement],
        className,
      )}
    >
      {children}
    </span>
  );
}

export const Tooltip = Object.assign(TooltipRoot, {
  Root: TooltipRoot,
  Trigger: TooltipTrigger,
  Content: TooltipContent,
});
