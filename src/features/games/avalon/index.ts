// Avalon game — public surface.
export { avalonConfig } from './config.ts';
export { AVALON_PHASES } from './phases.ts';
export { AVALON_ACTIONS } from './actions.ts';
export { AVALON_WIN_CONDITIONS } from './winConditions.ts';
export {
  questsFor, roleSetFor, visionFor, sideOf,
  buildPublicState, buildPrivateState,
  successCount, failCount, currentLeaderId, currentQuestRule,
} from './setup.ts';
export type {
  AvalonPhase, AvalonPublic, AvalonPrivate, QuestOutcome, QuestRule, SeenPlayer,
} from './types.ts';
