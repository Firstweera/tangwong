import type { GameState, WinCondition } from '../engine';
import { deliveredLegalCount } from './market.ts';
import type { CheckpointPrivate, CheckpointPublic } from './types.ts';

/**
 * Highest final score wins (`wealth` already includes completed Contracts at game end).
 * Ties: most delivered Legal goods, then most remaining baht, then shared victory.
 */
export function checkpointWinners(pub: CheckpointPublic): string[] {
  const tiers: ((id: string) => number)[] = [
    id => pub.wealth[id] ?? 0,
    id => deliveredLegalCount(pub.delivered[id] ?? {}),
    id => pub.cash[id] ?? 0,
  ];
  let leaders = [...pub.playerOrder];
  for (const score of tiers) {
    const top = Math.max(...leaders.map(score));
    leaders = leaders.filter(id => score(id) === top);
    if (leaders.length <= 1) break;
  }
  return leaders;
}

export const checkpointWealthWin: WinCondition<CheckpointPublic, CheckpointPrivate> = {
  id: 'checkpoint-wealth',
  type: 'score',
  check(state: GameState<CheckpointPublic, CheckpointPrivate>) {
    const pub = state.public.data;
    if (!pub.gameComplete) return null;
    return {
      conditionId: 'checkpoint-wealth',
      type: 'score',
      winners: checkpointWinners(pub),
      scores: pub.wealth,
      reason: 'Highest final score after two gatekeeper rotations',
      reasonTh: 'คะแนนรวมสูงสุดหลังทุกคนคุมด่านครบ 2 ครั้ง',
    };
  },
};
