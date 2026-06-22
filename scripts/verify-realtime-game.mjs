import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const checks = [];

function read(path) {
  const abs = join(root, path);
  if (!existsSync(abs)) {
    checks.push({ ok: false, label: `${path} exists` });
    return '';
  }
  checks.push({ ok: true, label: `${path} exists` });
  return readFileSync(abs, 'utf8');
}

function must(haystack, needle, label) {
  checks.push({ ok: haystack.includes(needle), label });
}

const gameService = read('src/services/supabase/game.ts');
must(gameService, 'fetchGame', 'game service exposes fetchGame');
must(gameService, 'startGame', 'game service exposes startGame');
must(gameService, 'submitAction', 'game service exposes submitAction');
must(gameService, 'subscribeGame', 'game service exposes subscribeGame');
must(gameService, "from('game_states')", 'game service reads game_states');
must(gameService, "from('game_private')", 'game service reads private owner state');
must(gameService, "functions.invoke('game-start'", 'game service invokes game-start');
must(gameService, "functions.invoke('game-action'", 'game service invokes game-action');

const hook = read('src/features/games/engine/useRealtimeGame.ts');
must(hook, 'useSupabaseTransport', 'realtime hook respects transport flag');
must(hook, 'gameService.fetchGame', 'realtime hook fetches server state');
must(hook, 'gameService.subscribeGame', 'realtime hook subscribes to game changes');
must(hook, 'submitAction', 'realtime hook exposes submitAction');
must(hook, 'start', 'realtime hook exposes start');
must(hook, 'meId', 'realtime hook resolves effective player id');

const engineIndex = read('src/features/games/engine/index.ts');
must(engineIndex, 'useRealtimeGame', 'engine barrel exports useRealtimeGame');

const avalon = read('src/features/games/avalon/ui/AvalonGame.tsx');
must(avalon, 'externalState', 'AvalonGame accepts external state');
must(avalon, 'onSubmitAction', 'AvalonGame accepts external action dispatcher');
must(avalon, 'onStartGame', 'AvalonGame accepts external start dispatcher');
must(avalon, 'onlineMode', 'AvalonGame can disable local-only automation');

const gamePage = read('src/pages/GamePage.jsx');
must(gamePage, 'useRealtimeGame', 'GamePage uses realtime game hook');
must(gamePage, 'useSupabaseTransport', 'GamePage branches on Supabase transport');
must(gamePage, 'externalState', 'GamePage passes server state to AvalonGame');
must(gamePage, 'onSubmitAction', 'GamePage passes server action dispatcher');

const pkg = read('package.json');
must(pkg, 'verify:realtime-game', 'package exposes verify:realtime-game');

const failed = checks.filter(c => !c.ok);
for (const check of checks) {
  console.log(`${check.ok ? 'PASS' : 'FAIL'}: ${check.label}`);
}

if (failed.length > 0) {
  console.error(`\n${failed.length} realtime game contract check(s) failed.`);
  process.exit(1);
}
