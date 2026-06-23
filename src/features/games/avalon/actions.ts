// Avalon actions — validator + handler per action type. Handlers are pure and
// only mutate public data; phase transitions are decided by the condition
// transitions in phases.ts (run by the engine after each dispatch).
import type { ActionDef, GameState } from '../engine';
import type { AvalonPublic, AvalonPrivate, QuestOutcome } from './types.ts';
import { currentLeaderId, currentQuestRule, successCount } from './setup.ts';

type State = GameState<AvalonPublic, AvalonPrivate>;

const P = (s: State) => s.public.data;
const priv = (s: State, id: string) => s.private[id]?.data;

/** Return a new state with the public data patched. */
function patch(s: State, data: Partial<AvalonPublic>): State {
  return { ...s, public: { ...s.public, data: { ...s.public.data, ...data } } };
}

// ─── NOMINATE_TEAM (leader, teamProposal) ──────────────────────────────────────

const nominateTeam: ActionDef<AvalonPublic, AvalonPrivate> = {
  validate: (s, a) => {
    if (a.playerId !== currentLeaderId(P(s))) {
      return { valid: false, error: 'Only the leader can nominate a team' };
    }
    const team = (a.payload as { team?: string[] })?.team ?? [];
    const size = currentQuestRule(P(s)).size;
    if (team.length !== size) return { valid: false, error: `Team must have ${size} players` };
    if (new Set(team).size !== team.length) return { valid: false, error: 'Duplicate players on team' };
    if (!team.every(id => s.room.players.some(p => p.id === id))) {
      return { valid: false, error: 'Unknown player on team' };
    }
    return { valid: true };
  },
  handle: (s, a) => {
    const team = (a.payload as { team: string[] }).team;
    return patch(s, {
      proposedTeam: team,
      proposalSubmitted: true,
      votes: {},
      voteComplete: false,
      voteApproved: false,
      missionCards: {},
      missionComplete: false,
    });
  },
};

// ─── VOTE_TEAM (everyone, teamVote) ────────────────────────────────────────────

const voteTeam: ActionDef<AvalonPublic, AvalonPrivate> = {
  validate: (s, a) => {
    if (!s.room.players.some(p => p.id === a.playerId)) return { valid: false, error: 'Not in the room' };
    if (a.playerId in P(s).votes) return { valid: false, error: 'You have already voted' };
    return { valid: true };
  },
  handle: (s, a, emit) => {
    const approve = !!(a.payload as { approve?: boolean })?.approve;
    const votes = { ...P(s).votes, [a.playerId]: approve };
    emit('VOTE_CAST', { approve });

    const n = s.room.players.length;
    if (Object.keys(votes).length < n) return patch(s, { votes });

    // Everyone has voted — tally (strict majority approves).
    const yes = Object.values(votes).filter(Boolean).length;
    const approved = yes * 2 > n;
    if (approved) {
      return patch(s, { votes, voteComplete: true, voteApproved: true });
    }
    // Rejected — rotate leader, count the reject (5 ends the game via a win condition).
    return patch(s, {
      votes,
      voteComplete: true,
      voteApproved: false,
      rejectCount: P(s).rejectCount + 1,
      leaderIndex: (P(s).leaderIndex + 1) % n,
      proposedTeam: [],
      proposalSubmitted: false,
    });
  },
};

// ─── PLAY_MISSION_CARD (team members, mission) ─────────────────────────────────

const playMissionCard: ActionDef<AvalonPublic, AvalonPrivate> = {
  validate: (s, a) => {
    if (!P(s).proposedTeam.includes(a.playerId)) return { valid: false, error: 'You are not on the mission team' };
    if (a.playerId in P(s).missionCards) return { valid: false, error: 'You have already played a card' };
    const card = (a.payload as { card?: QuestOutcome })?.card;
    if (card !== 'success' && card !== 'fail') return { valid: false, error: 'Invalid card' };
    if (priv(s, a.playerId)?.side === 'good' && card === 'fail') {
      return { valid: false, error: 'Loyal players can only play Success' };
    }
    return { valid: true };
  },
  handle: (s, a) => {
    const card = (a.payload as { card: QuestOutcome }).card;
    const missionCards = { ...P(s).missionCards, [a.playerId]: card };
    if (Object.keys(missionCards).length < P(s).proposedTeam.length) {
      return patch(s, { missionCards });
    }
    // All cards in — resolve the quest.
    const fails = Object.values(missionCards).filter(c => c === 'fail').length;
    const need = currentQuestRule(P(s)).fails;
    const outcome: QuestOutcome = fails >= need ? 'fail' : 'success';
    const results = [...P(s).results];
    results[P(s).currentQuest] = outcome;
    return patch(s, {
      results,
      missionComplete: true,
      lastQuest: { outcome, fails, quest: P(s).currentQuest },
      missionCards: {}, // drop the secret cards once counted
    });
  },
};

// ─── CONTINUE (host, roleReveal / questReveal) ─────────────────────────────────

const continueGame: ActionDef<AvalonPublic, AvalonPrivate> = {
  validate: (s, a) =>
    s.room.hostId === a.playerId ? { valid: true } : { valid: false, error: 'Only the host can continue' },
  handle: (s) => {
    // From questReveal with good still under 3 wins: set up the next quest.
    if (s.public.phase === 'questReveal' && successCount(P(s)) < 3) {
      const n = s.room.players.length;
      return patch(s, {
        currentQuest: P(s).currentQuest + 1,
        leaderIndex: (P(s).leaderIndex + 1) % n,
        proposedTeam: [],
        proposalSubmitted: false,
        votes: {},
        voteComplete: false,
        voteApproved: false,
        missionCards: {},
        missionComplete: false,
      });
    }
    // roleReveal → teamProposal, or questReveal(3 successes) → assassinate: no data change.
    return s;
  },
};

// ─── ASSASSINATE (assassin, assassinate) ───────────────────────────────────────

const assassinate: ActionDef<AvalonPublic, AvalonPrivate> = {
  validate: (s, a) => {
    if (priv(s, a.playerId)?.role !== 'assassin') return { valid: false, error: 'Only the Assassin can assassinate' };
    const targetId = (a.payload as { targetId?: string })?.targetId;
    if (!targetId || !s.room.players.some(p => p.id === targetId)) return { valid: false, error: 'Invalid target' };
    return { valid: true };
  },
  handle: (s, a, emit) => {
    const targetId = (a.payload as { targetId: string }).targetId;
    const wasMerlin = priv(s, targetId)?.role === 'merlin';
    emit('ROLE_REVEALED', { targetId, wasMerlin });
    return patch(s, { assassinated: { targetId, wasMerlin } });
  },
};

export const AVALON_ACTIONS: Record<string, ActionDef<AvalonPublic, AvalonPrivate>> = {
  NOMINATE_TEAM: nominateTeam,
  VOTE_TEAM: voteTeam,
  PLAY_MISSION_CARD: playMissionCard,
  CONTINUE: continueGame,
  ASSASSINATE: assassinate,
};
