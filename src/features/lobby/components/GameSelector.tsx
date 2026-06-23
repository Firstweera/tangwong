import { Icon } from '@/components/ui';
import type { Game } from '@/types';
import { GameCardPreview } from './GameCardPreview';

export interface GameSelectorProps {
  game: Game;
  /** Open the game picker. */
  onChange?: () => void;
  /** Tap the selected game card. */
  onSelect?: () => void;
  /** Open the rules sheet for this game. */
  onRules?: () => void;
  /** Section heading text. */
  title?: string;
}

/**
 * GameSelector — shows the selected game with a "change game" action. The host
 * picks which game the room will play; reused by every room's setup.
 */
export function GameSelector({ game, onChange, onSelect, onRules, title = 'เกมที่เลือก' }: GameSelectorProps) {
  return (
    <div>
      <div className="row between" style={{ marginBottom: 10 }}>
        <h2 className="th section-title">{title}</h2>
        <div className="row gap8">
          {onRules && <button className="chip" onClick={onRules}><Icon name="book" size={14} /> อ่านกฎ</button>}
          <button className="chip" onClick={onChange}><Icon name="dice" size={14} /> เปลี่ยนเกม</button>
        </div>
      </div>
      <GameCardPreview game={game} height={150} onClick={onRules ?? onSelect} />
    </div>
  );
}
