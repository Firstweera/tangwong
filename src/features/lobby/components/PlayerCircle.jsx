// PlayerCircle.jsx — ตั้งวง radial circle layout for lobby
import { Avatar, Logo } from '../../../components/ui';

export function PlayerCircle({ players, isReady, readyCount }) {
  const n = players.length, R = 116, cx = 50, cy = 50;
  return (
    <div className="ring-stage" style={{ height: 300 }}>
      <div className="spin-slow" style={{
        position: 'absolute', top: '50%', left: '50%', width: 232, height: 232,
        border: '1.5px dashed var(--border-2)', borderRadius: '50%', transform: 'translate(-50%,-50%)',
      }} />
      <div className="ring-center col center gap6" style={{ width: 130 }}>
        <Logo size={30} showWord={false} />
        <span className="th" style={{ fontWeight: 800, fontSize: 15 }}>ตั้งวง</span>
        <span className="tiny" style={{ fontWeight: 700 }}>{readyCount}/{players.length} พร้อม</span>
      </div>
      {players.map((p, i) => {
        const ang = (-90 + i * 360 / n) * Math.PI / 180;
        const x = cx + (R / 2.32) * Math.cos(ang);
        const y = cy + (R / 2.32) * Math.sin(ang);
        return (
          <div key={p.id} className="ring-seat rise" style={{ left: x + '%', top: y + '%', animationDelay: i * 0.05 + 's' }}>
            <Avatar who={p} size={52} dot crown={i === 0} ring={isReady(p) ? '#34D17E' : false} />
            <span className="ring-name th">{p.name}</span>
          </div>
        );
      })}
    </div>
  );
}
