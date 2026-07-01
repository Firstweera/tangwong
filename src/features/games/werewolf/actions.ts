// Werewolf actions — validator + handler per action type.
import type { ActionDef, GameState } from '../engine';
import type { WerewolfPublic, WerewolfPrivate, DeathRecord, WerewolfRole, SeerInspection } from './types.ts';
import { alivePlayers, eliminate } from '../engine/playerUtils.ts';

type State = GameState<WerewolfPublic, WerewolfPrivate>;

const P = (s: State) => s.public.data;
const getPriv = (s: State, id: string) => s.private[id]?.data as WerewolfPrivate | undefined;

function patch(s: State, data: Partial<WerewolfPublic>): State {
  return { ...s, public: { ...s.public, data: { ...s.public.data, ...data } } };
}

function patchPriv(s: State, id: string, data: Partial<WerewolfPrivate>): State {
  const prev = s.private[id];
  return {
    ...s,
    private: {
      ...s.private,
      [id]: { ...prev, data: { ...(prev?.data as WerewolfPrivate), ...data } },
    },
  };
}

/** If `deadId` is a lover, eliminate their partner and append to deaths/revealedRoles. */
function applyLoverDeath(
  s: State,
  deadId: string,
  eliminated: string[],
  lastDeaths: DeathRecord[],
  revealedRoles: Record<string, WerewolfRole>,
): { eliminated: string[]; lastDeaths: DeathRecord[]; revealedRoles: Record<string, WerewolfRole> } {
  const lovers = P(s).lovers;
  if (!lovers) return { eliminated, lastDeaths, revealedRoles };
  const [l1, l2] = lovers;
  const otherId = deadId === l1 ? l2 : deadId === l2 ? l1 : null;
  if (!otherId || eliminated.includes(otherId)) return { eliminated, lastDeaths, revealedRoles };
  const otherRole = getPriv(s, otherId)?.role ?? 'villager';
  return {
    eliminated: eliminate(eliminated, otherId),
    lastDeaths: [...lastDeaths, { playerId: otherId, role: otherRole, cause: 'heartbreak' }],
    revealedRoles: { ...revealedRoles, [otherId]: otherRole },
  };
}

/** Player IDs that MUST submit a night action this cycle. */
function requiredNightActors(s: State): string[] {
  const pub = P(s);
  return alivePlayers(s.room.players, pub.eliminatedPlayers)
    .filter(p => {
      const role = getPriv(s, p.id)?.role;
      if (!role) return false;
      if (role === 'werewolf' || role === 'seer' || role === 'doctor' || role === 'spellcaster') return true;
      if (role === 'cupid' && pub.dayCount === 1 && !pub.lovers) return true;
      return false;
    })
    .map(p => p.id);
}

/** True once every required night actor has been added to nightActors. */
function allNightActed(s: State): boolean {
  const required = requiredNightActors(s);
  return required.length > 0 && required.every(id => P(s).nightActors.includes(id));
}

