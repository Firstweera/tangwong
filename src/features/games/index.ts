// Games — the shared engine plus each game's definition (one folder per game).
export * from './engine';
export * as avalon from './avalon';
export { getGameRules } from './rules';
export type { GameRules, RuleStep, RuleRole, GameComposition } from './rules';
export { getGameEntry } from './registry';
export type { GameRegistryEntry, GameUIProps } from './registry';
