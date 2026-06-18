// Avalon win conditions — checked by the engine after every action.
import type { WinCondition, WinResult, GameState } from '../engine';
import type { AvalonPublic, AvalonPrivate } from './types';
import { failCount } from './setup';

type State = GameState<AvalonPublic, AvalonPrivate>;

function playersBySide(s: State, side: 'good' | 'evil'): string[] {
  return Object.values(s.private)
    .filter(p => (p.data as AvalonPrivate).side === side)
    .map(p => p.playerId);
}

function evilWin(s: State, conditionId: string, reasonTh: string, reason: string): WinResult {
  return { conditionId, type: 'team', winnerTeam: 'evil', winners: playersBySide(s, 'evil'), reason, reasonTh };
}

function goodWin(s: State, conditionId: string, reasonTh: string, reason: string): WinResult {
  return { conditionId, type: 'team', winnerTeam: 'good', winners: playersBySide(s, 'good'), reason, reasonTh };
}

export const AVALON_WIN_CONDITIONS: WinCondition<AvalonPublic, AvalonPrivate>[] = [
  {
    id: 'evil-hammer',
    type: 'team',
    check: (s) => s.public.data.rejectCount >= 5
      ? evilWin(s, 'evil-hammer', 'ทีมถูกปฏิเสธ 5 ครั้งติดต่อกัน', 'Five rejected proposals in a row')
      : null,
  },
  {
    id: 'evil-three-fails',
    type: 'team',
    check: (s) => failCount(s.public.data) >= 3
      ? evilWin(s, 'evil-three-fails', 'ภารกิจล้มเหลว 3 ครั้ง', 'Three quests failed')
      : null,
  },
  {
    id: 'assassin',
    type: 'team',
    check: (s) => {
      const a = s.public.data.assassinated;
      if (!a) return null;
      return a.wasMerlin
        ? evilWin(s, 'assassin', 'นักลอบสังหารฆ่าเมอร์ลินสำเร็จ', 'The Assassin killed Merlin')
        : goodWin(s, 'assassin', 'ฝ่ายดีทำ 3 ภารกิจสำเร็จ และเมอร์ลินรอดชีวิต', 'Good won 3 quests and Merlin survived');
    },
  },
];