function resolveNight(s: State): State {
  const pub = P(s);

  // Collect wolf target
  let wolfTarget: string | null = null;
  for (const p of s.room.players) {
    if (pub.eliminatedPlayers.includes(p.id)) continue;
    const pd = getPriv(s, p.id);
    if (pd?.role === 'werewolf' && pd.wolfTarget) { wolfTarget = pd.wolfTarget; break; }
  }

  // Doctor
  let doctorTarget: string | null = null;
  let doctorId: string | null = null;
  for (const p of s.room.players) {
    if (pub.eliminatedPlayers.includes(p.id)) continue;
    const pd = getPriv(s, p.id);
    if (pd?.role === 'doctor') { doctorTarget = pd.doctorTarget; doctorId = p.id; break; }
  }

  // Seer
  let seerTargetId: string | null = null;
  let seerId: string | null = null;
  let seerResult: 'evil' | 'not-evil' | null = null;
  for (const p of s.room.players) {
    if (pub.eliminatedPlayers.includes(p.id)) continue;
    const pd = getPriv(s, p.id);
    if (pd?.role === 'seer' && pd.seerTarget) {
      seerId = p.id;
      seerTargetId = pd.seerTarget;
      const targetTeam = getPriv(s, seerTargetId)?.team;
      seerResult = targetTeam === 'evil' ? 'evil' : 'not-evil';
      break;
    }
  }

  // Spellcaster target (applies for next day)
  let silenceTarget: string | null = null;
  for (const p of s.room.players) {
    if (pub.eliminatedPlayers.includes(p.id)) continue;
    const pd = getPriv(s, p.id);
    if (pd?.role === 'spellcaster' && pd.silenceTarget) { silenceTarget = pd.silenceTarget; break; }
  }

  // Apply wolf kill (protection overrides)
  const killed = wolfTarget && wolfTarget !== doctorTarget ? wolfTarget : null;
  let eliminated = pub.eliminatedPlayers;
  let lastDeaths: DeathRecord[] = [];
  let revealedRoles: Record<string, WerewolfRole> = { ...pub.revealedRoles };

  if (killed) {
    const killedRole = getPriv(s, killed)?.role ?? 'villager';
    lastDeaths.push({ playerId: killed, role: killedRole, cause: 'killed' });
    eliminated = eliminate(eliminated, killed);
    revealedRoles[killed] = killedRole;
    // Lover dies of heartbreak
    const ld = applyLoverDeath(s, killed, eliminated, lastDeaths, revealedRoles);
    eliminated = ld.eliminated;
    lastDeaths = ld.lastDeaths;
    revealedRoles = ld.revealedRoles;
  }

  // Clear night targets + update persistent fields across all players
  let next: State = s;
  for (const p of s.room.players) {
    const pd = getPriv(next, p.id);
    if (!pd) continue;
    const updates: Partial<WerewolfPrivate> = {
      wolfTarget: null, seerTarget: null, doctorTarget: null, silenceTarget: null,
    };
    if (p.id === doctorId) updates.doctorLastProtected = doctorTarget;
    if (p.id === seerId && seerTargetId && seerResult !== null) {
      const entry: SeerInspection = { playerId: seerTargetId, result: seerResult, dayCount: pub.dayCount };
      updates.seerHistory = [...(pd.seerHistory ?? []), entry];
    }
    next = patchPriv(next, p.id, updates);
  }

  // Silenced player must be alive to receive the silence
  const effectiveSilence = silenceTarget && !eliminated.includes(silenceTarget) ? silenceTarget : null;

  return patch(next, {
    eliminatedPlayers: eliminated,
    lastDeaths,
    revealedRoles,
    nightActors: [],
    nightResolved: true,
    silenced: effectiveSilence,
  });
}

// ─── WEREWOLF_KILL ────────────────────────────────────────────────────────────

const werewolfKill: ActionDef<WerewolfPublic, WerewolfPrivate> = {
  validate(s, a) {
    const pub = P(s);
    if (pub.eliminatedPlayers.includes(a.playerId)) return { valid: false, error: 'You are eliminated' };
    if (getPriv(s, a.playerId)?.role !== 'werewolf') return { valid: false, error: 'Only werewolves can kill' };
    if (pub.nightActors.includes(a.playerId)) return { valid: false, error: 'You have already submitted your kill' };
    const targetId = (a.payload as { targetId?: string })?.targetId;
    if (!targetId) return { valid: false, error: 'No target specified' };
    if (pub.eliminatedPlayers.includes(targetId) || !s.room.players.some(p => p.id === targetId)) {
      return { valid: false, error: 'Invalid target' };
    }
    for (const p of s.room.players) {
      if (p.id === a.playerId || pub.eliminatedPlayers.includes(p.id)) continue;
      const pd = getPriv(s, p.id);
      if (pd?.role === 'werewolf' && pub.nightActors.includes(p.id)) {
        if (pd.wolfTarget !== null && pd.wolfTarget !== targetId) {
          return { valid: false, error: 'Wolves must agree — another wolf chose a different target' };
        }
      }
    }
    return { valid: true };
  },
  handle(s, a) {
    const targetId = (a.payload as { targetId: string }).targetId;
    let next = patchPriv(s, a.playerId, { wolfTarget: targetId });
    next = patch(next, { nightActors: [...P(next).nightActors, a.playerId] });
    if (allNightActed(next)) next = resolveNight(next);
    return next;
  },
};

// ─── SEER_PEEK ────────────────────────────────────────────────────────────────

