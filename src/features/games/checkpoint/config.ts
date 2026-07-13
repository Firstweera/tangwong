import type { GameEngineConfig } from '../engine';
import { CHECKPOINT_ACTIONS } from './actions.ts';
import { CHECKPOINT_PHASES } from './phases.ts';
import { buildCheckpointPrivate, buildCheckpointPublic } from './setup.ts';
import type { CheckpointPrivate, CheckpointPublic } from './types.ts';
import { checkpointWealthWin } from './winConditions.ts';

export const checkpointConfig: GameEngineConfig<CheckpointPublic, CheckpointPrivate> = {
  id: 'checkpoint',
  minPlayers: 3,
  maxPlayers: 6,
  phases: CHECKPOINT_PHASES,
  createInitialPublicState: buildCheckpointPublic,
  createInitialPrivateState: buildCheckpointPrivate,
  actions: CHECKPOINT_ACTIONS,
  winConditions: [checkpointWealthWin],
  gameMaster: { autoAdvancePhase: true, autoAssignRoles: false, enforceTimeLimit: false },
};

