import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const file = resolve(root, 'supabase/functions/game-action/index.ts');

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  }
}

assert(existsSync(file), 'game-action Edge Function exists');

if (existsSync(file)) {
  const src = readFileSync(file, 'utf8');
  const required = [
    ['Deno.serve', 'serves an Edge Function request'],
    ['callerId(req)', 'authenticates the caller'],
    ['adminClient()', 'uses service-role authority'],
    ["from('rooms')", 'loads the room'],
    ["from('game_states')", 'loads and persists public game state'],
    ["from('game_private')", 'loads and persists private state'],
    ["from('game_actions')", 'writes an action log'],
    ['new GameEngine', 'uses the shared game engine'],
    ['engine.dispatch', 'dispatches through engine validation'],
    ['nextBotAction', 'resolves server-side bots'],
    ['version', 'checks optimistic concurrency version'],
    ['reveal', 'persists end-game role reveal into public data'],
  ];

  for (const [needle, message] of required) {
    assert(src.includes(needle), message);
  }
}

if (process.exitCode) process.exit(process.exitCode);
console.log('game-action contract verified');
