import { Icon } from '@/components/ui';
import type { Game } from '@/types';

export interface GameInfoPanelProps {
  game: Game;
}

/**
 * GameInfoPanel — at-a-glance game metadata (player count, duration, tag,
 * description). Helps players understand a game before starting. Game-agnostic.
 */
export function GameInfoPanel({ game }: GameInfoPanelProps) {
  return (
    <div className="card-solid col gap12" style={{ padding: 16 }}>
      <div className="row between" style={{ alignItems: 'flex-start' }}>
        <div className="col" style={{ gap: 2 }}>
          <span className="th h2" style={{ fontSize: 18 }}>{game.th}</span>
          <span className="eyebrow">{game.th_tag}</span>
        </div>
        <span style={{ fontSize: 30 }}>{game.emoji}</span>
      </div>
      <div className="row gap16">
        <span className="row gap6 tiny" style={{ alignItems: 'center', fontWeight: 700 }}>
          <Icon name="users" size={15} style={{ color: 'var(--muted)' }} /> {game.players} คน
        </span>
        <span className="row gap6 tiny" style={{ alignItems: 'center', fontWeight: 700 }}>
          <Icon name="clock" size={15} style={{ color: 'var(--muted)' }} /> {game.mins} นาที
        </span>
      </div>
      <p className="body" style={{ fontSize: 13.5, lineHeight: 1.5 }}>{game.desc}</p>
    </div>
  );
}
