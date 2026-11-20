/**
 * Registry parity: the browser runtime registry (src/features/games/runtime.ts)
 * and the Edge Function registry (supabase/functions/_shared/games.ts) must list
 * the same games with the same firstPhase and privateActionTypes. A game missing
 * on the server cannot start online; a missing private action type leaks its
 * payload into the public action log.
 */
import { build } from 'vite';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const dir = mkdtempSync(join(tmpdir(), 'tangwong-parity-'));
const entry = join(dir, 'runner.ts');
const output = join(dir, 'runner.mjs');

writeFileSync(entry, `
  import { getGameRuntime } from '${process.cwd()}/src/features/games/runtime.ts';
  import { GAME_REGISTRY } from '${process.cwd()}/supabase/functions/_shared/games.ts';
  import { GAMES } from '${process.cwd()}/src/data.ts';

  const errors = [];
  const sorted = list => [...list].sort().join(',');
  const catalogIds = GAMES.filter(g => getGameRuntime(g.id) || GAME_REGISTRY[g.id]).map(g => g.id);
  const ids = new Set([...Object.keys(GAME_REGISTRY), ...catalogIds]);

  for (const id of ids) {
    const local = getGameRuntime(id);
    const server = GAME_REGISTRY[id];
    if (!local) { errors.push(id + ': in the server registry but missing from runtime.ts'); continue; }
    if (!server) { errors.push(id + ': in runtime.ts but missing from supabase/functions/_shared/games.ts'); continue; }
    if (local.config.id !== id || server.config.id !== id) errors.push(id + ': config.id mismatch');
    if (local.firstPhase !== server.firstPhase) errors.push(id + ': firstPhase ' + local.firstPhase + ' (runtime) vs ' + server.firstPhase + ' (server)');
    if (sorted(local.privateActionTypes) !== sorted(server.privateActionTypes)) {
      errors.push(id + ': privateActionTypes [' + local.privateActionTypes + '] (runtime) vs [' + server.privateActionTypes + '] (server)');
    }
    for (const type of local.privateActionTypes) {
      if (!local.config.actions[type]) errors.push(id + ': private action ' + type + ' is not an engine action');
    }
    if (!local.config.phases.some(p => p.id === local.firstPhase)) errors.push(id + ': firstPhase ' + local.firstPhase + ' is not a phase');
  }

  if (errors.length) {
    console.error('Registry parity: FAIL');
    for (const e of errors) console.error('  - ' + e);
    process.exit(1);
  }
  console.log('Registry parity: PASS — ' + [...ids].sort().join(', '));
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
