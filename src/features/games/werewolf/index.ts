// Werewolf engine — public barrel.
export { werewolfConfig } from './config.ts';
export { nextBotAction, nextAutoActor } from './bot.ts';
export { buildPublicState, buildPrivateState, compositionFor, teamOf, alivePlayerIds } from './setup.ts';
export { WEREWOLF_PHASES } from './phases.ts';
export { WEREWOLF_ACTIONS } from './actions.ts';
export { WEREWOLF_WIN_CONDITIONS } from './winConditions.ts';
export type {
  WerewolfRole,
  WerewolfTeam,
  WerewolfPhase,
  WerewolfPublic,
  WerewolfPrivate,
  DeathRecord,
  SeerInspection,
} from './types.ts';
