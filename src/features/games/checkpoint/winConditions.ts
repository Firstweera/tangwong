import type { GameState, WinCondition } from '../engine';
import type { CheckpointPrivate, CheckpointPublic } from './types.ts';

export const checkpointWealthWin: WinCondition<CheckpointPublic, CheckpointPrivate> = {
  id: 'checkpoint-wealth',
  type: 'score',
  check(state: GameState<CheckpointPublic, CheckpointPrivate>) {
    const pub = state.public.data;
    if (!pub.gameComplete) return null;
    const top = Math.max(...Object.values(pub.wealth));
    return {
      conditionId: 'checkpoint-wealth',
      type: 'score',
      winners: pub.playerOrder.filter(id => pub.wealth[id] === top),
      scores: pub.wealth,
      reason: 'Highest total wealth after two gatekeeper rotations',
      reasonTh: 'มีความมั่งคั่งรวมสูงสุดหลังทุกคนคุมด่านครบ 2 ครั้ง',
    };
  },
};

