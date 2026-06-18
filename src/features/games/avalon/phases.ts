// Avalon phase state machine. Phase routing is data-driven: handlers mutate the
// public data, and these `condition` transitions decide where the engine moves
// next (the engine auto-advances after each dispatched action).
import type { PhaseConfig, GameState } from '../engine';
import type { AvalonPublic } from './types';
import { successCount, failCount } from './setup';

const pub = (s: GameState<unknown, unknown>) => s.public.data as AvalonPublic;

export const AVALON_PHASES: PhaseConfig[] = [
  {
    id: 'lobby',
    label: 'Lobby', labelTh: 'ห้องรอ',
    allowedActions: [],
    transitions: [{ to: 'roleReveal', when: 'manual' }],
  },
  {
    id: 'roleReveal',
    label: 'Role Reveal', labelTh: 'เปิดบทบาท',
    allowedActions: ['CONTINUE'],
    transitions: [{ to: 'teamProposal', when: 'condition', condition: () => true }],
  },
  {
    id: 'teamProposal',
    label: 'Team Proposal', labelTh: 'เสนอทีม',
    allowedActions: ['NOMINATE_TEAM'],
    transitions: [
      { to: 'teamVote', when: 'condition', condition: s => pub(s).proposalSubmitted },
    ],
  },
  {
    id: 'teamVote',
    label: 'Team Vote', labelTh: 'โหวตทีม',
    allowedActions: ['VOTE_TEAM'],
    transitions: [
      { to: 'mission', when: 'condition', condition: s => pub(s).voteComplete && pub(s).voteApproved },
      { to: 'teamProposal', when: 'condition', condition: s => pub(s).voteComplete && !pub(s).voteApproved },
    ],
  },
  {
    id: 'mission',
    label: 'Mission', labelTh: 'ทำภารกิจ',
    allowedActions: ['PLAY_MISSION_CARD'],
    transitions: [
      { to: 'questReveal', when: 'condition', condition: s => pub(s).missionComplete },
    ],
  },
  {
    id: 'questReveal',
    label: 'Quest Reveal', labelTh: 'ผลภารกิจ',
    allowedActions: ['CONTINUE'],
    transitions: [
      // Good reached 3 successes → evil gets the assassination attempt.
      { to: 'assassinate', when: 'condition', condition: s => successCount(pub(s)) >= 3 },
      // Otherwise carry on (3 fails ends via a win condition before reaching here).
      { to: 'teamProposal', when: 'condition', condition: s => successCount(pub(s)) < 3 && failCount(pub(s)) < 3 },
    ],
  },
  {
    id: 'assassinate',
    label: 'Assassinate', labelTh: 'ลอบสังหาร',
    allowedActions: ['ASSASSINATE'],
    transitions: [], // the assassination resolves via a win condition → 'end'
  },
  {
    id: 'end',
    label: 'End', labelTh: 'จบเกม',
    allowedActions: [],
    transitions: [],
  },
];
