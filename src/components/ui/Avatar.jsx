// Avatar.jsx — player avatar disc + stacked group
import { MASCOTS } from '../../data';

export function Avatar({ who, size = 44, ring, dot, crown, faded, style, onClick }) {
  const m = MASCOTS[who?.mascot] || MASCOTS.fox;
  return (
    <div className={'av' + (ring ? ' av-ring' : '')}
         onClick={onClick}
         style={{
           width: size, height: size, fontSize: size * 0.52,
           background: `linear-gradient(140deg, ${m.g[0]}, ${m.g[1]})`,
           '--ring': ring === true ? 'var(--secondary)' : ring,
           opacity: faded ? 0.4 : 1, cursor: onClick ? 'pointer' : 'default',
           ...style,
         }}>
      <span className="em">{m.em}</span>
      {crown && <span className="crown">👑</span>}
      {dot && <span className="dot-on" />}
    </div>
  );
}

export function AvatarStack({ people, size = 30, max = 4 }) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  return (
    <div className="row" style={{ paddingLeft: size * 0.32 }}>
      {shown.map((p, i) => (
        <div key={p.id} style={{ marginLeft: -size * 0.32, zIndex: 10 - i,
             borderRadius: '50%', boxShadow: '0 0 0 2.5px var(--surface-solid)' }}>
          <Avatar who={p} size={size} />
        </div>
      ))}
      {extra > 0 && (
        <div className="row center" style={{ marginLeft: -size * 0.32, width: size, height: size,
             borderRadius: '50%', background: 'var(--surface-3)', boxShadow: '0 0 0 2.5px var(--surface-solid)',
             fontSize: size * 0.34, fontWeight: 700, color: 'var(--muted)', zIndex: 1 }}>
          +{extra}
        </div>
      )}
    </div>
  );
}
