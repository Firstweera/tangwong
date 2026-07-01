// Werewolf bot — deterministic next action for each player/phase combination.
// Used by the server auto-GM and the offline auto-play mode.
import type { GameState, GameAction } from '../engine';
import type { WerewolfPublic, WerewolfPrivate } from './types.ts';
import { alivePlayers } from '../engine/playerUtils.ts';

type S = GameState<WerewolfPublic, WerewolfPrivate>;

const P = (s: S) => s.public.data;
const getPriv = (s: S, id: string) => s.private[id]?.data as WerewolfPrivate | undefined;

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
      // Always agree with whatever target the pack has already committed to.
      const packTarget = Object.values(pub.wolfVotes ?? {}).find(Boolean) ?? null;
      if (packTarget) {
        return { type: 'WEREWOLF_KILL', playerId, payload: { targetId: packTarget } };
      }
      // No consensus yet — pick a non-wolf target, varied by night to avoid patterns.
      const targets = alivePlayers(s.room.players, pub.eliminatedPlayers)
        .filter(p => getPriv(s, p.id)?.team !== 'evil');
      if (targets.length === 0) return null;
      const idx = pub.dayCount % targets.length;
      return { type: 'WEREWOLF_KILL', playerId, payload: { targetId: targets[idx].id } };
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
      // Vary by day so seer doesn't always inspect in the same fixed order.
      const idx = pub.dayCount % targets.length;
      return { type: 'SEER_PEEK', playerId, payload: { targetId: targets[idx].id } };
    }

    if (pd.role === 'doctor') {
      const alive = alivePlayers(s.room.players, pub.eliminatedPlayers);
      const canProtect = alive.filter(p => p.id !== pd.doctorLastProtected);
      if (canProtect.length === 0) return null;
      // Prefer protecting self; otherwise protect with day-varied index.
      const target = canProtect.find(p => p.id === playerId)
        ?? canProtect[pub.dayCount % canProtect.length];
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
      // Rotate target each night to avoid a fixed pattern.
      const idx = pub.dayCount % targets.length;
      return { type: 'SILENCE', playerId, payload: { targetId: targets[idx].id } };
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
    // Seed: last char code of playerId + dayCount so each bot picks differently each day.
    const seed = playerId.charCodeAt(playerId.length - 1) + pub.dayCount;

    // Seer: vote for a known-evil target if alive.
    if (pd.role === 'seer') {
      const knownEvil = pd.seerHistory
        .filter(h => h.result === 'evil')
        .map(h => h.playerId)
        .find(id => alive.some(p => p.id === id));
      if (knownEvil) return { type: 'LYNCH_VOTE', playerId, payload: { targetId: knownEvil } };
    }

    // Wolf: vote for a living non-wolf to blend in (varied per day so pack doesn't all pick same).
    if (pd.team === 'evil') {
      const targets = alive.filter(p => getPriv(s, p.id)?.team !== 'evil');
      if (targets.length > 0) {
        const idx = seed % targets.length;
        return { type: 'LYNCH_VOTE', playerId, payload: { targetId: targets[idx].id } };
      }
    }

    // Default: vote for a player who is not self (varied by seat seed so bots scatter votes).
    const others = alive.filter(p => p.id !== playerId);
    if (others.length === 0) return null;
    const idx = seed % others.length;
    return { type: 'LYNCH_VOTE', playerId, payload: { targetId: others[idx].id } };
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
