/**
 * Runtime verification for createGameClient + LocalTransport.
 *
 * Plays full matches with several human seats (each its own GameClient, all in
 * one process) plus auto-played bot seats, and asserts:
 *   - every seat only ever receives its own private slice
 *   - typed moves reach the engine; invalid moves surface as { ok:false } + client.error
 *   - host-only start/timeout guards
 *   - bots and timeout resolve like the Edge Functions
 *   - every seat observes the same winner
 */
import { build } from 'vite';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const dir = mkdtempSync(join(tmpdir(), 'tangwong-client-'));
const entry = join(dir, 'runner.ts');
const output = join(dir, 'runner.mjs');
const src = `${process.cwd()}/src/features/games`;

writeFileSync(entry, `
  import { createGameClient, createLocalMaster } from '${src}/engine/client/index.ts';
  import { avalonConfig } from '${src}/avalon/config.ts';
  import { nextBotAction as avalonBot } from '${src}/avalon/bot.ts';
  import { werewolfConfig } from '${src}/werewolf/config.ts';
  import { getGameRuntime } from '${src}/runtime.ts';
  import { nextBotAction as werewolfBot } from '${src}/werewolf/bot.ts';

  const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

  async function play({ name, config, firstPhase, bot, humans, bots }) {
    const ids = [...humans, ...bots];
    const players = ids.map((id, i) => ({
      id, nickname: id, mascot: 'fox', isHost: i === 0, isConnected: true, isReady: true,
    }));
    const room = {
      roomId: 'local', roomCode: 'LOCAL', gameId: config.id, hostId: humans[0],
      players, maxPlayers: ids.length, isPublic: false, status: 'waiting', createdAt: 0,
    };

    const master = createLocalMaster({ config, firstPhase, nextBotAction: bot, room });
    const clients = Object.fromEntries(
      humans.map(id => [id, createGameClient({ playerId: id, transport: master.transport })]),
    );
    const host = clients[humans[0]];
    let notifications = 0;
    host.subscribe(() => { notifications += 1; });

    // Guards
    assert(host.getState().status === 'ready', 'client should be ready after connect');
    const early = await host.moves.CONTINUE(null);
    assert(!early.ok && host.getState().error === 'game not started', 'move before start must fail');
    const notHost = await clients[humans[1]].startGame();
    assert(!notHost.ok && notHost.error === 'host only', 'non-host start must fail');
    const started = await host.startGame();
    assert(started.ok, 'host start failed: ' + (started.ok ? '' : started.error));
    assert(host.getState().error === null, 'error should clear after success');

    // Bogus move is rejected without changing state
    const before = host.getState().version;
    const bogus = await host.moves.NOT_A_REAL_ACTION({});
    assert(!bogus.ok && host.getState().version === before, 'invalid move must not change state');

    let steps = 0, timeouts = 0;
    while (!master.getFullState().winner && steps < 1000) {
      steps += 1;
      // Privacy: each seat sees exactly its own private slice.
      for (const id of humans) {
        const keys = Object.keys(clients[id].getState().state.private);
        assert(keys.length === 1 && keys[0] === id, name + ': ' + id + ' saw private keys ' + keys);
      }

      const full = master.getFullState();
      const actor = humans.find(id => bot(full, id));
      assert(actor, name + ': stalled in phase ' + full.public.phase);

      // Every 7th human turn, let the host time the seat out instead.
      if (steps % 7 === 0) {
        const r = await host.timeout();
        assert(r.ok, 'timeout failed: ' + (r.ok ? '' : r.error));
        timeouts += 1;
        continue;
      }
      const action = bot(full, actor);
      const r = await clients[actor].moves[action.type](action.payload);
      assert(r.ok, name + ': ' + action.type + ' rejected: ' + (r.ok ? '' : r.error));
    }

    const winner = master.getFullState().winner;
    assert(winner, name + ': game did not finish');
    for (const id of humans) {
      const s = clients[id].getState();
      assert(s.state.winner?.conditionId === winner.conditionId, id + ' missed the winner');
      assert(!s.busy, id + ' left busy');
    }
    const nonHostTimeout = await clients[humans[1]].timeout();
    assert(!nonHostTimeout.ok, 'non-host timeout must fail');
    Object.values(clients).forEach(c => c.stop());

    console.log(
      name + ': PASS — human steps ' + steps + ', timeouts ' + timeouts +
      ', total actions ' + master.getActionLog().length +
      ', host notifications ' + notifications + ', winner ' + winner.conditionId,
    );
  }


  const tick = (ms) => new Promise(r => setTimeout(r, ms));

  // Offline mode exactly as useLocalGameClient wires it: every seat but "me"
  // is bot-played with real (short) delays, me is not the host, hostOnly off,
  // reveal published at game end.
  async function playOffline(gameId, seatCount) {
    const rt = getGameRuntime(gameId);
    assert(rt, 'no runtime for ' + gameId);
    const ids = ['host', 'me', ...Array.from({ length: seatCount - 2 }, (_, i) => 'bot_' + (i + 1))];
    const room = {
      roomId: 'solo', roomCode: 'SOLO', gameId, hostId: 'host',
      players: ids.map(id => ({ id, nickname: id, mascot: 'fox', isHost: id === 'host', isConnected: true, isReady: true })),
      maxPlayers: seatCount, isPublic: false, status: 'in-game', createdAt: 0,
    };
    const master = createLocalMaster({
      config: rt.config, firstPhase: rt.firstPhase, nextBotAction: rt.nextBotAction,
      revealForPublic: rt.revealForPublic, botDelayMs: 2, isBot: id => id !== 'me',
      hostOnly: false, room,
    });
    const me = createGameClient({ playerId: 'me', transport: master.transport });
    const started = await me.startGame();
    assert(started.ok, gameId + ' offline start (non-host) failed');
    assert(me.getState().state.public.phase === rt.firstPhase, gameId + ' not in first phase');

    // Bots must be paced, not instant.
    const logAfterStart = master.getActionLog().length;
    let manual = 0, autoFrom = -1;
    for (let i = 0; i < 4000 && !master.getFullState().winner; i += 1) {
      const keys = Object.keys(me.getState().state.private);
      assert(keys.length === 1 && keys[0] === 'me', gameId + ' offline leaked ' + keys);
      const full = master.getFullState();
      // Hand my seat to the bot halfway through (🤖 toggle).
      if (manual === 6 && autoFrom < 0) { master.setAutoPlay('me', true); autoFrom = master.getActionLog().length; }
      let action = autoFrom < 0 ? rt.nextBotAction(full, 'me') : null;
      // Checkpoint: host-only CONTINUE_SHIFT has no bot policy (same as before).
      if (!action && full.public.phase === 'shiftResult') action = { type: 'CONTINUE_SHIFT', playerId: 'host', payload: null };
      if (action && action.playerId === 'me') {
        const r = await me.moves[action.type](action.payload);
        assert(r.ok, gameId + ' offline ' + action.type + ': ' + (r.ok ? '' : r.error));
        manual += 1;
      } else if (action) {
        assert((await master.transport.submit(action)).ok, 'continue failed');
      } else {
        await tick(3);
      }
    }
    const end = me.getState().state;
    assert(end?.winner, gameId + ' offline did not finish');
    assert(logAfterStart < master.getActionLog().length, gameId + ' bots never moved');
    if (gameId !== 'checkpoint') {
      const reveal = end.public.data.reveal ?? {};
      assert(Object.keys(reveal).length === seatCount, gameId + ' reveal missing seats: ' + Object.keys(reveal).length);
    }
    me.stop();
    console.log(gameId + ' offline: PASS — my manual moves ' + manual + ', autoplay from action ' + autoFrom + ', total ' + master.getActionLog().length);
  }

  // Devtools seat switching exactly as useLocalGameClient wires it: one master,
  // isBot reads the currently viewed seat, one client per viewed seat.
  async function seatSwitch(gameId, seatCount) {
    const rt = getGameRuntime(gameId);
    const ids = ['me', ...Array.from({ length: seatCount - 1 }, (_, i) => 'p' + (i + 2))];
    const room = {
      roomId: 'solo', roomCode: 'SOLO', gameId, hostId: 'me',
      players: ids.map(id => ({ id, nickname: id, mascot: 'fox', isHost: id === 'me', isConnected: true, isReady: true })),
      maxPlayers: seatCount, isPublic: false, status: 'in-game', createdAt: 0,
    };
    const view = { seat: 'me' };
    const master = createLocalMaster({
      config: rt.config, firstPhase: rt.firstPhase, nextBotAction: rt.nextBotAction,
      revealForPublic: rt.revealForPublic, botDelayMs: 2, isBot: id => id !== view.seat,
      hostOnly: false, room,
    });
    const clients = new Map();
    let active = null;
    const switchTo = seat => {
      active?.stop();
      view.seat = seat;
      if (!clients.has(seat)) clients.set(seat, createGameClient({ playerId: seat, transport: master.transport, autoStart: false }));
      active = clients.get(seat);
      active.start();
    };
    switchTo('me');
    assert((await active.startGame()).ok, 'seat-switch start failed');

    const visited = new Set();
    let switches = 0;
    for (let i = 0; i < 4000 && !master.getFullState().winner; i += 1) {
      const full = master.getFullState();
      // Every time someone other than the viewed seat must act, jump to them.
      const waiting = ids.find(id => id !== view.seat && rt.nextBotAction(full, id));
      if (waiting && switches < 40 && i % 3 === 0) { switchTo(waiting); switches += 1; }
      const s = active.getState().state;
      const keys = Object.keys(s.private);
      assert(keys.length === 1 && keys[0] === view.seat, gameId + ' seat ' + view.seat + ' saw ' + keys);
      visited.add(view.seat);
      let action = rt.nextBotAction(full, view.seat);
      if (!action && full.public.phase === 'shiftResult') action = { type: 'CONTINUE_SHIFT', playerId: 'me', payload: null };
      if (action && action.playerId === view.seat) {
        const r = await active.submit(action.type, action.payload);
        assert(r.ok, gameId + ' seat ' + view.seat + ' ' + action.type + ': ' + (r.ok ? '' : r.error));
      } else if (action) {
        assert((await master.transport.submit(action)).ok, 'continue failed');
      } else {
        await tick(3);
      }
    }
    assert(master.getFullState().winner, gameId + ' seat-switch game did not finish');
    assert(visited.size >= 3, gameId + ' only visited ' + visited.size + ' seats');
    active.stop();
    console.log(gameId + ' seat switch: PASS — ' + switches + ' switches across ' + visited.size + ' seats');
  }

  (async () => {
  await play({
    name: 'avalon', config: avalonConfig, firstPhase: 'roleReveal', bot: avalonBot,
    humans: ['p1', 'p2', 'p3'], bots: ['bot_4', 'bot_5'],
  });
  await play({
    name: 'werewolf', config: werewolfConfig, firstPhase: 'roleReveal', bot: werewolfBot,
    humans: ['p1', 'p2', 'p3', 'p4'], bots: ['bot_5', 'bot_6', 'bot_7'],
  });
  await playOffline('avalon', 6);
  await playOffline('werewolf', 7);
  await playOffline('checkpoint', 4);
  await seatSwitch('avalon', 5);
  await seatSwitch('werewolf', 7);
  await seatSwitch('checkpoint', 3);
  console.log('Game client runtime: PASS');
  })().catch(err => { console.error(err); process.exit(1); });
`);

await build({
  logLevel: 'silent',
  build: {
    ssr: entry,
    outDir: dir,
    emptyOutDir: false,
    target: 'node18',
    rollupOptions: { output: { entryFileNames: 'runner.mjs' } },
  },
});
await import(pathToFileURL(output));
