// PlayerList.jsx — stacked list layout for lobby players
import { Avatar } from '../../../components/ui';
import { ReadyPill } from './ReadyPill.jsx';

export function PlayerList({ players, isReady }) {
  return (
    <div className="card-solid" style={{ overflow: 'hidden' }}>
      {players.map((p, i) => (
        <div key={p.id} className="row between rise"
             style={{ padding: '11px 14px', borderTop: i ? '1px solid var(--border)' : 'none', animationDelay: i * 0.03 + 's' }}>
          <div className="row gap12">
            <Avatar who={p} size={44} dot crown={i === 0} />
            <div className="col" style={{ gap: 1 }}>
              <span className="th h3" style={{ fontSize: 15 }}>
                {p.name}{' '}
                {p.id === 'me' && <span style={{ color: 'var(--primary)', fontSize: 11, fontWeight: 800 }}>· คุณ</span>}
              </span>
              <span className="tiny">{i === 0 ? 'หัวห้อง · Host' : 'ผู้เล่น'}</span>
            </div>
          </div>
          <ReadyPill ready={isReady(p)} />
        </div>
      ))}
    </div>
  );
}
