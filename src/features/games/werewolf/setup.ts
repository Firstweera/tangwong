// Werewolf setup — role composition table, state factories, and shared selectors.
import type { GamePlayer } from '../engine';
import type { WerewolfPublic, WerewolfPrivate, WerewolfRole, WerewolfTeam } from './types.ts';

const COMPOSITION: Record<number, { werewolves: number; villagers: number; spellcaster: boolean; cupid: boolean }> = {
  5:  { werewolves: 1, villagers: 2, spellcaster: false, cupid: false },
  6:  { werewolves: 2, villagers: 1, spellcaster: true,  cupid: false },
  7:  { werewolves: 2, villagers: 1, spellcaster: true,  cupid: true  },
  8:  { werewolves: 2, villagers: 2, spellcaster: true,  cupid: true  },
  9:  { werewolves: 3, villagers: 2, spellcaster: true,  cupid: true  },
  10: { werewolves: 3, villagers: 3, spellcaster: true,  cupid: true  },
};

export function compositionFor(n: number) {
  return COMPOSITION[n] ?? COMPOSITION[5];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function teamOf(role: WerewolfRole): WerewolfTeam {
  return role === 'werewolf' ? 'evil' : 'good';
}

export function buildPublicState(players: GamePlayer[]): WerewolfPublic {
  return {
    playerOrder: players.map(p => p.id),
    eliminatedPlayers: [],
    dayCount: 1,
    nightActors: [],
    nightResolved: false,
    votes: {},
    voteResolved: false,
    lastDeaths: [],
    revealedRoles: {},
    lovers: null,
    silenced: null,
  };
}

export function buildPrivateState(players: GamePlayer[]): Record<string, WerewolfPrivate> {
  const comp = compositionFor(players.length);

  const roles: WerewolfRole[] = [
    ...Array<WerewolfRole>(comp.werewolves).fill('werewolf'),
    'seer',
    'doctor',
    ...(comp.spellcaster ? (['spellcaster'] as WerewolfRole[]) : []),
    ...(comp.cupid      ? (['cupid']      as WerewolfRole[]) : []),
    ...Array<WerewolfRole>(comp.villagers).fill('villager'),
  ];
  const shuffled = shuffle(roles);

  const roleMap: Record<string, WerewolfRole> = {};
  players.forEach((p, i) => { roleMap[p.id] = shuffled[i]; });

  const wolfIds = players.filter(p => roleMap[p.id] === 'werewolf').map(p => p.id);

  const out: Record<string, WerewolfPrivate> = {};
  for (const p of players) {
    const role = roleMap[p.id];
    out[p.id] = {
      role,
      team: teamOf(role),
      sees: role === 'werewolf' ? wolfIds.filter(id => id !== p.id) : [],
      wolfTarget: null,
      wolfVoteTally: {},
      seerTarget: null,
      doctorTarget: null,
      silenceTarget: null,
      doctorLastProtected: null,
      seerHistory: [],
      loverOf: null,
    };
  }
  return out;
}

// ─── Selectors ────────────────────────────────────────────────────────────────

export function alivePlayerIds(pub: WerewolfPublic, players: GamePlayer[]): string[] {
  return players.filter(p => !pub.eliminatedPlayers.includes(p.id)).map(p => p.id);
}

export function livingWolfIds(pub: WerewolfPublic, players: GamePlayer[], priv: Record<string, { data: unknown }>): string[] {
  return alivePlayerIds(pub, players).filter(id => (priv[id]?.data as WerewolfPrivate)?.team === 'evil');
}

export function livingVillagerCount(pub: WerewolfPublic, players: GamePlayer[], priv: Record<string, { data: unknown }>): number {
  return alivePlayerIds(pub, players).filter(id => (priv[id]?.data as WerewolfPrivate)?.team === 'good').length;
}
