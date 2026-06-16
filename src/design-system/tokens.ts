// tokens.ts — typed JS mirror of the design tokens.
//
// Colours reference CSS custom properties so they stay theme-aware
// (light/dark switch handled by .app in styles/tokens.css). Structural
// scales mirror design-system/tokens.css for use in inline style objects.

export const color = {
  // brand
  primary: 'var(--primary)',
  primary2: 'var(--primary-2)',
  secondary: 'var(--secondary)',
  accent: 'var(--accent)',
  // game semantics
  good: 'var(--good)',
  evil: 'var(--evil)',
  // gradients
  grad: 'var(--grad)',
  gradSoft: 'var(--grad-soft)',
  gradWarm: 'var(--grad-warm)',
  // surfaces
  bg: 'var(--bg)',
  surface: 'var(--surface)',
  surfaceSolid: 'var(--surface-solid)',
  surface2: 'var(--surface-2)',
  surface3: 'var(--surface-3)',
  elev: 'var(--elev)',
  // text
  text: 'var(--text)',
  muted: 'var(--muted)',
  faint: 'var(--faint)',
  // lines
  border: 'var(--border)',
  border2: 'var(--border-2)',
} as const;

// Status palette for player/social states — generic, not game-specific.
export const statusColor = {
  online: '#34D17E',
  ready: '#34D17E',
  away: 'var(--muted)',
  busy: 'var(--accent)',
  playing: 'var(--secondary)',
  inRoom: 'var(--primary)',
  thinking: 'var(--accent)',
  eliminated: 'var(--evil)',
} as const;

export const space = {
  0: '0', 1: '4px', 2: '8px', 3: '12px', 4: '16px', 5: '20px',
  6: '24px', 8: '32px', 10: '40px', 12: '48px', 16: '64px',
} as const;

export const radius = {
  xs: '8px', sm: '11px', md: '14px', lg: '16px',
  xl: '20px', '2xl': '22px', '3xl': '26px', full: '999px',
} as const;

export const shadow = {
  1: 'var(--shadow-1)',
  2: 'var(--shadow-2)',
  3: 'var(--shadow-3)',
  glowPrimary: 'var(--shadow-glow-primary)',
  glowAccent: 'var(--shadow-glow-accent)',
} as const;

export const duration = {
  instant: '0.12s', fast: '0.16s', base: '0.22s', slow: '0.34s', slower: '0.5s',
} as const;

export const easing = {
  out: 'cubic-bezier(0.22, 1, 0.36, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  inout: 'cubic-bezier(0.65, 0, 0.35, 1)',
} as const;

export const zIndex = {
  base: 1, raised: 10, sticky: 20, nav: 30, dropdown: 40,
  overlay: 60, modal: 70, tooltip: 75, confetti: 80, toast: 90,
} as const;

// Typography presets — { class } maps to the existing CSS, font sizes mirror
// styles/typography.css so JS-side consumers stay in sync.
export const typography = {
  display: { fontSize: 34, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.04 },
  h1: { fontSize: 30, fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.08 },
  h2: { fontSize: 21, fontWeight: 700, letterSpacing: '-0.02em' },
  h3: { fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' },
  body: { fontSize: 14, lineHeight: 1.5 },
  caption: { fontSize: 12 },
  label: { fontSize: 11.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' },
} as const;

export const tokens = {
  color, statusColor, space, radius, shadow, duration, easing, zIndex, typography,
} as const;

export default tokens;
