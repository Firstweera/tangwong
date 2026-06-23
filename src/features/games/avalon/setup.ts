// Avalon setup — role composition, quest tables, role assignment, vision, and
// shared selectors. Pure functions, no engine/UI dependencies beyond types.
import type { RoleKey, RoleSide } from '../../../types/index.ts';
import { ROLES } from '../../../data.ts';
import type { GamePlayer } from '../engine';
import type { AvalonPublic, AvalonPrivate, QuestRule, SeenPlayer } from './types.ts';

// ─── Tables ─────────────────────────────────────────────────────────────────

/** Number of evil players by player count (5–10). */
const EVIL_BY_COUNT: Record<number, number> = { 5: 2, 6: 2, 7: 3, 8: 3, 9: 3, 10: 4 };

/** Quest team sizes per player count (Q1–Q5). */
const QUEST_SIZES: Record<number, number[]> = {
  5: [2, 3, 2, 3, 3],
  6: [2, 3, 4, 3, 4],
  7: [2, 3, 3, 4, 4],
  8: [3, 4, 4, 5, 5],
  9: [3, 4, 4, 5, 5],
  10: [3, 4, 4, 5, 5],
};

export function questsFor(playerCount: number): QuestRule[] {
  const sizes = QUEST_SIZES[playerCount] ?? QUEST_SIZES[5];
  // Quest 4 (index 3) needs two fail cards with 7+ players.
  return sizes.map((size, i) => ({ size, fails: i === 3 && playerCount >= 7 ? 2 : 1 }));
}

/** Good/evil split for a player count (for the rules screen). */
export function compositionFor(playerCount: number): { players: number; good: number; evil: number } {
  const evil = EVIL_BY_COUNT[playerCount] ?? 2;
  return { players: playerCount, good: playerCount - evil, evil };
}

/** Role composition for a player count, using the available role set. */
export function roleSetFor(playerCount: number): RoleKey[] {
  const evilCount = EVIL_BY_COUNT[playerCount] ?? 2;
  const goodCount = playerCount - evilCount;

  const good: RoleKey[] = ['merlin', 'percival'];
  while (good.length < goodCount) good.push('servant');

  const evil: RoleKey[] = ['assassin', 'morgana'];
  if (evilCount >= 3) evil.push('mordred');
  while (evil.length < evilCount) evil.push('minion');

  return [...good.slice(0, goodCount), ...evil.slice(0, evilCount)];
}

// ─── Assignment + vision ──────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function sideOf(role: RoleKey): RoleSide {
  return ROLES[role].side;
}

/** What `role` sees at setup, given the full role map. */
export function visionFor(
  selfId: string,
  role: RoleKey,
  roleMap: Record<string, RoleKey>,
): SeenPlayer[] {
  const others = Object.entries(roleMap).filter(([id]) => id !== selfId);
  const sees: SeenPlayer[] = [];

  if (role === 'merlin') {
    // Merlin sees all evil EXCEPT Mordred.
    for (const [id, r] of others) {
      if (sideOf(r) === 'evil' && r !== 'mordred') sees.push({ playerId: id, appearsAs: 'evil' });
    }
  } else if (role === 'percival') {
    // Percival sees Merlin and Morgana, but cannot tell them apart.
    for (const [id, r] of others) {
      if (r === 'merlin' || r === 'morgana') sees.push({ playerId: id, appearsAs: 'merlin' });
    }
  } else if (sideOf(role) === 'evil') {
    // Evil players recognise each other (no Oberon in this set).
    for (const [id, r] of others) {
      if (sideOf(r) === 'evil') sees.push({ playerId: id, appearsAs: 'evil' });
    }
  }
  // Loyal Servant sees nothing.
  return sees;
}

// ─── Initial state factories ──────────────────────────────────────────────────

export function buildPublicState(players: GamePlayer[]): AvalonPublic {
  return {
    playerOrder: players.map(p => p.id),
    leaderIndex: 0,
    currentQuest: 0,
    quests: questsFor(players.length),
    results: [null, null, null, null, null],
    proposedTeam: [],
    proposalSubmitted: false,
    votes: {},
    voteComplete: false,
    voteApproved: false,
    rejectCount: 0,
    missionCards: {},
    missionComplete: false,
    lastQuest: null,
    assassinated: null,
  };
}

export function buildPrivateState(players: GamePlayer[]): Record<string, AvalonPrivate> {
  const roles = shuffle(roleSetFor(players.length));
  const roleMap: Record<string, RoleKey> = {};
  players.forEach((p, i) => { roleMap[p.id] = roles[i]; });

  const out: Record<string, AvalonPrivate> = {};
  for (const p of players) {
    const role = roleMap[p.id];
    out[p.id] = { role, side: sideOf(role), sees: visionFor(p.id, role, roleMap) };
  }
  return out;
}

// ─── Selectors ────────────────────────────────────────────────────────────────

export function successCount(pub: AvalonPublic): number {
  return pub.results.filter(r => r === 'success').length;
}

export function failCount(pub: AvalonPublic): number {
  return pub.results.filter(r => r === 'fail').length;
}

export function currentLeaderId(pub: AvalonPublic): string {
  return pub.playerOrder[pub.leaderIndex];
}

export function currentQuestRule(pub: AvalonPublic): QuestRule {
  return pub.quests[pub.currentQuest];
}
