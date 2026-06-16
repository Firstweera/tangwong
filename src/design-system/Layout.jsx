// Layout — structural primitives: Page, Container, Stack, Grid, Divider
import { space as SPACE } from './tokens.ts';

const sp = (v) => (typeof v === 'number' ? SPACE[v] ?? `${v}px` : v);

// Page — full-height scroll surface (reuses the prototype's .scroll plumbing
// + entrance animation). Reserves room for the floating tab bar by default.
export function Page({ children, padded = true, bottomPad = 112, style, className = '' }) {
  return (
    <div
      className={`scroll screen-anim ${padded ? 'pad-x' : ''} ${className}`.trim()}
      style={{ paddingBottom: bottomPad, ...style }}
    >
      {children}
    </div>
  );
}

// Container — centered, max-width content column.
export function Container({ children, max = 640, padX, style }) {
  return (
    <div style={{ width: '100%', maxWidth: max, marginInline: 'auto', paddingInline: sp(padX), ...style }}>
      {children}
    </div>
  );
}

// Stack — flex layout with token-based gap. direction: 'col' | 'row'.
export function Stack({
  children, direction = 'col', gap = 3, align, justify, wrap, style, className = '', ...rest
}) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: direction === 'row' ? 'row' : 'column',
        gap: sp(gap),
        alignItems: align,
        justifyContent: justify,
        flexWrap: wrap ? 'wrap' : undefined,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

// Grid — CSS grid with token gap. cols: number (equal) or any template string.
export function Grid({ children, cols = 2, gap = 3, style, className = '' }) {
  const templateColumns = typeof cols === 'number' ? `repeat(${cols}, minmax(0, 1fr))` : cols;
  return (
    <div className={className} style={{ display: 'grid', gridTemplateColumns: templateColumns, gap: sp(gap), ...style }}>
      {children}
    </div>
  );
}

// Divider — 1px hairline; horizontal by default, vertical when orientation set.
export function Divider({ orientation = 'horizontal', spacing = 0, style }) {
  const vertical = orientation === 'vertical';
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      style={
        vertical
          ? { width: 1, alignSelf: 'stretch', background: 'var(--border)', marginInline: sp(spacing), ...style }
          : { height: 1, width: '100%', background: 'var(--border)', marginBlock: sp(spacing), ...style }
      }
    />
  );
}
