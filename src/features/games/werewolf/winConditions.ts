// Werewolf win conditions. Evaluated by the engine after every action.
// loversWin is checked FIRST — two lovers as the last survivors beats village/wolf outcomes.
// Village-wins is listed second so that a lynch that kills the last wolf is
// correctly counted as a village win even if parity is simultaneously reached.
import type { WinCondition, GameState } from '../engine';
import type { WerewolfPublic, WerewolfPrivate } from './types.ts';

type S = GameState<WerewolfPublic, WerewolfPrivate>;

function pub(s: S) { return s.public.data; }
function privRole(s: S, id: string) { return (s.private[id]?.data as WerewolfPrivate)?.team; }

function alive(s: S) {
  return s.room.players.filter(p => !pub(s).eliminatedPlayers.includes(p.id));
}

function aliveWolves(s: S) { return alive(s).filter(p => privRole(s, p.id) === 'evil'); }
function aliveVillagers(s: S) { return alive(s).filter(p => privRole(s, p.id) === 'good'); }

// ─── Lovers win ───────────────────────────────────────────────────────────────

const loversWin: WinCondition<WerewolfPublic, WerewolfPrivate> = {
  id: 'lovers-survive',
  type: 'team',
  check(s) {
    const lovers = pub(s).lovers;
    if (!lovers) return null;
    const [l1, l2] = lovers;
    const aliveIds = alive(s).map(p => p.id);
    // Both lovers alive and exactly 2 players remain
    if (aliveIds.length !== 2) return null;
    if (!aliveIds.includes(l1) || !aliveIds.includes(l2)) return null;
    return {
      conditionId: 'lovers-survive',
      type: 'team',
      winnerTeam: 'good',
      winners: [l1, l2],
      reason: 'The lovers survived together as the last two players',
      reasonTh: 'คู่รักรอดมาด้วยกันเป็นคนสุดท้าย 💘',
    };
  },
};

// ─── Village wins ─────────────────────────────────────────────────────────────

const villageWins: WinCondition<WerewolfPublic, WerewolfPrivate> = {
  id: 'village-wins',
  type: 'team',
  check(s) {
    if (aliveWolves(s).length > 0) return null;
    // Don't trigger before the game has actually started (no roles assigned).
    if (s.room.players.every(p => s.private[p.id] == null)) return null;
    const winners = aliveVillagers(s).map(p => p.id);
    return {
      conditionId: 'village-wins',
      type: 'team',
      winnerTeam: 'good',
      winners,
      reason: 'All werewolves have been eliminated',
      reasonTh: 'หมาป่าทั้งหมดถูกกำจัดออกไปแล้ว',
    };
  },
};

// ─── Werewolves win (parity) ──────────────────────────────────────────────────

const wolvesWin: WinCondition<WerewolfPublic, WerewolfPrivate> = {
  id: 'wolves-parity',
  type: 'team',
  check(s) {
    const wolves = aliveWolves(s);
    const villagers = aliveVillagers(s);
    if (wolves.length === 0) return null;
    if (wolves.length < villagers.length) return null;
    const winners = wolves.map(p => p.id);
    return {
      conditionId: 'wolves-parity',
      type: 'team',
      winnerTeam: 'evil',
      winners,
      reason: 'Werewolves equal or outnumber the remaining villagers',
      reasonTh: 'หมาป่ามีจำนวนเท่ากับหรือมากกว่าชาวบ้านที่เหลือ',
    };
  },
};

export const WEREWOLF_WIN_CONDITIONS: WinCondition<WerewolfPublic, WerewolfPrivate>[] = [
  loversWin,
  villageWins,
  wolvesWin,
];
