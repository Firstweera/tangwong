// Werewolf bot — deterministic next action for each player/phase combination.
// Used by the server auto-GM and the offline auto-play mode.
import type { GameState, GameAction } from '../engine';
import type { WerewolfPublic, WerewolfPrivate } from './types.ts';
import { alivePlayers } from '../engine/playerUtils.ts';

type S = GameState<WerewolfPublic, WerewolfPrivate>;

const P = (s: S) => s.public.data;
const getPriv = (s: S, id: string) => s.private[id]?.data as WerewolfPrivate | undefined;

function hashFor(id: string, day: number): number {
  let h = (day * 2654435761) >>> 0;
  for (let i = 0; i < id.length; i++) {
    h = (Math.imul(h ^ id.charCodeAt(i), 2654435761)) >>> 0;
  }
  return h;
}

function pick<T>(items: T[], id: string, day: number): T {
  return items[hashFor(id, day) % items.length];
}

/** Shared daily ranking makes bots form voting blocs instead of scattering. */
function rankBySuspicion<T extends { id: string }>(items: T[], cohort: string, day: number): T[] {
  return [...items].sort((a, b) => hashFor(`${cohort}:${a.id}`, day) - hashFor(`${cohort}:${b.id}`, day));
}

function tallyTargets(targets: Array<string | null | undefined>): Record<string, number> {
  const tally: Record<string, number> = {};
  for (const id of targets) {
    if (id) tally[id] = (tally[id] ?? 0) + 1;
  }
  return tally;
}

function leadingCandidate<T extends { id: string }>(
  candidates: T[],
  tally: Record<string, number>,
  cohort: string,
  day: number,
): { target: T; count: number } | null {
  const topCount = candidates.reduce((top, p) => Math.max(top, tally[p.id] ?? 0), 0);
  if (topCount === 0) return null;
  const leaders = candidates.filter(p => (tally[p.id] ?? 0) === topCount);
  return { target: pick(leaders, cohort, day), count: topCount };
}

function currentWolfTally(s: S): Record<string, number> {
  const alive = alivePlayers(s.room.players, P(s).eliminatedPlayers);
  return tallyTargets(
    alive
      .filter(p => getPriv(s, p.id)?.role === 'werewolf')
      .map(p => getPriv(s, p.id)?.wolfTarget),
  );
}

// ─── nextBotAction ────────────────────────────────────────────────────────────
// Returns the action the bot should take for `playerId`, or null if no bot
// action is applicable right now.

