import type { PhaseConfig } from '../engine';
import type { CheckpointPublic } from './types.ts';

const pub = (state: { public: { data: unknown } }) => state.public.data as CheckpointPublic;
const merchantCount = (state: { room: { players: unknown[] } }) => state.room.players.length - 1;

export const CHECKPOINT_PHASES: PhaseConfig[] = [
  { id: 'lobby', label: 'Lobby', labelTh: 'ห้องรอ', allowedActions: [], transitions: [{ to: 'pack', when: 'manual' }] },
  {
    id: 'pack', label: 'Pack', labelTh: 'จัดกระเป๋า', allowedActions: ['SUBMIT_CRATE'],
    transitions: [{ to: 'negotiate', when: 'condition', condition: state => Object.keys(pub(state).declarations).length === merchantCount(state) }],
  },
  {
    id: 'negotiate', label: 'Negotiate', labelTh: 'เจรจา', allowedActions: ['PLACE_RUMOR', 'SUBMIT_OFFER'],
    transitions: [{ to: 'decide', when: 'condition', condition: state => pub(state).offersSubmitted.length === merchantCount(state) }],
  },
  {
    id: 'decide', label: 'Decide', labelTh: 'ตัดสิน', allowedActions: ['PASS_MERCHANT', 'INSPECT_MERCHANT'],
    transitions: [{ to: 'shiftResult', when: 'condition', condition: state => pub(state).resolvedMerchants.length === merchantCount(state) }],
  },
  {
    id: 'shiftResult', label: 'Market Close', labelTh: 'ปิดตลาด', allowedActions: ['CONTINUE_SHIFT'],
    transitions: [{ to: 'pack', when: 'condition', condition: state => !pub(state).gameComplete }],
  },
  { id: 'end', label: 'End', labelTh: 'จบเกม', allowedActions: [], transitions: [] },
];

