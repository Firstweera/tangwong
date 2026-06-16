import { GameCard } from '@/components/ui';
import type { Game } from '@/types';

export interface GameCardPreviewProps {
  game: Game;
  height?: number;
  big?: boolean;
  onClick?: () => void;
}

/**
 * GameCardPreview — the game catalog card. Thin wrapper over the design-system
 * GameCard so lobby, home and the games tab render games identically.
 */
export function GameCardPreview({ game, height = 150, big, onClick }: GameCardPreviewProps) {
  return <GameCard game={game} height={height} big={big} onClick={onClick} />;
}
