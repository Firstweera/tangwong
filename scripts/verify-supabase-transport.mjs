/**
 * Runtime verification for SupabaseTransport against an in-memory fake of
 * services/supabase/game.ts (no network). Asserts the sync contract:
 *   - match info is available before a game exists (host gating)
 *   - intents refetch so the caller sees its own result
 *   - Edge Function errors surface as { ok:false } + client.error
 *   - Realtime bursts are coalesced into serialized fetches
 *   - a restart (server version → 0) is still delivered
 *   - fetch failures keep the last good state
 *   - other seats' private rows never reach the client, even if RLS leaked them
 *   - disconnect tears down the Realtime subscription
 */
import { build } from 'vite';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const dir = mkdtempSync(join(tmpdir(), 'tangwong-sbtransport-'));
const entry = join(dir, 'runner.ts');
const output = join(dir, 'runner.mjs');
const src = `${process.cwd()}/src`;

writeFileSync(entry, `
  import { createGameClient } from '${src}/features/games/engine/client/index.ts';
  import { createSupabaseTransport } from '${src}/services/supabase/gameTransport.ts';

  const assert = (cond, msg) => { if (!cond) throw new Error(msg); };
  const tick = (ms = 0) => new Promise(r => setTimeout(r, ms));

  // ── Fake server ────────────────────────────────────────────────────────────
  const room = { id: 'room-1', code: 'ABCD', gameId: 'avalon', hostId: 'me' };
  let server = null;          // { version, turn, privates }
  let fetches = 0, failNextFetch = false, onChange = null, unsubscribed = 0;

  const service = {
    async fetchGame(code) {
      fetches += 1;
      await tick(5);
      if (failNextFetch) { failNextFetch = false; throw new Error('network down'); }
      const state = server && {
        room: { roomId: room.id, roomCode: code, gameId: room.gameId, hostId: room.hostId, players: [] },
        public: { phase: 'teamProposal', turn: server.turn, round: 0, activePlayerId: 'me', data: {} },
        // Simulate a broken RLS policy: return every seat's private row.
        private: Object.fromEntries(server.privates.map(id => [id, { playerId: id, data: { role: 'secret-' + id } }])),
        events: [],
        winner: null,
      };
      return { room: { ...room, code }, state };
    },
    async startGame(_code, restart) {
      if (server && !restart) throw new Error('game already started');
      server = { version: 0, turn: 0, privates: ['me', 'p2', 'p3'] };
    },
    async submitAction(_code, type) {
      if (type === 'BAD') throw new Error('not your turn');
      server = { ...server, version: server.version + 1, turn: server.turn + 1 };
    },
    async timeoutGame() { throw new Error('host only'); },
    subscribeGame(roomId, cb) {
      assert(roomId === room.id, 'subscribed to wrong room');
      onChange = cb;
      return () => { unsubscribed += 1; onChange = null; };
    },
  };

  (async () => {
    const transport = createSupabaseTransport({ roomCode: 'ABCD', service });
    const client = createGameClient({ playerId: 'me', transport });
    assert(client.getState().status === 'connecting', 'should be connecting before first fetch');
    await tick(20);

    let s = client.getState();
    assert(s.status === 'ready' && s.state === null, 'pre-game: ready with no state');
    assert(s.match?.hostId === 'me' && s.match.roomId === 'room-1', 'pre-game match info missing');
    assert(onChange, 'realtime not subscribed after first fetch');

    // Start → caller sees state immediately (no Realtime needed)
    let r = await client.startGame();
    assert(r.ok, 'start failed');
    s = client.getState();
    assert(s.state?.public.turn === 0, 'start result not visible');
    assert(Object.keys(s.state.private).join() === 'me', 'leaked private keys: ' + Object.keys(s.state.private));

    // Move
    r = await client.moves.VOTE_TEAM({ approve: true });
    assert(r.ok && client.getState().state.public.turn === 1, 'move result not visible');

    // Edge Function error
    r = await client.moves.BAD({});
    assert(!r.ok && r.error === 'not your turn' && client.getState().error === 'not your turn', 'error not surfaced');
    assert(client.getState().state.public.turn === 1, 'failed move changed state');
    r = await client.timeout();
    assert(!r.ok && r.error === 'host only', 'timeout error not surfaced');

    // Realtime burst: another player acts; 3 tables fire ×4 = 12 change events
    server = { ...server, version: server.version + 1, turn: 2 };
    const before = fetches;
    for (let i = 0; i < 12; i += 1) onChange();
    await tick(40);
    const burstFetches = fetches - before;
    assert(burstFetches <= 2, 'burst not coalesced: ' + burstFetches + ' fetches');
    assert(client.getState().state.public.turn === 2, 'realtime change not delivered');

    // Restart: server row version resets to 0 — must still be delivered
    const seqBefore = client.getState().version;
    r = await client.startGame({ restart: true });
    s = client.getState();
    assert(r.ok && s.state.public.turn === 0 && s.version > seqBefore, 'restart dropped as stale');

    // Fetch failure keeps last good state
    failNextFetch = true;
    onChange();
    await tick(20);
    s = client.getState();
    assert(s.error === 'network down' && s.state?.public.turn === 0 && s.status === 'ready', 'fetch failure lost state');

    // Next good sync clears the sync error
    onChange();
    await tick(20);
    assert(client.getState().error === null, 'sync error not cleared by recovery');

    // A rejected move error survives a later sync
    await client.moves.BAD({});
    onChange();
    await tick(20);
    assert(client.getState().error === 'not your turn', 'move error wiped by sync');

    // Disconnect tears down Realtime
    client.stop();
    assert(unsubscribed === 1 && onChange === null, 'realtime not unsubscribed');

    console.log('SupabaseTransport: PASS — burst of 12 events → ' + burstFetches + ' fetch(es), total fetches ' + fetches);
  })().catch(err => { console.error(err); process.exit(1); });
`);

await build({
  logLevel: 'silent',
  // Empty env dir → no real Supabase client is created during the test.
  envDir: dir,
  build: {
    ssr: entry,
    outDir: dir,
    emptyOutDir: false,
    target: 'node18',
    rollupOptions: { output: { entryFileNames: 'runner.mjs' } },
  },
});
await import(pathToFileURL(output));
