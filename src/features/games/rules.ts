// Game rules — UI-facing rule sheets derived from each game's real engine
// (player counts, roles, quest structure, win conditions). Only games with an
// engine appear here; others have no rules yet.
import { avalonRules } from './avalon/rules';
import { werewolfRules } from './werewolf/rules';

export interface RuleStep { emoji: string; title: string; desc: string; }
export interface RuleRole { em: string; name: string; side: 'good' | 'evil'; desc: string; }
export interface GameComposition { players: number; good: number; evil: number; }

export interface GameRules {
  /** Win objective summary. */
  goal: string;
  /** Player-count range, e.g. "5–10". */
  players: string;
  /** How-to-play steps (one per game phase). */
  steps: RuleStep[];
  /** Roles in the game (hidden-role games). */
  roles?: RuleRole[];
  /** Good/evil split per player count. */
  composition?: GameComposition[];
  /** Note about the quest/round structure. */
  structure?: string;
  /** Win conditions, one line each. */
  win?: string[];
  tips?: string[];
}

const REGISTRY: Record<string, GameRules> = {
  avalon: avalonRules,
  werewolf: werewolfRules,
};

export function getGameRules(gameId: string): GameRules | null {
  return REGISTRY[gameId] ?? null;
}
