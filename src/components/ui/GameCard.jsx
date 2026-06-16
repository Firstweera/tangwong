// GameCard.jsx — game catalog card with gradient background
import { Icon } from './Icon.jsx';

export function GameCard({ game, onClick, height = 168, big }) {
  return (
    <div className="gamecard" onClick={onClick} style={{ height }}>
      <div className="glow" style={{ background: `linear-gradient(150deg, ${game.g[0]}, ${game.g[1]})` }} />
      <div className="grain" />
      <div style={{ position: 'absolute', right: -14, bottom: -18, fontSize: big ? 130 : 96, opacity: 0.9,
           filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.3))', transform: 'rotate(-8deg)' }}>{game.emoji}</div>
      <div className="col" style={{ position: 'relative', height: '100%', padding: 16, justifyContent: 'space-between' }}>
        <div className="row between" style={{ alignItems: 'flex-start' }}>
          <span className="th" style={{ fontSize: 11.5, fontWeight: 700, padding: '5px 10px', borderRadius: 9,
                background: 'rgba(0,0,0,0.22)', backdropFilter: 'blur(6px)', color: 'rgba(255,255,255,0.95)' }}>{game.th_tag}</span>
          {game.heat && (
            <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.08em', padding: '4px 8px', borderRadius: 8,
                  background: game.heat === 'HOT' ? '#FF5C6C' : game.heat === 'NEW' ? '#34D17E' : '#fff', color: '#fff' }}>
              {game.heat === 'HOT' ? '🔥 HOT' : game.heat}
            </span>
          )}
        </div>
        <div>
          <div className="th" style={{ fontSize: big ? 30 : 23, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', textShadow: '0 2px 10px rgba(0,0,0,0.25)' }}>{game.th}</div>
          <div className="row gap10" style={{ marginTop: 6, color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: 600 }}>
            <span className="row gap6" style={{ alignItems: 'center' }}><Icon name="users" size={14} /> {game.players}</span>
            <span style={{ opacity: 0.5 }}>·</span>
            <span className="row gap6" style={{ alignItems: 'center' }}><Icon name="clock" size={14} /> {game.mins}'</span>
          </div>
        </div>
      </div>
    </div>
  );
}
