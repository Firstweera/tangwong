// PlayerGrid.jsx — 2-column player grid layout for lobby
import { Avatar } from '../../../components/ui';
import { ReadyPill } from './ReadyPill.jsx';

export function PlayerGrid({ players, isReady }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {players.map((p, i) => (
        <div key={p.id} className="card-solid col center gap8 rise"
             style={{ padding: '16px 10px 12px', position: 'relative', animationDelay: i * 0.04 + 's' }}>
          {p.id === 'me' && (
            <span style={{ position: 'absolute', top: 8, left: 10, fontSize: 9.5, fontWeight: 800, color: 'var(--primary)' }}>YOU</span>
          )}
          <Avatar who={p} size={56} dot crown={i === 0} />
          <span className="th h3" style={{ fontSize: 14 }}>{p.name}</span>
          <ReadyPill ready={isReady(p)} />
        </div>
      ))}
    </div>
  );
}
