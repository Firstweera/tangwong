// Werewolf phase config — phase graph, allowed actions, and transition conditions.
import type { PhaseConfig } from '../engine';
import type { WerewolfPublic } from './types.ts';

const pub = (s: { public: { data: unknown } }) => s.public.data as WerewolfPublic;

export const WEREWOLF_PHASES: PhaseConfig[] = [
  {
    id: 'lobby',
    label: 'Lobby',
    labelTh: 'ห้องรอ',
    allowedActions: [],
    transitions: [{ to: 'roleReveal', when: 'manual' }],
  },
  {
    // Host views their role; sends CONTINUE to start the first night.
    id: 'roleReveal',
    label: 'Role Reveal',
    labelTh: 'เปิดบทบาท',
    allowedActions: ['CONTINUE'],
    transitions: [{ to: 'night', when: 'condition', condition: () => true }],
  },
  {
    // Wolves kill, Seer inspects, Doctor protects — all concurrently.
    // Auto-advance once every required night actor has submitted.
    id: 'night',
    label: 'Night',
    labelTh: 'กลางคืน',
    allowedActions: ['WEREWOLF_KILL', 'SEER_PEEK', 'DOCTOR_SAVE', 'CUPID_LINK', 'SILENCE'],
    transitions: [{ to: 'dawn', when: 'condition', condition: s => pub(s).nightResolved }],
  },
  {
    // Reveal who (if anyone) was killed last night; host continues.
    id: 'dawn',
    label: 'Dawn',
    labelTh: 'รุ่งเช้า',
    allowedActions: ['CONTINUE'],
    transitions: [{ to: 'dayDiscuss', when: 'condition', condition: () => true }],
  },
  {
    // Open discussion — no game action; host sends CONTINUE to open the vote.
    id: 'dayDiscuss',
    label: 'Discussion',
    labelTh: 'ถกเถียง',
    allowedActions: ['CONTINUE'],
    transitions: [{ to: 'dayVote', when: 'condition', condition: () => true }],
  },
  {
    // Every living player casts a lynch vote.
    // Auto-advance once all living players have voted.
    id: 'dayVote',
    label: 'Day Vote',
    labelTh: 'โหวตประหาร',
    allowedActions: ['LYNCH_VOTE'],
    transitions: [{ to: 'resolve', when: 'condition', condition: s => pub(s).voteResolved }],
  },
  {
    // Show the lynch result; host sends CONTINUE to start the next night (if no winner).
    id: 'resolve',
    label: 'Resolve',
    labelTh: 'ผล',
    allowedActions: ['CONTINUE'],
    transitions: [{ to: 'night', when: 'condition', condition: () => true }],
  },
  {
    id: 'end',
    label: 'End',
    labelTh: 'จบเกม',
    allowedActions: [],
    transitions: [],
  },
];
