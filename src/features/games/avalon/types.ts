// Avalon — game-specific state types layered on the generic engine.
import type { RoleKey, RoleSide } from '@/types';

/** Avalon's phase flow (declared as engine GamePhase strings). */
export type AvalonPhase =
  | 'lobby'
  | 'roleReveal'
  | 'teamProposal'
  | 'teamVote'
  | 'mission'
  | 'questReveal'
  | 'assassinate'
  | 'end';

export type QuestOutcome = 'success' | 'fail';

export interface QuestRule {
  /** Number of players sent on this quest. */
  size: number;
  /** Fail cards required for the quest to fail (2 on quest 4 with 7+ players). */
  fails: number;
}

/** State visible to everyone. */
export interface AvalonPublic {
  /** Seating order; leader rotates through this. */
  playerOrder: string[];
  leaderIndex: number;
  /** 0-based index of the quest in progress. */
  currentQuest: number;
  quests: QuestRule[];
  /** Outcome per quest (length 5); null until played. */
  results: (QuestOutcome | null)[];

  // ─ current proposal / vote ─
  proposedTeam: string[];
  proposalSubmitted: boolean;
  /** playerId → approve (revealed; votes are public in Avalon). */
  votes: Record<string, boolean>;
  voteComplete: boolean;
  voteApproved: boolean;
  /** Consecutive rejected proposals on this quest (5 = evil wins). */
  rejectCount: number;

  // ─ current mission ─
  /** playerId → card. SECRET — must be redacted before broadcast. Cleared once resolved. */
  missionCards: Record<string, QuestOutcome>;
  missionComplete: boolean;
  /** Summary of the most recently resolved quest (for the reveal screen). */
  lastQuest: { outcome: QuestOutcome; fails: number; quest: number } | null;

  // ─ endgame ─
  assassinated: { targetId: string; wasMerlin: boolean } | null;
}

/** How a seen player appears to the viewer. */
export interface SeenPlayer {
  playerId: string;
  /** 'evil' = a villain (to Merlin / villains); 'merlin' = Merlin-or-Morgana (to Percival). */
  appearsAs: 'evil' | 'merlin';
}

/** State visible only to its owner. */
export interface AvalonPrivate {
  role: RoleKey;
  side: RoleSide;
  /** Players this role can see at setup, and how they appear. */
  sees: SeenPlayer[];
}
