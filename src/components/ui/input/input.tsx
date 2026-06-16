import {
  createContext, forwardRef, useContext, useId,
  type CSSProperties, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/lib/utils';
import { Label } from '../typography';

/* ─────────────────────────── Field (compound) ─────────────────────────── */

interface FieldCtx { id: string; hintId: string; errorId: string; invalid: boolean; hasError: boolean; hasHint: boolean; }
const FieldContext = createContext<FieldCtx | null>(null);

export interface FieldProps { invalid?: boolean; className?: string; style?: CSSProperties; children?: ReactNode; }

function FieldRoot({ invalid = false, className, style, children }: FieldProps) {
  const base = useId();
  const ctx: FieldCtx = {
    id: `${base}-control`, hintId: `${base}-hint`, errorId: `${base}-error`,
    invalid, hasError: false, hasHint: false,
  };
  return (
    <FieldContext.Provider value={ctx}>
      <div className={cn('flex flex-col gap-1.5', className)} style={style}>{children}</div>
    </FieldContext.Provider>
  );
}

function FieldLabel({ children, className }: { children: ReactNode; className?: string }) {
  const ctx = useContext(FieldContext);
  return <Label htmlFor={ctx?.id} className={className}>{children}</Label>;
}

function FieldHint({ children, className }: { children: ReactNode; className?: string }) {
  const ctx = useContext(FieldContext);
  return <p id={ctx?.hintId} className={cn('text-xs text-muted', className)}>{children}</p>;
}

function FieldError({ children, className }: { children: ReactNode; className?: string }) {
  const ctx = useContext(FieldContext);
  if (!children) return null;
  return <p id={ctx?.errorId} role="alert" className={cn('text-xs text-evil', className)}>{children}</p>;
}

export const Field = Object.assign(FieldRoot, { Label: FieldLabel, Hint: FieldHint, Error: FieldError });

// Resolve id / aria wiring from Field context (if present) merged with props.
function useFieldAria(props: { id?: string; invalid?: boolean; 'aria-describedby'?: string }) {
  const ctx = useContext(FieldContext);
  const id = props.id ?? ctx?.id;
  const invalid = props.invalid ?? ctx?.invalid ?? false;
  const describedBy = [ctx?.hintId, ctx?.errorId, props['aria-describedby']].filter(Boolean).join(' ') || undefined;
  return { id, invalid, describedBy };
}

const FIELD_SHELL =
  'flex w-full items-center gap-2 rounded-2xl border border-line bg-surface-2 px-4 text-ink transition ' +
  'focus-within:border-primary focus-within:bg-surface-3 focus-within:ring-[3px] focus-within:ring-primary/20';

/* ─────────────────────────── Input ─────────────────────────── */

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leading?: ReactNode;
  trailing?: ReactNode;
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { leading, trailing, invalid, className, id, disabled, 'aria-describedby': ariaDescribedBy, ...rest }, ref,
) {
  const aria = useFieldAria({ id, invalid, 'aria-describedby': ariaDescribedBy });
  return (
    <div className={cn(FIELD_SHELL, 'min-h-[50px]', aria.invalid && 'border-evil', disabled && 'opacity-50', className)}>
      {leading && <span className="shrink-0 text-muted">{leading}</span>}
      <input
        ref={ref}
        id={aria.id}
        disabled={disabled}
        aria-invalid={aria.invalid || undefined}
        aria-describedby={aria.describedBy}
        className="min-w-0 flex-1 bg-transparent text-[15px] font-medium outline-none placeholder:text-faint"
        {...rest}
      />
      {trailing && <span className="shrink-0 text-muted">{trailing}</span>}
    </div>
  );
});

/* ─────────────────────────── TextArea ─────────────────────────── */

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { invalid, className, id, rows = 3, disabled, 'aria-describedby': ariaDescribedBy, ...rest }, ref,
) {
  const aria = useFieldAria({ id, invalid, 'aria-describedby': ariaDescribedBy });
  return (
    <div className={cn(FIELD_SHELL, 'items-stretch py-3', aria.invalid && 'border-evil', disabled && 'opacity-50', className)}>
      <textarea
        ref={ref}
        id={aria.id}
        rows={rows}
        disabled={disabled}
        aria-invalid={aria.invalid || undefined}
        aria-describedby={aria.describedBy}
        className="min-h-[76px] w-full flex-1 resize-y bg-transparent text-[15px] font-medium leading-relaxed outline-none placeholder:text-faint"
        {...rest}
      />
    </div>
  );
});

/* ─────────────────────────── SearchInput ─────────────────────────── */

const SearchIcon = <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14M20 20l-4-4" /></svg>;
const XIcon = <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>;

export interface SearchInputProps extends Omit<InputProps, 'leading' | 'trailing' | 'value'> {
  value?: string;
  onClear?: () => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { value, onClear, onChange, placeholder = 'ค้นหา…', ...rest }, ref,
) {
  return (
    <Input
      ref={ref}
      type="search"
      role="searchbox"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      leading={SearchIcon}
      trailing={value ? (
        <button type="button" aria-label="clear search" onClick={onClear} className="flex items-center text-muted">{XIcon}</button>
      ) : null}
      {...rest}
    />
  );
});
