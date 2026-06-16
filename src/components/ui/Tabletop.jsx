// Tabletop.jsx — tabletop visual primitives (card back, fanned deck, chip, die)
// Ported from the design prototype; styled via styles/tabletop.css.

export function CardBack({ w = 46, h = 64, style }) {
  return (
    <div className="pcard pcard-back" style={{ width: w, height: h, ...style }}>
      <div className="pcard-emblem">
        <svg viewBox="0 0 36 36" width="60%" height="60%">
          <circle cx="18" cy="11" r="3.4" fill="#fff" />
          <circle cx="11.2" cy="22" r="3.4" fill="#fff" fillOpacity="0.9" />
          <circle cx="24.8" cy="22" r="3.4" fill="#fff" fillOpacity="0.8" />
        </svg>
      </div>
    </div>
  );
}

export function CardFan({ count = 5, w = 44, h = 62, spread = 22, rise = 9 }) {
  const mid = (count - 1) / 2;
  return (
    <div className="card-fan" style={{ width: w, height: h + rise + 16 }}>
      {[...Array(count)].map((_, i) => {
        const off = i - mid;
        return <CardBack key={i} w={w} h={h} style={{
          transform: `translateX(-50%) rotate(${off * spread / count * 1.6}deg) translateY(${Math.abs(off) * rise}px)`,
          zIndex: i, top: 4,
        }} />;
      })}
    </div>
  );
}

export function Token({ kind = 'good', size = 44, children, style }) {
  const glyph = children ?? (kind === 'good' ? '✓' : kind === 'evil' ? '✕' : '');
  return (
    <div className={'token tk-' + kind} style={{ width: size, height: size, fontSize: size * 0.42, ...style }}>
      <span>{glyph}</span>
    </div>
  );
}

const DIE_PIPS = {
  1: [[50, 50]], 2: [[30, 30], [70, 70]], 3: [[28, 28], [50, 50], [72, 72]],
  4: [[30, 30], [70, 30], [30, 70], [70, 70]], 5: [[30, 30], [70, 30], [50, 50], [30, 70], [70, 70]],
  6: [[30, 25], [30, 50], [30, 75], [70, 25], [70, 50], [70, 75]],
};

export function Die({ face = 5, size = 40, style }) {
  return (
    <div className="die" style={{ width: size, height: size, ...style }}>
      {DIE_PIPS[face].map((p, i) => <i key={i} style={{ left: p[0] + '%', top: p[1] + '%', width: size * 0.16, height: size * 0.16 }} />)}
    </div>
  );
}
