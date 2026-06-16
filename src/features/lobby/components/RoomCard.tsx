import { Icon } from '@/components/ui';
import type { Game, Player } from '@/types';
import { PlayerAvatarGroup } from '@/components/game';

export interface RoomCardProps {
  name: string;
  game?: Game;
  players: Player[];
  maxPlayers?: number;
  code?: string;
  /** Open room badge — room is mid-game / waiting. */
  status?: 'waiting' | 'playing' | 'full';
  onJoin?: () => void;
}

const STATUS = {
  waiting: { label: 'กำลังรอ', color: '#34D17E' },
  playing: { label: 'กำลังเล่น', color: 'var(--accent)' },
  full: { label: 'เต็มแล้ว', color: 'var(--muted)' },
};

/**
 * RoomCard — a browsable room summary (name, game, who's inside, join CTA).
 * For room lists / "join a friend's room"; complements RoomCodeDisplay.
 */
export function RoomCard({ name, game, players, maxPlayers, code, status = 'waiting', onJoin }: RoomCardProps) {
  const s = STATUS[status];
  return (
    <div className="card row between" style={{ padding: 14, gap: 12 }}>
      <div className="row gap12" style={{ minWidth: 0, alignItems: 'center' }}>
        {game && (
          <div className="row center" style={{ width: 46, height: 46, borderRadius: 14, flexShrink: 0, fontSize: 24, background: `linear-gradient(150deg, ${game.g[0]}, ${game.g[1]})` }}>
            {game.emoji}
          </div>
        )}
        <div className="col" style={{ gap: 3, minWidth: 0 }}>
          <span className="th h3" style={{ fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
          <div className="row gap8" style={{ alignItems: 'center' }}>
            <span className="row gap6" style={{ alignItems: 'center', fontSize: 11, fontWeight: 700, color: s.color }}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: s.color }} /> {s.label}
            </span>
            {game && <span className="tiny">· {game.th}</span>}
            {code && <span className="mono tiny" style={{ letterSpacing: '0.1em' }}>· {code}</span>}
          </div>
        </div>
      </div>
      <div className="row gap10" style={{ alignItems: 'center', flexShrink: 0 }}>
        <div className="col" style={{ alignItems: 'flex-end', gap: 4 }}>
          <PlayerAvatarGroup players={players} size={26} max={3} />
          {maxPlayers && <span className="tiny" style={{ fontWeight: 700 }}>{players.length}/{maxPlayers}</span>}
        </div>
        {onJoin && status !== 'full' && (
          <button aria-label="join room" className="row center" style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--grad)', color: '#fff' }} onClick={onJoin}>
            <Icon name="arrowR" size={18} stroke={2.4} />
          </button>
        )}
      </div>
    </div>
  );
}
