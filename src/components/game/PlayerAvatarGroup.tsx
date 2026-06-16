import { AvatarStack } from '@/components/ui';
import type { Player } from '@/types';

export interface PlayerAvatarGroupProps {
  players: Player[];
  size?: number;
  /** Max avatars before collapsing to “+N”. */
  max?: number;
}

/**
 * PlayerAvatarGroup — overlapping stack of player avatars with overflow count.
 * Wraps the design-system AvatarStack; used for voice channels, spectators,
 * "who's here" rows across all games.
 */
export function PlayerAvatarGroup({ players, size = 30, max = 4 }: PlayerAvatarGroupProps) {
  return <AvatarStack people={players} size={size} max={max} />;
}
