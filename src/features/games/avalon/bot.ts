// Avalon bots — decide the next action for an auto-played seat. Used for solo
// testing: bots can drive every role so a single player (or a watcher) can run
// a full game and verify the engine end-to-end. Reads full state (Phase A,
// single-client); host-authoritative bots come with Phase B.
import type { GameAction, GameState } from '../engine';
import type { AvalonPublic, AvalonPrivate } from './types';
import { currentLeaderId, currentQuestRule } from './setup';

type S = GameState<AvalonPublic, AvalonPrivate>;

const P = (s: S) => s.public.data;
const sideOf = (s: S, id: string) => s.private[id]?.data.side;

/** A bot leader picks a valid team: itself first, then by seating order. */
function chooseTeam(s: S, leaderId: string): string[] {
  const size = currentQuestRule(P(s)).size;
  const team = [leaderId];
  for (const id of P(s).playerOrder) {
    if (team.length >= size) break;
    if (!team.includes(id)) team.push(id);
  }
  return team.slice(0, size);
}

/**
 * The action this player would take right now, or null if it is not their turn
 * (or they have already acted this phase). Heuristics favour the game actually
 * progressing and reaching every win path.
 */
export function nextBotAction(s: S, playerId: string): GameAction | null {
  if (s.winner) return null;
  const pub = P(s);
  const phase = s.public.phase;

  switch (phase) {
    case 'roleReveal':
    case 'questReveal':
      // Host advances the shared screens.
      return s.room.hostId === playerId ? { type: 'CONTINUE', playerId, payload: null } : null;

    case 'teamProposal':
      if (playerId !== currentLeaderId(pub)) return null;
      return { type: 'NOMINATE_TEAM', playerId, payload: { team: chooseTeam(s, playerId) } };

    case 'teamVote': {
      if (playerId in pub.votes) return null;
      const evilOnTeam = pub.proposedTeam.some(id => sideOf(s, id) === 'evil');
      let approve: boolean;
      if (pub.rejectCount >= 4) approve = true;                 // avoid an accidental hammer in autoplay
      else if (sideOf(s, playerId) === 'evil') approve = evilOnTeam ? true : Math.random() < 0.4;
      else approve = Math.random() < 0.75;                      // loyal players lean approve
      return { type: 'VOTE_TEAM', playerId, payload: { approve } };
    }

    case 'mission': {
      if (!pub.proposedTeam.includes(playerId)) return null;
      if (playerId in pub.missionCards) return null;
      const card = sideOf(s, playerId) === 'good'
        ? 'success'
        : (Math.random() < 0.7 ? 'fail' : 'success');           // evil sometimes hides
      return { type: 'PLAY_MISSION_CARD', playerId, payload: { card } };
    }

    case 'assassinate': {
      if (s.private[playerId]?.data.role !== 'assassin') return null;
      // The assassin can't truly see Merlin — guess among the good players.
      const goodIds = s.room.players.map(p => p.id).filter(id => sideOf(s, id) === 'good');
      const target = goodIds[Math.floor(Math.random() * goodIds.length)];
      return { type: 'ASSASSINATE', playerId, payload: { targetId: target } };
    }

    default:
      return null;
  }
}

/**
 * The next seat that an auto-player should act for, or null if the game is
 * waiting on a human. `humanId` is never auto-played unless `autoAll` is set.
 */
export function nextAutoActor(s: S, humanId: string, autoAll: boolean): string | null {
  if (s.winner) return null;
  for (const p of s.room.players) {
    if (!autoAll && p.id === humanId) continue;
    if (nextBotAction(s, p.id)) return p.id;
  }
  return null;
}