const seerPeek: ActionDef<WerewolfPublic, WerewolfPrivate> = {
  validate(s, a) {
    const pub = P(s);
    if (pub.eliminatedPlayers.includes(a.playerId)) return { valid: false, error: 'You are eliminated' };
    if (getPriv(s, a.playerId)?.role !== 'seer') return { valid: false, error: 'Only the Seer can inspect' };
    if (pub.nightActors.includes(a.playerId)) return { valid: false, error: 'You have already inspected' };
    const targetId = (a.payload as { targetId?: string })?.targetId;
    if (!targetId) return { valid: false, error: 'No target specified' };
    if (targetId === a.playerId) return { valid: false, error: 'Cannot inspect yourself' };
    if (pub.eliminatedPlayers.includes(targetId) || !s.room.players.some(p => p.id === targetId)) {
      return { valid: false, error: 'Invalid target' };
    }
    return { valid: true };
  },
  handle(s, a) {
    const targetId = (a.payload as { targetId: string }).targetId;
    let next = patchPriv(s, a.playerId, { seerTarget: targetId });
    next = patch(next, { nightActors: [...P(next).nightActors, a.playerId] });
    if (allNightActed(next)) next = resolveNight(next);
    return next;
  },
};

// ─── DOCTOR_SAVE ──────────────────────────────────────────────────────────────

const doctorSave: ActionDef<WerewolfPublic, WerewolfPrivate> = {
  validate(s, a) {
    const pub = P(s);
    if (pub.eliminatedPlayers.includes(a.playerId)) return { valid: false, error: 'You are eliminated' };
    if (getPriv(s, a.playerId)?.role !== 'doctor') return { valid: false, error: 'Only the Doctor can protect' };
    if (pub.nightActors.includes(a.playerId)) return { valid: false, error: 'You have already protected someone' };
    const targetId = (a.payload as { targetId?: string })?.targetId;
    if (!targetId) return { valid: false, error: 'No target specified' };
    if (pub.eliminatedPlayers.includes(targetId) || !s.room.players.some(p => p.id === targetId)) {
      return { valid: false, error: 'Invalid target' };
    }
    if (targetId === getPriv(s, a.playerId)?.doctorLastProtected) {
      return { valid: false, error: 'Cannot protect the same player two nights in a row' };
    }
    return { valid: true };
  },
  handle(s, a) {
    const targetId = (a.payload as { targetId: string }).targetId;
    let next = patchPriv(s, a.playerId, { doctorTarget: targetId });
    next = patch(next, { nightActors: [...P(next).nightActors, a.playerId] });
    if (allNightActed(next)) next = resolveNight(next);
    return next;
  },
};

// ─── CUPID_LINK (night 1, cupid) ──────────────────────────────────────────────

const cupidLink: ActionDef<WerewolfPublic, WerewolfPrivate> = {
  validate(s, a) {
    const pub = P(s);
    if (pub.eliminatedPlayers.includes(a.playerId)) return { valid: false, error: 'You are eliminated' };
    if (getPriv(s, a.playerId)?.role !== 'cupid') return { valid: false, error: 'Only Cupid can link lovers' };
    if (pub.nightActors.includes(a.playerId)) return { valid: false, error: 'Already linked lovers this night' };
    if (pub.dayCount !== 1) return { valid: false, error: 'Cupid can only link on night 1' };
    if (pub.lovers) return { valid: false, error: 'Lovers already linked' };
    const { targetIds } = (a.payload ?? {}) as { targetIds?: [string, string] };
    if (!targetIds || targetIds.length !== 2) return { valid: false, error: 'Must select exactly 2 players' };
    if (targetIds[0] === targetIds[1]) return { valid: false, error: 'Cannot link a player to themselves' };
    for (const id of targetIds) {
      if (pub.eliminatedPlayers.includes(id) || !s.room.players.some(p => p.id === id)) {
        return { valid: false, error: 'Invalid target' };
      }
    }
    return { valid: true };
  },
  handle(s, a) {
    const { targetIds } = a.payload as { targetIds: [string, string] };
    const [l1, l2] = targetIds;
    let next = patch(s, {
      lovers: [l1, l2],
      nightActors: [...P(s).nightActors, a.playerId],
    });
    next = patchPriv(next, l1, { loverOf: l2 });
    next = patchPriv(next, l2, { loverOf: l1 });
    if (allNightActed(next)) next = resolveNight(next);
    return next;
  },
};

// ─── SILENCE (night, spellcaster) ─────────────────────────────────────────────

