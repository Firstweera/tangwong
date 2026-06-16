// Typography — Heading, Text, Caption, Label
// Maps to the existing typography classes (styles/typography.css) so type
// scale stays identical to the prototype. `thai` switches to the Noto font.

const cx = (...c) => c.filter(Boolean).join(' ');

// Heading — level 1|2|3 (h1/h2/h3) or 'display'. `gradient` paints with --grad.
export function Heading({ level = 1, children, thai, gradient, className = '', style, as }) {
  const cls = level === 'display' ? 'display' : `h${level}`;
  const Tag = as || (level === 'display' ? 'h1' : `h${level}`);
  return (
    <Tag className={cx(cls, thai && 'th', gradient && 'grad-text', className)} style={style}>
      {children}
    </Tag>
  );
}

// Text — body copy. `muted` (default) uses --muted; `tone='default'` is --text.
export function Text({ children, tone = 'muted', size = 14, weight, thai, className = '', style, as = 'p' }) {
  const Tag = as;
  return (
    <Tag
      className={cx(thai && 'th', className)}
      style={{
        fontSize: size,
        fontWeight: weight,
        lineHeight: 1.5,
        color: tone === 'muted' ? 'var(--muted)' : tone === 'faint' ? 'var(--faint)' : 'var(--text)',
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}

// Caption — small secondary text (.tiny).
export function Caption({ children, thai, className = '', style }) {
  return <span className={cx('tiny', thai && 'th', className)} style={style}>{children}</span>;
}

// Label — uppercase eyebrow / form label (.eyebrow).
export function Label({ children, htmlFor, thai, className = '', style }) {
  const Tag = htmlFor ? 'label' : 'span';
  return (
    <Tag htmlFor={htmlFor} className={cx('eyebrow', thai && 'th', className)} style={{ display: 'inline-block', ...style }}>
      {children}
    </Tag>
  );
}
