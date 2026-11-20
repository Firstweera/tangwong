// Game runtime registry — everything an authoritative host needs to run a game
// besides the engine config: first phase, bot policy, end-game reveal, which
// action payloads are secret, and local bot pacing.
//
// Used by LocalTransport (offline / dev). Mirrors
// supabase/functions/_shared/games.ts; the Edge Functions can switch to this
// file later (follow-up — needs a redeploy). Keep imports relative with `.ts`
// extensions and free of `@/` aliases so Deno can import it too.
import type { GameAction, GameEngineConfig, GameState } from './engine/types.ts';
import { avalonConfig } from './avalon/config.ts';
import { nextBotAction as avalonBot } from './avalon/bot.ts';
import type { AvalonPrivate, AvalonPublic } from './avalon/types.ts';
import { werewolfConfig } from './werewolf/config.ts';
import { nextBotAction as werewolfBot } from './werewolf/bot.ts';
import type { WerewolfPrivate, WerewolfPublic } from './werewolf/types.ts';
import { checkpointConfig } from './checkpoint/config.ts';
import { nextBotAction as checkpointBot } from './checkpoint/bot.ts';
import type { CheckpointPrivate, CheckpointPublic } from './checkpoint/types.ts';

type AnyState = GameState<unknown, unknown>;

export interface GameRuntime {
  config: GameEngineConfig<unknown, unknown>;
  /** Phase to enter right after createInitialState (which starts at 'lobby'). */
  firstPhase: string;
  /** Next action this seat would take now, or null. Reads full state. */
  nextBotAction(state: AnyState, playerId: string): GameAction | null;
  /** Hidden info published as `public.data.reveal` once the game has a winner. */
  revealForPublic(state: AnyState): Record<string, unknown>;
  /** Action types whose payload is secret (redacted in logs). */
  privateActionTypes: string[];
  /** Delay between local bot moves so players can follow along. */
  botDelayMs: number;
}

const privates = <T>(state: AnyState) =>
  Object.values(state.private) as { playerId: string; data: T }[];

const RUNTIMES: Record<string, GameRuntime> = {
  avalon: {
    config: avalonConfig as GameEngineConfig<unknown, unknown>,
    firstPhase: 'roleReveal',
    nextBotAction: (s, id) => avalonBot(s as GameState<AvalonPublic, AvalonPrivate>, id),
    revealForPublic: s =>
      Object.fromEntries(privates<AvalonPrivate>(s).map(p => [p.playerId, { role: p.data.role, side: p.data.side }])),
    privateActionTypes: ['PLAY_MISSION_CARD'],
    botDelayMs: 900,
  },
  werewolf: {
    config: werewolfConfig as GameEngineConfig<unknown, unknown>,
    firstPhase: 'roleReveal',
    nextBotAction: (s, id) => werewolfBot(s as GameState<WerewolfPublic, WerewolfPrivate>, id),
    revealForPublic: s =>
      Object.fromEntries(privates<WerewolfPrivate>(s).map(p => [p.playerId, { role: p.data.role, team: p.data.team }])),
    privateActionTypes: ['WEREWOLF_KILL', 'SEER_PEEK', 'DOCTOR_SAVE', 'CUPID_LINK', 'SILENCE'],
    botDelayMs: 900,
  },
  checkpoint: {
    config: checkpointConfig as GameEngineConfig<unknown, unknown>,
    firstPhase: 'contract',
    nextBotAction: (s, id) => checkpointBot(s as GameState<CheckpointPublic, CheckpointPrivate>, id),
    revealForPublic: () => ({}),
    privateActionTypes: ['CHOOSE_CONTRACT', 'SUBMIT_CRATE', 'SUBMIT_OFFER'],
    botDelayMs: 520,
  },
};

export function getGameRuntime(gameId: string): GameRuntime | null {
  return RUNTIMES[gameId] ?? null;
}
