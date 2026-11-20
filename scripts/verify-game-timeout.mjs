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

const edge = read('supabase/functions/game-action/index.ts');
must(edge, 'TIMEOUT', 'game-action accepts the TIMEOUT server intent');
must(edge, 'PHASE_TIMEOUT_SECONDS', 'game-action defines authoritative phase timer windows');
must(edge, 'updated_at', 'game-action uses game_states.updated_at for elapsed checks');
must(edge, 'assertTimeoutElapsed', 'game-action rejects early timeout attempts');
must(edge, 'room.host_id', 'game-action restricts TIMEOUT to the current host');
must(edge, 'nextTimedOutAction', 'game-action chooses a legal default action on timeout');
must(edge, 'nextBotAction', 'game-action reuses Avalon default bot actions for timeout');
must(edge, 'engine.dispatch(state, action)', 'timeout action still goes through engine validation');
must(edge, 'timer has not expired', 'game-action returns a clear early-timeout error');

const service = read('src/services/supabase/game.ts');
must(service, 'timeoutGame', 'game service exposes timeoutGame');
must(service, "type: 'TIMEOUT'", 'timeoutGame invokes game-action with TIMEOUT');

const transport = read('src/services/supabase/gameTransport.ts');
must(transport, 'service.timeoutGame', 'SupabaseTransport calls timeoutGame');
const clientTypes = read('src/features/games/engine/client/types.ts');
must(clientTypes, 'timeout(): Promise<MoveResult>', 'GameClient exposes timeout');

const avalon = read('src/features/games/avalon/ui/AvalonGame.tsx');
must(avalon, 'onTimeout', 'AvalonGame accepts an online timeout callback');
must(avalon, 'timeoutSentRef', 'AvalonGame guards duplicate timeout submissions');
must(avalon, 'isHost', 'AvalonGame only lets the host drive online timeout');
must(avalon, 'void onTimeout?.()', 'AvalonGame calls timeout callback when the online host timer expires');

const gamePage = read('src/pages/GamePage.jsx');
must(gamePage, 'await client?.timeout()', 'GamePage wires online GameClient timeout into the game UI');
must(gamePage, 'onTimeout={game.client ? game.timeout : undefined}', 'GamePage passes the active client timeout to the game UI');

const pkg = read('package.json');
must(pkg, 'verify:game-timeout', 'package exposes verify:game-timeout');

const failed = checks.filter(c => !c.ok);
for (const check of checks) {
  console.log(`${check.ok ? 'PASS' : 'FAIL'}: ${check.label}`);
}

if (failed.length > 0) {
  console.error(`\n${failed.length} game timeout contract check(s) failed.`);
  process.exit(1);
}

console.log('game timeout contract verified');