const silenceAction: ActionDef<WerewolfPublic, WerewolfPrivate> = {
  validate(s, a) {
    const pub = P(s);
    if (pub.eliminatedPlayers.includes(a.playerId)) return { valid: false, error: 'You are eliminated' };
    if (getPriv(s, a.playerId)?.role !== 'spellcaster') return { valid: false, error: 'Only the Spell-caster can silence' };
    if (pub.nightActors.includes(a.playerId)) return { valid: false, error: 'Already silenced someone this night' };
    const targetId = (a.payload as { targetId?: string })?.targetId;
    if (!targetId) return { valid: false, error: 'No target specified' };
    if (pub.eliminatedPlayers.includes(targetId) || !s.room.players.some(p => p.id === targetId)) {
      return { valid: false, error: 'Invalid target' };
    }
    return { valid: true };
  },
  handle(s, a) {
    const targetId = (a.payload as { targetId: string }).targetId;
    let next = patchPriv(s, a.playerId, { silenceTarget: targetId });
    next = patch(next, { nightActors: [...P(next).nightActors, a.playerId] });
    if (allNightActed(next)) next = resolveNight(next);
    return next;
  },
};

// ─── LYNCH_VOTE (dayVote, all living players) ─────────────────────────────────

const lynchVote: ActionDef<WerewolfPublic, WerewolfPrivate> = {
  validate(s, a) {
    const pub = P(s);
    if (pub.eliminatedPlayers.includes(a.playerId)) return { valid: false, error: 'You are eliminated' };
    if (a.playerId in pub.votes) return { valid: false, error: 'You have already voted' };
    const targetId = (a.payload as { targetId?: string | null })?.targetId ?? null;
    if (targetId !== null) {
      if (pub.eliminatedPlayers.includes(targetId) || !s.room.players.some(p => p.id === targetId)) {
        return { valid: false, error: 'Invalid target' };
      }
    }
    return { valid: true };
  },
  handle(s, a) {
    const targetId = (a.payload as { targetId?: string | null })?.targetId ?? null;
    const alive = alivePlayers(s.room.players, P(s).eliminatedPlayers);
    const newVotes: Record<string, string | null> = { ...P(s).votes, [a.playerId]: targetId };

    // Wait for every living player to vote (silenced players can still vote).
    if (Object.keys(newVotes).length < alive.length) {
      return patch(s, { votes: newVotes });
    }

    // All votes in — compute lynch (strict majority of voters required).
    const tally: Record<string, number> = {};
    for (const v of Object.values(newVotes)) {
      if (v) tally[v] = (tally[v] ?? 0) + 1;
    }
    const voterCount = Object.keys(newVotes).length;
    const majority = Math.floor(voterCount / 2) + 1;
    let lynched: string | null = null;
    for (const [id, count] of Object.entries(tally)) {
      if (count >= majority) { lynched = id; break; }
    }

    let eliminated = P(s).eliminatedPlayers;
    let lastDeaths: DeathRecord[] = [];
    let revealedRoles: Record<string, WerewolfRole> = { ...P(s).revealedRoles };

    if (lynched) {
      const role = getPriv(s, lynched)?.role ?? 'villager';
      lastDeaths = [...lastDeaths, { playerId: lynched, role, cause: 'lynched' }];
      eliminated = eliminate(eliminated, lynched);
      revealedRoles = { ...revealedRoles, [lynched]: role };
      // Lover dies of heartbreak
      const ld = applyLoverDeath(s, lynched, eliminated, lastDeaths, revealedRoles);
      eliminated = ld.eliminated;
      lastDeaths = ld.lastDeaths;
      revealedRoles = ld.revealedRoles;
    }

    return patch(s, { votes: newVotes, voteResolved: true, eliminatedPlayers: eliminated, lastDeaths, revealedRoles });
  },
};

// ─── CONTINUE (host) ──────────────────────────────────────────────────────────

const continueGame: ActionDef<WerewolfPublic, WerewolfPrivate> = {
  validate: (s, a) =>
    s.room.hostId === a.playerId ? { valid: true } : { valid: false, error: 'Only the host can continue' },
  handle(s) {
    if (s.public.phase === 'resolve') {
      return patch(s, {
        dayCount: P(s).dayCount + 1,
        votes: {},
        voteResolved: false,
        lastDeaths: [],
        nightActors: [],
        nightResolved: false,
        silenced: null,
      });
    }
    return s;
  },
};

export const WEREWOLF_ACTIONS: Record<string, ActionDef<WerewolfPublic, WerewolfPrivate>> = {
  WEREWOLF_KILL: werewolfKill,
  SEER_PEEK: seerPeek,
  DOCTOR_SAVE: doctorSave,
  CUPID_LINK: cupidLink,
  SILENCE: silenceAction,
  LYNCH_VOTE: lynchVote,
  CONTINUE: continueGame,
};
