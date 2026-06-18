// GameCard.jsx — game catalog card with gradient background
import { Icon } from './Icon.jsx';

export function GameCard({ game, onClick, onRules, height = 168, big, disabled }) {
  return (
    <div className="gamecard" onClick={disabled ? undefined : onClick}
         aria-disabled={disabled || undefined}
         style={{ height, cursor: disabled ? 'not-allowed' : (onClick ? 'pointer' : 'default') }}>
      <div className="glow" style={{ background: `linear-gradient(150deg, ${game.g[0]}, ${game.g[1]})`, filter: disabled ? 'grayscale(0.7)' : 'none' }} />
      <div className="grain" />
      <div style={{ position: 'absolute', right: -14, bottom: -18, fontSize: big ? 130 : 96, opacity: disabled ? 0.5 : 0.9,
           filter: `drop-shadow(0 8px 16px rgba(0,0,0,0.3))${disabled ? ' grayscale(0.8)' : ''}`, transform: 'rotate(-8deg)' }}>{game.emoji}</div>
      {disabled && <div style={{ position: 'absolute', inset: 0, background: 'rgba(6,8,15,0.45)' }} />}
      <div className="col" style={{ position: 'relative', height: '100%', padding: 16, justifyContent: 'space-between' }}>
        <div className="row between" style={{ alignItems: 'flex-start' }}>
          <span className="th" style={{ fontSize: 11.5, fontWeight: 700, padding: '5px 10px', borderRadius: 9,
                background: 'rgba(0,0,0,0.22)', backdropFilter: 'blur(6px)', color: 'rgba(255,255,255,0.95)' }}>{game.th_tag}</span>
          {disabled ? (
            <span className="th row gap6" style={{ alignItems: 'center', flexShrink: 0, height: 30, padding: '0 11px', borderRadius: 9,
                  fontSize: 11.5, fontWeight: 800, color: '#fff', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.22)', backdropFilter: 'blur(8px)' }}>
              <Icon name="lock" size={13} /> เร็วๆ นี้
            </span>
          ) : onRules && (
            <button className="row center gap6" aria-label="อ่านกฎ" onClick={(e) => { e.stopPropagation(); onRules(game); }}
              style={{ flexShrink: 0, height: 30, padding: '0 11px', borderRadius: 9, color: '#fff', fontSize: 11.5, fontWeight: 700,
                       background: 'rgba(0,0,0,0.28)', border: '1px solid rgba(255,255,255,0.22)', backdropFilter: 'blur(8px)' }}>
              <Icon name="book" size={14} />
              <span className="th">อ่านกฎ</span>
            </button>
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
