// Server game registry — maps gameId → everything game-action/game-start need.
// Add one entry here when a new game is production-ready; the Edge Functions
// never branch on gameId themselves.
import type {
  GameAction,
  GameEngineConfig,
  GameState,
} from '../../../src/features/games/engine/types.ts';
import { avalonConfig } from '../../../src/features/games/avalon/config.ts';
import { nextBotAction as avalonNextBotAction } from '../../../src/features/games/avalon/bot.ts';
import type { AvalonPrivate, AvalonPublic } from '../../../src/features/games/avalon/types.ts';
import { werewolfConfig } from '../../../src/features/games/werewolf/config.ts';
import { nextBotAction as werewolfNextBotAction } from '../../../src/features/games/werewolf/bot.ts';
import type { WerewolfPrivate, WerewolfPublic } from '../../../src/features/games/werewolf/types.ts';
import { checkpointConfig } from '../../../src/features/games/checkpoint/config.ts';
import { nextBotAction as checkpointNextBotAction } from '../../../src/features/games/checkpoint/bot.ts';
import type { CheckpointPrivate, CheckpointPublic } from '../../../src/features/games/checkpoint/types.ts';

export interface ServerGameEntry {
  config: GameEngineConfig<unknown, unknown>;
  /** Phase to advance into right after createInitialState (which starts at 'lobby'). */
  firstPhase: string;
  /** Return the next bot action for this seat, or null if nothing to do. */
  nextBotAction(state: GameState<unknown, unknown>, playerId: string): GameAction | null;
  /**
   * Build the reveal blob merged into public_data when the game ends.
   * Return {} for games that don't expose hidden info at end-game.
   */
  revealForPublic(state: GameState<unknown, unknown>): Record<string, unknown>;
  /** Action types whose payload must be redacted to { submitted: true } in the game_actions log. */
  privateActionTypes: string[];
}

const avalonEntry: ServerGameEntry = {
  config: avalonConfig as GameEngineConfig<unknown, unknown>,
  firstPhase: 'roleReveal',
  nextBotAction(state, playerId) {
    return avalonNextBotAction(
      state as GameState<AvalonPublic, AvalonPrivate>,
      playerId,
    );
  },
  revealForPublic(state) {
    return Object.fromEntries(
      Object.values(state.private).map((p) => {
        const d = (p as { playerId: string; data: AvalonPrivate }).data;
        return [p.playerId, { role: d.role, side: d.side }];
      }),
    );
  },
  privateActionTypes: ['PLAY_MISSION_CARD'],
};

const werewolfEntry: ServerGameEntry = {
  config: werewolfConfig as GameEngineConfig<unknown, unknown>,
  firstPhase: 'roleReveal',
  nextBotAction(state, playerId) {
    return werewolfNextBotAction(
      state as GameState<WerewolfPublic, WerewolfPrivate>,
      playerId,
    );
  },
  revealForPublic(state) {
    return Object.fromEntries(
      Object.values(state.private).map((p) => {
        const d = (p as { playerId: string; data: WerewolfPrivate }).data;
        return [p.playerId, { role: d.role, team: d.team }];
      }),
    );
  },
  // Night action payloads (targets) are private — redact them in the action log.
  privateActionTypes: ['WEREWOLF_KILL', 'SEER_PEEK', 'DOCTOR_SAVE', 'CUPID_LINK', 'SILENCE'],
};

const checkpointEntry: ServerGameEntry = {
  config: checkpointConfig as GameEngineConfig<unknown, unknown>,
  firstPhase: 'contract',
  nextBotAction(state, playerId) {
    return checkpointNextBotAction(
      state as GameState<CheckpointPublic, CheckpointPrivate>,
      playerId,
    );
  },
  revealForPublic() {
    return {};
  },
  privateActionTypes: ['CHOOSE_CONTRACT', 'SUBMIT_CRATE', 'SUBMIT_OFFER'],
};

export const GAME_REGISTRY: Record<string, ServerGameEntry> = {
  avalon: avalonEntry,
  werewolf: werewolfEntry,
  checkpoint: checkpointEntry,
};
