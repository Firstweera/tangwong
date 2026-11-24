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
  import { goodsValue } from '${process.cwd()}/src/features/games/checkpoint/goods.ts';
  import { CHECKPOINT_CONTRACTS, CONTRACT_IDS } from '${process.cwd()}/src/features/games/checkpoint/market.ts';
  import { checkpointWinners } from '${process.cwd()}/src/features/games/checkpoint/winConditions.ts';

  const assert = (cond, msg) => { if (!cond) throw new Error(msg); };
  const engine = new GameEngine(checkpointConfig);

  function makeRoom(count) {
    const players = Array.from({ length: count }, (_, index) => ({
      id: 'bot_' + (index + 1), nickname: 'Bot ' + (index + 1), mascot: 'fox',
      isHost: index === 0, isConnected: true, isReady: true,
    }));
    return {
      roomId: 'verify', roomCode: 'VERIFY', gameId: 'checkpoint', hostId: 'bot_1',
      players, maxPlayers: count, isPublic: false, status: 'in-game', createdAt: 0,
    };
  }

  function dispatch(state, action) {
    const result = engine.dispatch(state, action);
    if (!result.valid) throw new Error(action.type + ': ' + result.error);
    return result.state;
  }

  // ── 1. Full bot game: contract phase → shifts → final score with Contracts ──
  const room = makeRoom(4);
  let state = engine.transitionTo(engine.createInitialState(room), 'contract').state;
  assert(state.public.phase === 'contract', 'did not start in contract phase');
  assert(state.public.data.demand, 'no demand card at setup');
  for (const player of room.players) {
    const opts = state.private[player.id].data.contractOptions;
    assert(opts.length === 2 && opts[0] !== opts[1], 'contract options must be 2 different cards');
  }
  const wrongPick = CONTRACT_IDS.find(id => !state.private.bot_1.data.contractOptions.includes(id));
  assert(!engine.dispatch(state, { type: 'CHOOSE_CONTRACT', playerId: 'bot_1', payload: { contractId: wrongPick } }).valid,
    'accepted a contract that was not dealt');

  let actions = 0;
  const demandsSeen = [];
  let lastShift = 0;
  while (!state.winner && actions < 800) {
    const data = state.public.data;
    if (data.shift !== lastShift && state.public.phase === 'pack') { demandsSeen.push(data.demand); lastShift = data.shift; }
    if (state.public.phase !== 'contract' && !data.gameComplete) {
      // Contracts stay secret during play: no contract id anywhere in public data.
      const json = JSON.stringify(data);
      assert(!CONTRACT_IDS.some(id => json.includes(id)), 'contract id leaked into public data');
    }
    let action = null;
    for (const player of room.players) {
      action = nextBotAction(state, player.id);
      if (action) break;
    }
    // No fallback for market close: the host's bot policy must continue the shift.
    if (!action) throw new Error('Engine stalled in phase ' + state.public.phase);
    state = dispatch(state, action);
    actions += 1;
  }

  const pub = state.public.data;
  assert(state.winner, 'Game did not finish');
  assert(pub.shift === room.players.length * 2, 'Game did not run exactly two rotations');
  assert(state.winner.conditionId === 'checkpoint-wealth', 'Wrong win condition');
  assert(Object.keys(state.winner.scores ?? {}).length === room.players.length, 'Missing final scores');
  assert(pub.contractsChosen.length === room.players.length, 'not everyone chose a contract');
  assert(demandsSeen.length === pub.totalShifts, 'missed a demand card: ' + demandsSeen.length);
  assert(new Set(demandsSeen.slice(0, 7)).size === 7, 'first 7 demand cards were not all different');
  for (const player of room.players) {
    const id = player.id;
    const result = pub.contractResults?.[id];
    assert(result && result.contractId === state.private[id].data.contract, 'contract result missing for ' + id);
    const done = CHECKPOINT_CONTRACTS[result.contractId].progress(pub.delivered[id] ?? {}, pub.confiscatedIllegal[id] ?? 0).done;
    assert(result.completed === done, 'contract completion mismatch for ' + id);
    const expected = pub.cash[id] + goodsValue(pub.delivered[id] ?? {}) + pub.marketBonus[id] + (done ? CHECKPOINT_CONTRACTS[result.contractId].value : 0);
    assert(pub.wealth[id] === expected, 'final score mismatch for ' + id + ': ' + pub.wealth[id] + ' vs ' + expected);
  }
  assert(JSON.stringify(state.winner.winners) === JSON.stringify(checkpointWinners(pub)), 'winners ignore tie-breaks');
  console.log('Full game: PASS — actions', actions, 'shifts', pub.shift, 'winners', state.winner.winners.join(', '));

  // ── 2. Demand effects on one shift (3 players: gatekeeper bot_1, merchants bot_2 + bot_3) ──
  function playShift(demand, crates, decide) {
    const r = makeRoom(3);
    let s = engine.transitionTo(engine.createInitialState(r), 'contract').state;
    for (const p of r.players) {
      s = dispatch(s, { type: 'CHOOSE_CONTRACT', playerId: p.id, payload: { contractId: s.private[p.id].data.contractOptions[0] } });
    }
    assert(s.public.phase === 'pack', 'contract phase did not advance to pack');
    s = { ...s, public: { ...s.public, data: { ...s.public.data, demand } } };
    for (const [id, crate] of Object.entries(crates)) {
      s = { ...s, private: { ...s.private, [id]: { ...s.private[id], data: { ...s.private[id].data, hand: [...crate.goods, 'rice'] } } } };
      s = dispatch(s, { type: 'SUBMIT_CRATE', playerId: id, payload: crate });
    }
    for (const id of Object.keys(crates)) s = dispatch(s, { type: 'SUBMIT_OFFER', playerId: id, payload: { amount: 0 } });
    const before = s.public.data;
    for (const [id, type] of Object.entries(decide)) s = dispatch(s, { type, playerId: 'bot_1', payload: { merchantId: id } });
    return { before, after: s.public.data };
  }

  {
    const { before, after } = playShift('silk_festival',
      { bot_2: { goods: ['silk', 'silk'], declaredGoodId: 'silk' }, bot_3: { goods: ['rice'], declaredGoodId: 'rice' } },
      { bot_2: 'PASS_MERCHANT', bot_3: 'PASS_MERCHANT' });
    assert(after.marketBonus.bot_2 === 4, 'silk festival bonus should be 4, got ' + after.marketBonus.bot_2);
    assert(after.marketBonus.bot_3 === 0, 'rice got a silk bonus');
    assert(after.wealth.bot_2 === after.cash.bot_2 + 6 + 4, 'wealth missing market bonus');
    assert(before.marketBonus.bot_2 === 0, 'bonus before delivery');
  }
  {
    const { after } = playShift('apple_fair',
      { bot_2: { goods: ['apple', 'apple', 'apple'], declaredGoodId: 'apple' }, bot_3: { goods: ['rice'], declaredGoodId: 'rice' } },
      { bot_2: 'PASS_MERCHANT', bot_3: 'PASS_MERCHANT' });
    assert(after.marketBonus.bot_2 === 1, 'apple fair should give +1 once, got ' + after.marketBonus.bot_2);
  }
  {
    const { before, after } = playShift('weapons_crackdown',
      { bot_2: { goods: ['illegal_gun'], declaredGoodId: 'rice' }, bot_3: { goods: ['rice'], declaredGoodId: 'rice' } },
      { bot_2: 'INSPECT_MERCHANT', bot_3: 'PASS_MERCHANT' });
    const res = after.resolutions.find(x => x.merchantId === 'bot_2');
    assert(res.penaltyPaid === 6, 'crackdown penalty should be 4+2, got ' + res.penaltyPaid);
    assert(after.cash.bot_1 - before.cash.bot_1 === 6, 'gatekeeper did not receive the penalty');
    assert(after.confiscatedIllegal.bot_2 === 1, 'confiscated illegal not counted');
  }
  {
    const { before, after } = playShift('honest_trade',
      { bot_2: { goods: ['rice', 'rice'], declaredGoodId: 'rice' }, bot_3: { goods: ['apple'], declaredGoodId: 'apple' } },
      { bot_2: 'INSPECT_MERCHANT', bot_3: 'PASS_MERCHANT' });
    const res = after.resolutions.find(x => x.merchantId === 'bot_2');
    assert(res.compensationPaid === 2 && res.bankBonus === 1, 'honest trade should pay 2 + 1 from the bank');
    assert(after.cash.bot_2 - before.cash.bot_2 === 3, 'merchant cash should rise by 3');
    assert(before.cash.bot_1 - after.cash.bot_1 === 2, 'gatekeeper must pay only the compensation');
  }
  console.log('Demand effects: PASS');

  // ── 3. Tie-breaks ──
  const tie = {
    playerOrder: ['a', 'b', 'c'],
    wealth: { a: 30, b: 30, c: 20 },
    delivered: { a: { rice: 2 }, b: { rice: 1, illegal_gun: 1 }, c: {} },
    cash: { a: 10, b: 25, c: 20 },
  };
  assert(checkpointWinners(tie).join() === 'a', 'tie-break 1 (delivered legal) failed');
  assert(checkpointWinners({ ...tie, delivered: { a: { rice: 1 }, b: { rice: 1 }, c: {} } }).join() === 'b', 'tie-break 2 (cash) failed');
  assert(checkpointWinners({ ...tie, delivered: { a: { rice: 1 }, b: { rice: 1 }, c: {} }, cash: { a: 5, b: 5, c: 0 } }).join() === 'a,b',
    'full tie should be shared');
  console.log('Tie-breaks: PASS');
  console.log('Checkpoint runtime: PASS');
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
