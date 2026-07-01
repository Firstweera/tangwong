// Werewolf — GameEngineConfig wiring together all engine modules.
import type { GameEngineConfig } from '../engine';
import type { WerewolfPublic, WerewolfPrivate } from './types.ts';
import { buildPublicState, buildPrivateState } from './setup.ts';
import { WEREWOLF_PHASES } from './phases.ts';
import { WEREWOLF_ACTIONS } from './actions.ts';
import { WEREWOLF_WIN_CONDITIONS } from './winConditions.ts';

export const werewolfConfig: GameEngineConfig<WerewolfPublic, WerewolfPrivate> = {
  id: 'werewolf',
  minPlayers: 5,
  maxPlayers: 10,
  phases: WEREWOLF_PHASES,
  createInitialPublicState: buildPublicState,
  createInitialPrivateState: buildPrivateState,
  actions: WEREWOLF_ACTIONS,
  winConditions: WEREWOLF_WIN_CONDITIONS,
  gameMaster: {
    autoAdvancePhase: true,
    autoAssignRoles: true,
    enforceTimeLimit: false,
  },
};