export function nextBotAction(s: S, playerId: string): GameAction | null {
  if (s.winner) return null;
  const pub = P(s);
  const phase = s.public.phase;
  const pd = getPriv(s, playerId);
  if (!pd) return null;

  const isAlivePlayer = !pub.eliminatedPlayers.includes(playerId);
  const isHost = s.room.hostId === playerId;

  // ── Night ──────────────────────────────────────────────────────────────────

  if (phase === 'night') {
    if (!isAlivePlayer) return null;
    if (pub.nightActors.includes(playerId)) return null;

    if (pd.role === 'werewolf') {
      const targets = alivePlayers(s.room.players, pub.eliminatedPlayers)
        .filter(p => getPriv(s, p.id)?.team !== 'evil');
      if (targets.length === 0) return null;
      // Join the current pack leader; ties are broken consistently by the pack.
      const leader = leadingCandidate(targets, currentWolfTally(s), 'wolf-pack', pub.dayCount);
      const target = leader?.target ?? rankBySuspicion(targets, 'wolf-pack', pub.dayCount)[0];
      return { type: 'WEREWOLF_KILL', playerId, payload: { targetId: target.id } };
    }

    if (pd.role === 'seer') {
      const checked = new Set(pd.seerHistory.map(h => h.playerId));
      const unchecked = alivePlayers(s.room.players, pub.eliminatedPlayers)
        .filter(p => p.id !== playerId && !checked.has(p.id));
      // Fall back to any alive target (other than self) if all have been checked.
      const targets = unchecked.length > 0
        ? unchecked
        : alivePlayers(s.room.players, pub.eliminatedPlayers).filter(p => p.id !== playerId);
      if (targets.length === 0) return null;
      return { type: 'SEER_PEEK', playerId, payload: { targetId: pick(targets, playerId, pub.dayCount).id } };
    }

    if (pd.role === 'doctor') {
      const alive = alivePlayers(s.room.players, pub.eliminatedPlayers);
      const canProtect = alive.filter(p => p.id !== pd.doctorLastProtected);
      if (canProtect.length === 0) return null;
      // Prefer protecting self; otherwise pick with scrambled hash.
      const target = canProtect.find(p => p.id === playerId)
        ?? pick(canProtect, playerId, pub.dayCount);
      return { type: 'DOCTOR_SAVE', playerId, payload: { targetId: target.id } };
    }

    if (pd.role === 'cupid' && pub.dayCount === 1 && !pub.lovers) {
      if (pub.nightActors.includes(playerId)) return null;
      const candidates = alivePlayers(s.room.players, pub.eliminatedPlayers)
        .filter(p => p.id !== playerId);
      if (candidates.length < 2) return null;
      // Link two players that aren't both wolves when possible.
      return { type: 'CUPID_LINK', playerId, payload: { targetIds: [candidates[0].id, candidates[1].id] } };
    }

    if (pd.role === 'spellcaster') {
      if (pub.nightActors.includes(playerId)) return null;
      const targets = alivePlayers(s.room.players, pub.eliminatedPlayers)
        .filter(p => p.id !== playerId);
      if (targets.length === 0) return null;
      return { type: 'SILENCE', playerId, payload: { targetId: pick(targets, playerId, pub.dayCount).id } };
    }
  }

  // ── Day discuss (host advances) ────────────────────────────────────────────

  if (phase === 'dayDiscuss' && isHost) {
    return { type: 'CONTINUE', playerId, payload: null };
  }

  // ── Day vote ───────────────────────────────────────────────────────────────

  if (phase === 'dayVote') {
    if (!isAlivePlayer) return null;
    if (playerId in pub.votes) return null;

    const alive = alivePlayers(s.room.players, pub.eliminatedPlayers);
    const dayTally = tallyTargets(Object.values(pub.votes));
    // Seer: vote for a known-evil target if alive.
    if (pd.role === 'seer') {
      const knownEvil = pd.seerHistory
        .filter(h => h.result === 'evil')
        .map(h => h.playerId)
        .find(id => alive.some(p => p.id === id));
      if (knownEvil) return { type: 'LYNCH_VOTE', playerId, payload: { targetId: knownEvil } };
    }

    // Wolves form a bloc on a living non-wolf and join a viable public leader.
    if (pd.team === 'evil') {
      const targets = alive.filter(p => getPriv(s, p.id)?.team !== 'evil');
      if (targets.length > 0) {
        const leader = leadingCandidate(targets, dayTally, 'wolf-day', pub.dayCount);
        const target = leader?.target ?? rankBySuspicion(targets, 'wolf-day', pub.dayCount)[0];
        return { type: 'LYNCH_VOTE', playerId, payload: { targetId: target.id } };
      }
    }

    // Good bots share a daily suspicion ranking, independent of the public
    // leader so a wolf bloc cannot seed two votes and drag the village with it.
    // Seers also avoid players they have already cleared.
    const knownNotEvil = pd.role === 'seer'
      ? new Set(pd.seerHistory.filter(h => h.result === 'not-evil').map(h => h.playerId))
      : new Set<string>();
    const suspects = alive.filter(p => p.id !== playerId && !knownNotEvil.has(p.id));
    if (suspects.length === 0) return null;
    const sharedSuspect = rankBySuspicion(suspects, 'village-suspicion', pub.dayCount)[0];
    return { type: 'LYNCH_VOTE', playerId, payload: { targetId: sharedSuspect.id } };
  }

  // ── Host-gated phases ──────────────────────────────────────────────────────

  if ((phase === 'roleReveal' || phase === 'dawn' || phase === 'resolve') && isHost) {
    return { type: 'CONTINUE', playerId, payload: null };
  }

  return null;
}

// ─── nextAutoActor ────────────────────────────────────────────────────────────
// Returns the next player whose bot action should be triggered, skipping the
// human player unless autoAll=true.

export function nextAutoActor(s: S, humanId: string, autoAll: boolean): string | null {
  if (s.winner) return null;
  for (const p of s.room.players) {
    if (!autoAll && p.id === humanId) continue;
    if (nextBotAction(s, p.id) !== null) return p.id;
  }
  return null;
}
