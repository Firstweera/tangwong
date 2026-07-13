/** Runtime verification for the Checkpoint engine. */
import { build } from 'vite';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const dir = mkdtempSync(join(tmpdir(), 'tangwong-checkpoint-'));
const entry = join(dir, 'runner.ts');
const output = join(dir, 'runner.mjs');

writeFileSync(entry, `
  import { GameEngine } from '${process.cwd()}/src/features/games/engine/engine.ts';
  import { checkpointConfig } from '${process.cwd()}/src/features/games/checkpoint/config.ts';
  import { nextBotAction } from '${process.cwd()}/src/features/games/checkpoint/bot.ts';

  const players = Array.from({ length: 3 }, (_, index) => ({
    id: 'bot_' + (index + 1), nickname: 'Bot ' + (index + 1), mascot: 'fox',
    isHost: index === 0, isConnected: true, isReady: true,
  }));
  const room = {
    roomId: 'verify', roomCode: 'VERIFY', gameId: 'checkpoint', hostId: 'bot_1',
    players, maxPlayers: 3, isPublic: false, status: 'in-game', createdAt: 0,
  };
  const engine = new GameEngine(checkpointConfig);
  let state = engine.createInitialState(room);
  state = engine.transitionTo(state, 'pack').state;
  let actions = 0;

  while (!state.winner && actions < 500) {
    let action = null;
    for (const player of players) {
      action = nextBotAction(state, player.id);
      if (action) break;
    }
    if (!action && state.public.phase === 'shiftResult') {
      action = { type: 'CONTINUE_SHIFT', playerId: room.hostId, payload: null };
    }
    if (!action) throw new Error('Engine stalled in phase ' + state.public.phase);
    const result = engine.dispatch(state, action);
    if (!result.valid) throw new Error(action.type + ': ' + result.error);
    state = result.state;
    actions += 1;
  }

  if (!state.winner) throw new Error('Game did not finish');
  if (state.public.data.shift !== players.length * 2) throw new Error('Game did not run exactly two rotations');
  if (state.winner.conditionId !== 'checkpoint-wealth') throw new Error('Wrong win condition');
  if (Object.keys(state.winner.scores ?? {}).length !== players.length) throw new Error('Missing final scores');
  console.log('Checkpoint runtime: PASS');
  console.log('Actions:', actions, 'Shifts:', state.public.data.shift, 'Winners:', state.winner.winners.join(', '));
`);

await build({
  logLevel: 'silent',
  build: {
    ssr: entry,
    outDir: dir,
    emptyOutDir: false,
    rollupOptions: { output: { entryFileNames: 'runner.mjs' } },
  },
});
await import(pathToFileURL(output));
