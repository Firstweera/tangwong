// Client game registry — maps gameId → config + UI component + rules.
// GamePage routes through here; adding a new game = one entry below.
import type { ComponentType } from 'react';
import type { GameEngineConfig, GameState, RoomState } from './engine/types';
import type { Player } from '../../types/index.ts';
import type { GameRules } from './rules';
import { avalonConfig } from './avalon/config';
import { avalonRules } from './avalon/rules';
import { AvalonGame } from './avalon/ui';
import { werewolfConfig } from './werewolf/config';
import { werewolfRules } from './werewolf/rules';
import { WerewolfGame } from './werewolf/ui';
import { checkpointConfig } from './checkpoint/config';
import { checkpointRules } from './checkpoint/rules';
import { CheckpointGame } from './checkpoint/ui';

/** Props contract every in-game UI component must satisfy. */
export interface GameUIProps {
  roomState: RoomState;
  players: Player[];
  meId: string;
  onExit: () => void;
  onEnd: (state: GameState) => void;
  externalState?: GameState | null;
  onSubmitAction?: (type: string, payload: unknown) => void | Promise<void>;
  onStartGame?: () => void | Promise<void>;
  onTimeout?: () => void | Promise<void>;
  onlineMode?: boolean;
  loading?: boolean;
  /** An online action is in flight — disables controls to prevent double-submit. */
  busy?: boolean;
  /** Latest online action/sync error surfaced to the player as a toast. */
  error?: string | null;
  showToast?: (message: string, emoji?: string) => void;
}

export interface GameRegistryEntry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config: GameEngineConfig<any, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ui: ComponentType<any>;
  rules: GameRules | null;
}

const REGISTRY: Record<string, GameRegistryEntry> = {
  avalon: {
    config: avalonConfig,
    ui: AvalonGame,
    rules: avalonRules,
  },
  werewolf: {
    config: werewolfConfig,
    ui: WerewolfGame,
    rules: werewolfRules,
  },
  checkpoint: {
    config: checkpointConfig,
    ui: CheckpointGame,
    rules: checkpointRules,
  },
};

export function getGameEntry(gameId: string): GameRegistryEntry | null {
  return REGISTRY[gameId] ?? null;
}
