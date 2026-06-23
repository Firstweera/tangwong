// Avalon — the complete GameEngineConfig wiring state, phases, actions, and win
// conditions together. Register this with the engine (useGameEngine) to play.
import type { GameEngineConfig } from '../engine';
import type { AvalonPublic, AvalonPrivate } from './types.ts';
import { buildPublicState, buildPrivateState } from './setup.ts';
import { AVALON_PHASES } from './phases.ts';
import { AVALON_ACTIONS } from './actions.ts';
import { AVALON_WIN_CONDITIONS } from './winConditions.ts';

export const avalonConfig: GameEngineConfig<AvalonPublic, AvalonPrivate> = {
  id: 'avalon',
  minPlayers: 5,
  maxPlayers: 10,
  phases: AVALON_PHASES,
  createInitialPublicState: buildPublicState,
  createInitialPrivateState: buildPrivateState,
  actions: AVALON_ACTIONS,
  winConditions: AVALON_WIN_CONDITIONS,
  gameMaster: {
    autoAdvancePhase: true,
    autoAssignRoles: true,
    enforceTimeLimit: false,
  },
};
