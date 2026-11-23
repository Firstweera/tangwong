// e2e-live-game.mjs — live integration harness for Phase 4.5.3 (game authority).
//
// Drives the DEPLOYED Supabase backend (Edge Functions + RLS) exactly the way
// two real clients would, following supabase/functions/README.md verify steps:
//
//   B2 game-start · B3 game-action · B5 TIMEOUT · hidden-info RLS gate
//   + full Werewolf and Checkpoint matches (Checkpoint: secret Contracts, demand,
//     final scoring recomputed from public data)
//
// It uses anonymous auth (no login wall) and the public anon key from
// .env.local — the same key the browser ships. It does NOT need the service
// role key (that lives only inside the Edge Functions).
//
// ⚠️  This writes to the PRODUCTION database: it creates one real room + game,
//     then cleans up by having both human players leave (which deletes the
//     empty room). Bots are removed with the room.
//
// Usage:
//   node scripts/e2e-live-game.mjs            # core checks (fast)
//   node scripts/e2e-live-game.mjs --slow     # also wait out a phase timer and
//                                             # verify a real expired TIMEOUT
//
// Exit code 0 = all passed, 1 = a check failed.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SLOW = process.argv.includes('--slow');

// ── env ──────────────────────────────────────────────────────────────────
function loadEnv() {
  const raw = readFileSync(join(ROOT, '.env.local'), 'utf8');
  const env = {};
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}
const env = loadEnv();
const URL = env.VITE_SUPABASE_URL;
const ANON = env.VITE_SUPABASE_ANON_KEY;
if (!URL || !ANON) {
  console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

// ── tiny test runner ───────────────────────────────────────────────────────
let pass = 0;
let fail = 0;
function ok(name, cond, detail = '') {
  if (cond) {
    pass++;
    console.log(`  \x1b[32m✓\x1b[0m ${name}${detail ? ` — ${detail}` : ''}`);
  } else {
    fail++;
    console.log(`  \x1b[31m✗ ${name}${detail ? ` — ${detail}` : ''}\x1b[0m`);
  }
}
function step(msg) {
  console.log(`\n\x1b[36m▶ ${msg}\x1b[0m`);
}

// A fresh client per human player → independent anon session in memory.
function freshClient() {
  return createClient(URL, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// supabase-js wraps non-2xx Edge Function responses in FunctionsHttpError with
// the raw Response on `.context`. Normalise to { ok, status, body }.
async function invoke(client, fn, body) {
  const { data, error } = await client.functions.invoke(fn, { body });
  if (!error) return { ok: true, status: 200, body: data };
  let status = 0;
  let parsed = null;
  if (error.context && typeof error.context.json === 'function') {
    status = error.context.status;
    try {
      parsed = await error.context.json();
    } catch {
      /* non-json body */
    }
  }
  return { ok: false, status, body: parsed, message: error.message };
}

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const randomCode = () =>
  Array.from({ length: 5 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
const botId = () => `bot_${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Play a full Avalon match to completion against the live authority. The server
// auto-resolves bot seats after every human action, so the harness only needs to
// supply the two humans' (host + guest) legal moves, all derivable from
// public_data. Strategy: always approve teams and always play Success, which
// drives the loyal side to 3 quest wins → assassinate → end (winner = whether the
// assassin hits Merlin). Returns the final game_states row, or null if it never
// resolves within the iteration budget.
async function playToEnd({ host, guest, hostId, guestId, code, roomId }) {
  const humans = new Map([[hostId, host], [guestId, guest]]);
  const isHuman = (id) => humans.has(id);
  let lastVersion = -1;
  let stuck = 0;

  for (let i = 0; i < 100; i += 1) {
    const { data: gs } = await host
      .from('game_states')
      .select('phase,status,version,public_data,winner')
      .eq('room_id', roomId)
      .single();
    if (!gs) return null;
    if (gs.status === 'ended' || gs.phase === 'end' || gs.winner) return gs;

    const P = gs.public_data || {};
    const order = P.playerOrder || [];
    let acted = false;

    if (gs.phase === 'roleReveal' || gs.phase === 'questReveal') {
      acted = (await invoke(host, 'game-action', { code, type: 'CONTINUE', payload: null })).ok;
    } else if (gs.phase === 'teamProposal') {
      const leader = order[P.leaderIndex];
      if (isHuman(leader)) {
        const size = P.quests?.[P.currentQuest]?.size ?? 2;
        const team = order.slice(0, size);
        acted = (await invoke(humans.get(leader), 'game-action',
          { code, type: 'NOMINATE_TEAM', payload: { team } })).ok;
      }
    } else if (gs.phase === 'teamVote') {
      for (const [id, client] of humans) {
        if (!(id in (P.votes || {}))) {
          if ((await invoke(client, 'game-action', { code, type: 'VOTE_TEAM', payload: { approve: true } })).ok) acted = true;
        }
      }
    } else if (gs.phase === 'mission') {
      for (const [id, client] of humans) {
        if ((P.proposedTeam || []).includes(id) && !(id in (P.missionCards || {}))) {
          if ((await invoke(client, 'game-action', { code, type: 'PLAY_MISSION_CARD', payload: { card: 'success' } })).ok) acted = true;
        }
      }
    } else if (gs.phase === 'assassinate') {
      for (const [id, client] of humans) {
        const { data: mine } = await client.from('game_private')
          .select('private_data').eq('player_id', id).maybeSingle();
        if (mine?.private_data?.role === 'assassin') {
          const target = order.find((p) => p !== id) || order[0];
          acted = (await invoke(client, 'game-action', { code, type: 'ASSASSINATE', payload: { targetId: target } })).ok;
          break;
        }
      }
    }

    // When the resting actor is a bot (transient race) the harness sends nothing;
    // wait briefly and re-read rather than busy-looping.
    if (!acted && gs.version === lastVersion) {
      if (++stuck >= 6) return gs; // genuinely stuck — let caller assert/fail
      await sleep(400);
    } else {
      stuck = 0;
    }
    lastVersion = gs.version;
  }
  return null; // iteration budget exhausted
}

// Drive a full Werewolf match against the live backend.
// The server resolves bot night actions synchronously after each human game-action,
// so the harness only needs to supply the two humans' moves (role-based night
// actions + day votes). Strategy: always vote for the first alive non-self player;
// this guarantees a lynch each day and drives the game to an end.
async function playWerewolfToEnd({ host, guest, hostId, guestId, code, roomId }) {
  const humans = new Map([[hostId, host], [guestId, guest]]);
  let lastVersion = -1;
  let stuck = 0;

  for (let i = 0; i < 120; i++) {
    const { data: gs } = await host
      .from('game_states')
      .select('phase,status,version,public_data,winner')
      .eq('room_id', roomId)
      .single();
    if (!gs) return null;
    if (gs.status === 'ended' || gs.phase === 'end' || gs.winner) return gs;

    const P = gs.public_data || {};
    const order = P.playerOrder || [];
    const eliminated = P.eliminatedPlayers || [];
    const aliveOrder = order.filter(id => !eliminated.includes(id));
    const nightActors = P.nightActors || [];
    const votes = P.votes || {};
    let acted = false;

    if (['roleReveal', 'dawn', 'dayDiscuss', 'resolve'].includes(gs.phase)) {
      acted = (await invoke(host, 'game-action', { code, type: 'CONTINUE', payload: null })).ok;

    } else if (gs.phase === 'night') {
      for (const [id, client] of humans) {
        if (eliminated.includes(id)) continue;
        if (nightActors.includes(id)) continue;
        const { data: mine } = await client
          .from('game_private').select('private_data')
          .eq('room_id', roomId)
          .eq('player_id', id).maybeSingle();
        const priv = mine?.private_data;
        if (!priv) continue;

        if (priv.role === 'werewolf') {
          const wolfIds = [id, ...(priv.sees || [])];
          const target = aliveOrder.find(p => !wolfIds.includes(p));
          if (target) acted = (await invoke(client, 'game-action', { code, type: 'WEREWOLF_KILL', payload: { targetId: target } })).ok || acted;

        } else if (priv.role === 'seer') {
          const checked = (priv.seerHistory || []).map(h => h.playerId);
          const target = aliveOrder.find(p => p !== id && !checked.includes(p)) || aliveOrder.find(p => p !== id);
          if (target) acted = (await invoke(client, 'game-action', { code, type: 'SEER_PEEK', payload: { targetId: target } })).ok || acted;

        } else if (priv.role === 'doctor') {
          const lastProtected = priv.doctorLastProtected;
          const target = aliveOrder.find(p => p !== lastProtected) || aliveOrder[0];
          if (target) acted = (await invoke(client, 'game-action', { code, type: 'DOCTOR_SAVE', payload: { targetId: target } })).ok || acted;

        } else if (priv.role === 'cupid' && P.dayCount === 1 && !P.lovers) {
          // Pick any 2 alive non-self players
          const candidates = aliveOrder.filter(p => p !== id);
          if (candidates.length >= 2) {
            acted = (await invoke(client, 'game-action', {
              code, type: 'CUPID_LINK', payload: { targetIds: [candidates[0], candidates[1]] },
            })).ok || acted;
          }

        } else if (priv.role === 'spellcaster') {
          const target = aliveOrder.find(p => p !== id);
          if (target) acted = (await invoke(client, 'game-action', { code, type: 'SILENCE', payload: { targetId: target } })).ok || acted;
        }
        // villager / cupid (nights 2+): no night action — server bots handle remaining roles
      }

    } else if (gs.phase === 'dayVote') {
      for (const [id, client] of humans) {
        if (eliminated.includes(id)) continue;
        if (id in votes) continue;
        const target = aliveOrder.find(p => p !== id) || null;
        acted = (await invoke(client, 'game-action', { code, type: 'LYNCH_VOTE', payload: { targetId: target } })).ok || acted;
      }
    }

    if (!acted && gs.version === lastVersion) {
      if (++stuck >= 8) return gs;
      await sleep(400);
    } else {
      stuck = 0;
    }
    lastVersion = gs.version;
  }
  return null;
}

// ── Checkpoint ──────────────────────────────────────────────────────────────
// Mirrors src/features/games/checkpoint/{goods,market}.ts. If those values change,
// update these too (the final-score check below will fail otherwise).
const CP_GOODS = {
  rice: { legal: true, value: 2 }, apple: { legal: true, value: 2 }, spice: { legal: true, value: 3 },
  silk: { legal: true, value: 3 }, medicine: { legal: true, value: 4 },
  forged_documents: { legal: false, value: 6 }, stolen_gems: { legal: false, value: 7 },
  illegal_gun: { legal: false, value: 8 }, counterfeit_money: { legal: false, value: 9 },
};
const CP_CONTRACT_IDS = ['rice_merchant', 'silk_road', 'diverse_cargo', 'arms_dealer', 'master_forger', 'clean_record'];
const CP_PRIVATE_TYPES = ['CHOOSE_CONTRACT', 'SUBMIT_CRATE', 'SUBMIT_OFFER'];

// Drive the two humans through a full Checkpoint match with simple legal moves
// (keep the first Contract, pack one card and declare it truthfully when legal,
// offer 0, pass every merchant, host continues each shift). Bots are resolved by
// the server. Also records whether any Contract id ever appeared in public data
// before the game was complete.
async function playCheckpointToEnd({ host, guest, hostId, guestId, code, roomId }) {
  const humans = new Map([[hostId, host], [guestId, guest]]);
  const result = { final: null, contractLeak: null, shiftsSeen: new Set() };
  let lastVersion = -1;
  let stuck = 0;

  for (let i = 0; i < 300; i++) {
    const { data: gs } = await host
      .from('game_states')
      .select('phase,status,version,public_data,winner')
      .eq('room_id', roomId)
      .single();
    if (!gs) return result;
    const P = gs.public_data || {};
    if (!P.gameComplete) {
      const json = JSON.stringify(P);
      const leaked = CP_CONTRACT_IDS.find(id => json.includes(id));
      if (leaked && !result.contractLeak) result.contractLeak = `${leaked} in phase ${gs.phase}`;
    }
    if (gs.status === 'ended' || gs.phase === 'end' || gs.winner) { result.final = gs; return result; }
    if (P.shift) result.shiftsSeen.add(P.shift);

    let acted = false;
    const merchants = (P.playerOrder || []).filter(id => id !== P.gatekeeperId);

    if (gs.phase === 'shiftResult') {
      acted = (await invoke(host, 'game-action', { code, type: 'CONTINUE_SHIFT', payload: null })).ok;
    } else {
      for (const [id, client] of humans) {
        const isGatekeeper = id === P.gatekeeperId;
        let move = null;
        if (gs.phase === 'contract' && !(P.contractsChosen || []).includes(id)) {
          const { data: mine } = await client.from('game_private').select('private_data')
            .eq('room_id', roomId).eq('player_id', id).maybeSingle();
          const opts = mine?.private_data?.contractOptions || [];
          if (opts[0]) move = { type: 'CHOOSE_CONTRACT', payload: { contractId: opts[0] } };
        } else if (gs.phase === 'pack' && !isGatekeeper && !(P.declarations || {})[id]) {
          const { data: mine } = await client.from('game_private').select('private_data')
            .eq('room_id', roomId).eq('player_id', id).maybeSingle();
          const card = mine?.private_data?.hand?.[0];
          if (card) move = { type: 'SUBMIT_CRATE', payload: { goods: [card], declaredGoodId: CP_GOODS[card].legal ? card : 'rice' } };
        } else if (gs.phase === 'negotiate' && !isGatekeeper && !(P.offersSubmitted || []).includes(id)) {
          move = { type: 'SUBMIT_OFFER', payload: { amount: 0 } };
        } else if (gs.phase === 'decide' && isGatekeeper) {
          const next = merchants.find(m => !(P.resolvedMerchants || []).includes(m));
          if (next) move = { type: 'PASS_MERCHANT', payload: { merchantId: next } };
        }
        if (move) acted = (await invoke(client, 'game-action', { code, ...move })).ok || acted;
      }
    }

    if (!acted && gs.version === lastVersion) {
      if (++stuck >= 8) { result.final = gs; return result; }
      await sleep(400);
    } else {
      stuck = 0;
    }
    lastVersion = gs.version;
  }
  return result;
}

async function main() {
  console.log(`\n\x1b[1mTangWong live game harness\x1b[0m → ${URL}`);
  console.log(`mode: ${SLOW ? 'slow (waits out a real phase timer)' : 'fast (core checks)'}`);

  const host = freshClient();
  const guest = freshClient();
  const code = randomCode();
  let cleanup = async () => {};
  let wCode = '';
  let wCleanup = async () => {};
  let cCode = '';
  let cCleanup = async () => {};

  try {
    // ── auth ────────────────────────────────────────────────────────────
    step('Anonymous sign-in (host + guest)');
    const a = await host.auth.signInAnonymously();
    const b = await guest.auth.signInAnonymously();
    const hostId = a.data?.user?.id;
    const guestId = b.data?.user?.id;
    ok('host session', !!hostId, hostId);
    ok('guest session', !!guestId && guestId !== hostId, guestId);
    if (!hostId || !guestId) throw new Error('anon auth failed — is anonymous sign-in enabled?');

    // ── room setup: host + guest + 3 bots = 5 players ─────────────────────
    step(`Create room ${code} and seat 5 players`);
    const seed = {
      name: '[e2e] harness room',
      gameId: 'avalon',
      maxPlayers: 7,
      isPublic: false,
      inviteLink: `https://tangwong.app/join/${code}`,
    };
    const createRes = await host.rpc('join_room', {
      p_code: code,
      p_seed: { ...seed, nickname: 'Host', mascot: 'fox' },
    });
    ok('host created room', !createRes.error, createRes.error?.message);

    const joinRes = await guest.rpc('join_room', {
      p_code: code,
      p_seed: { ...seed, nickname: 'Guest', mascot: 'owl' },
    });
    ok('guest joined room', !joinRes.error, joinRes.error?.message);

    cleanup = async () => {
      try { await guest.rpc('leave_room', { p_code: code }); } catch {}
      try { await host.rpc('leave_room', { p_code: code }); } catch {}
    };

    const mascots = ['cat', 'panda', 'rabbit'];
    for (let i = 0; i < 3; i++) {
      const r = await host.rpc('add_bot', {
        p_code: code,
        p_bot: { id: botId(), name: `Bot ${i + 1}`, mascot: mascots[i] },
      });
      ok(`add bot ${i + 1}`, !r.error, r.error?.message);
    }

    const { data: roomRow } = await host.from('rooms').select('id,host_id,status').eq('code', code).single();
    const { count: memberCount } = await host
      .from('room_players')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', roomRow.id);
    ok('5 players seated', memberCount === 5, `count=${memberCount}`);
    ok('host is host', roomRow.host_id === hostId);

    // ── B2: game-start ────────────────────────────────────────────────────
    step('B2 — game-start (host only)');
    const start = await invoke(host, 'game-start', { code });
    ok('game-start ok', start.ok, JSON.stringify(start.body));

    const guestStart = await invoke(guest, 'game-start', { code });
    ok('non-host game-start rejected', !guestStart.ok && guestStart.status === 403,
       `status=${guestStart.status} ${JSON.stringify(guestStart.body)}`);

    const { data: gs } = await host.from('game_states').select('*').eq('room_id', roomRow.id).single();
    ok('game_states phase = roleReveal', gs?.phase === 'roleReveal', `phase=${gs?.phase}`);
    ok('room status = in-game', (await host.from('rooms').select('status').eq('id', roomRow.id).single()).data?.status === 'in-game');

    // ── hidden-info RLS gate (the heart of 4.5.3) ─────────────────────────
    step('RLS — hidden-info gate (game_private owner-only)');
    const guestOwn = await guest.from('game_private').select('*').eq('player_id', guestId);
    const guestOthers = await guest.from('game_private').select('*').neq('player_id', guestId);
    ok('guest reads OWN private row', (guestOwn.data?.length ?? 0) === 1, `rows=${guestOwn.data?.length}`);
    ok('guest CANNOT read others\' private rows', (guestOthers.data?.length ?? 0) === 0,
       `leaked=${guestOthers.data?.length}`);

    // ── B3: game-action ───────────────────────────────────────────────────
    step('B3 — game-action');
    const vBefore = gs.version;
    const cont = await invoke(host, 'game-action', { code, type: 'CONTINUE', payload: null });
    ok('CONTINUE from roleReveal ok', cont.ok, JSON.stringify(cont.body));
    const { data: gs2 } = await host.from('game_states').select('version,phase').eq('room_id', roomRow.id).single();
    ok('phase advanced to teamProposal', gs2?.phase === 'teamProposal', `phase=${gs2?.phase}`);
    ok('version incremented', gs2.version === vBefore + 1, `${vBefore} → ${gs2.version}`);

    const illegal = await invoke(guest, 'game-action', { code, type: 'CONTINUE', payload: null });
    ok('illegal action rejected (400)', !illegal.ok && illegal.status === 400,
       `status=${illegal.status} ${JSON.stringify(illegal.body)}`);

    // ── B5: host-driven TIMEOUT ───────────────────────────────────────────
    step('B5 — host-driven TIMEOUT');
    const early = await invoke(host, 'game-action', { code, type: 'TIMEOUT', payload: null });
    ok('early TIMEOUT rejected (409)', !early.ok && early.status === 409,
       `status=${early.status} ${JSON.stringify(early.body)}`);

    const guestTimeout = await invoke(guest, 'game-action', { code, type: 'TIMEOUT', payload: null });
    ok('non-host TIMEOUT rejected (403 host only)', !guestTimeout.ok && guestTimeout.status === 403,
       `status=${guestTimeout.status} ${JSON.stringify(guestTimeout.body)}`);

    if (SLOW) {
      step('B5 (slow) — wait out the phase timer, then a real TIMEOUT');
      const retryMs = early.body?.retryAfterMs ?? 0;
      if (!retryMs) {
        ok('phase has a timer to expire', false, 'no retryAfterMs on 409 — skipping');
      } else {
        const wait = retryMs + 2000;
        console.log(`  …waiting ${Math.round(wait / 1000)}s for the timer to expire`);
        await new Promise((r) => setTimeout(r, wait));
        const expired = await invoke(host, 'game-action', { code, type: 'TIMEOUT', payload: null });
        ok('expired TIMEOUT accepted', expired.ok, JSON.stringify(expired.body));
        const { data: gs3 } = await host.from('game_states').select('version').eq('room_id', roomRow.id).single();
        ok('version incremented after TIMEOUT', gs3.version > gs2.version, `${gs2.version} → ${gs3.version}`);
        const { data: audit } = await host
          .from('game_actions')
          .select('type')
          .eq('room_id', roomRow.id)
          .order('created_at', { ascending: false })
          .limit(5);
        ok('TIMEOUT audit row logged', (audit ?? []).some((r) => r.type === 'TIMEOUT'),
           `recent=${(audit ?? []).map((r) => r.type).join(',')}`);
      }
    } else {
      console.log('  (run with --slow to also verify a real expired TIMEOUT progression)');
    }

    // ── B6: reconnect / resume mid-match ──────────────────────────────────
    // Simulate a page reload: a brand-new client adopts the guest's existing
    // session (same auth.uid) and must resume the in-progress game from the
    // server — current public state, own role, RLS still enforced, and the
    // ability to act again. Non-mutating (the resume action is phase-illegal on
    // purpose) so it doesn't disturb the full-match play below.
    step('B6 — reconnect mid-match (fresh client, same identity)');
    const guestSession = b.data?.session;
    if (!guestSession?.access_token) {
      ok('captured guest session for reconnect', false, 'no session tokens');
    } else {
      const guest2 = freshClient();
      await guest2.auth.setSession({
        access_token: guestSession.access_token,
        refresh_token: guestSession.refresh_token,
      });
      const reUser = (await guest2.auth.getUser()).data?.user?.id;
      ok('reconnected as the same identity', reUser === guestId, `uid=${reUser}`);

      const { data: rePub } = await guest2.from('game_states')
        .select('phase,status,public_data,version').eq('room_id', roomRow.id).single();
      ok('resumes the in-progress public state', rePub?.phase === 'teamProposal' && rePub?.status === 'in-game',
         `phase=${rePub?.phase} status=${rePub?.status}`);

      const { data: reMine } = await guest2.from('game_private').select('*').eq('player_id', guestId);
      ok('resumes own private role after reconnect',
         (reMine?.length ?? 0) === 1 && !!reMine?.[0]?.private_data?.role,
         `role=${reMine?.[0]?.private_data?.role}`);

      const { data: reOthers } = await guest2.from('game_private').select('*').neq('player_id', guestId);
      ok("reconnected client still cannot read others' roles", (reOthers?.length ?? 0) === 0,
         `leaked=${reOthers?.length}`);

      // Resume acting: a VOTE during teamProposal is phase-illegal, so it reaches
      // engine validation (400) rather than the membership gate (403) — proving
      // the reconnected client is authenticated AND recognised as a room member.
      const reAct = await invoke(guest2, 'game-action', { code, type: 'VOTE_TEAM', payload: { approve: true } });
      ok('reconnected client can act (reaches engine, not 403)', !reAct.ok && reAct.status === 400,
         `status=${reAct.status} ${JSON.stringify(reAct.body)}`);
    }

    // ── B6: play a full match to completion ───────────────────────────────
    step('B6 — play a full Avalon match to the end (always approve + Success)');
    const final = await playToEnd({ host, guest, hostId, guestId, code, roomId: roomRow.id });
    ok('game reached an end state', !!final && (final.status === 'ended' || final.winner),
       final ? `phase=${final.phase} status=${final.status} winner=${JSON.stringify(final.winner)}` : 'no final state (stuck/budget)');

    if (final) {
      const reveal = final.public_data?.reveal;
      const revealCount = reveal ? Object.keys(reveal).length : 0;
      ok('end-game reveal present for all players', revealCount === 5,
         `reveal entries=${revealCount}`);
      ok('reveal carries role + side', !!reveal && Object.values(reveal).every((r) => r?.role && r?.side),
         reveal ? JSON.stringify(Object.values(reveal)[0]) : 'no reveal');

      const { data: endRoom } = await host.from('rooms').select('status').eq('id', roomRow.id).single();
      ok('room status = ended', endRoom?.status === 'ended', `status=${endRoom?.status}`);

      // After the game ends, hidden info is intentionally released via the public
      // reveal — confirm the guest can now see every role through public_data.
      const { data: guestView } = await guest.from('game_states')
        .select('public_data').eq('room_id', roomRow.id).single();
      ok('guest can read the public end-game reveal', (guestView?.public_data?.reveal &&
         Object.keys(guestView.public_data.reveal).length === 5),
         `guest sees ${Object.keys(guestView?.public_data?.reveal ?? {}).length} roles`);
    }

    // ── P2: rematch — host re-deals a fresh game into the same room ────────
    step('P2 — rematch (game-start restart re-deals the same room)');
    const rematch = await invoke(host, 'game-start', { code, restart: true });
    ok('rematch accepted', rematch.ok, JSON.stringify(rematch.body));

    const guestRematchBlocked = await invoke(guest, 'game-start', { code, restart: true });
    ok('non-host rematch rejected (403)', !guestRematchBlocked.ok && guestRematchBlocked.status === 403,
       `status=${guestRematchBlocked.status}`);

    const { data: fresh } = await host.from('game_states').select('phase,status,version,public_data').eq('room_id', roomRow.id).single();
    ok('fresh game dealt (roleReveal, in-game, v0)',
       fresh?.phase === 'roleReveal' && fresh?.status === 'in-game' && fresh?.version === 0,
       `phase=${fresh?.phase} status=${fresh?.status} v=${fresh?.version}`);
    ok('rematch cleared the old end-game reveal', !fresh?.public_data?.reveal, 'no stale reveal');

    // game_private is owner-only RLS, so each client only ever sees its own row;
    // verify both humans got a fresh role (the re-deal) rather than counting all 5.
    const { data: hostPriv } = await host.from('game_private').select('private_data').eq('player_id', hostId);
    const { data: guestPriv } = await guest.from('game_private').select('private_data').eq('player_id', guestId);
    ok('rematch re-dealt fresh roles to both humans',
       hostPriv?.length === 1 && !!hostPriv[0]?.private_data?.role &&
       guestPriv?.length === 1 && !!guestPriv[0]?.private_data?.role,
       `host=${hostPriv?.[0]?.private_data?.role} guest=${guestPriv?.[0]?.private_data?.role}`);

    const { data: endRoom2 } = await host.from('rooms').select('status').eq('id', roomRow.id).single();
    ok('room flipped back to in-game', endRoom2?.status === 'in-game', `status=${endRoom2?.status}`);


    // ── Werewolf: game-start + full match ────────────────────────────────────
    step('Werewolf — create room (5p), start game, play to completion');
    wCode = randomCode();
    const wSeed = {
      name: '[e2e] werewolf room',
      gameId: 'werewolf',
      maxPlayers: 7,
      isPublic: false,
      inviteLink: `https://tangwong.app/join/${wCode}`,
    };
    await host.rpc('join_room', { p_code: wCode, p_seed: { ...wSeed, nickname: 'WHost', mascot: 'fox' } });
    await guest.rpc('join_room', { p_code: wCode, p_seed: { ...wSeed, nickname: 'WGuest', mascot: 'owl' } });
    for (let i = 0; i < 3; i++) {
      await host.rpc('add_bot', { p_code: wCode, p_bot: { id: botId(), name: `WBot ${i + 1}`, mascot: ['cat', 'panda', 'rabbit'][i] } });
    }
    wCleanup = async () => {
      try { await guest.rpc('leave_room', { p_code: wCode }); } catch {}
      try { await host.rpc('leave_room', { p_code: wCode }); } catch {}
    };


    const { data: wr } = await host.from('rooms').select('id,status').eq('code', wCode).single();
    ok('werewolf room created', !!wr?.id, wr?.id);

    const wStart = await invoke(host, 'game-start', { code: wCode });
    ok('werewolf game-start ok', wStart.ok, JSON.stringify(wStart.body));

    const { data: wgs0 } = await host.from('game_states').select('phase,status').eq('room_id', wr.id).single();
    ok('werewolf starts at roleReveal', wgs0?.phase === 'roleReveal', `phase=${wgs0?.phase}`);
    ok('werewolf room status = in-game', wgs0?.status === 'in-game', `status=${wgs0?.status}`);

    const { data: wPriv } = await guest
      .from('game_private').select('private_data')
      .eq('room_id', wr.id)
      .eq('player_id', guestId);
    ok('werewolf private row has role + team',
       !!wPriv?.[0]?.private_data?.role && !!wPriv?.[0]?.private_data?.team,
       `role=${wPriv?.[0]?.private_data?.role} team=${wPriv?.[0]?.private_data?.team}`);

    const wFinal = await playWerewolfToEnd({ host, guest, hostId, guestId, code: wCode, roomId: wr.id });
    ok('werewolf reached end state', !!wFinal && (wFinal.status === 'ended' || wFinal.winner),
       wFinal ? `phase=${wFinal.phase} status=${wFinal.status} winner=${JSON.stringify(wFinal.winner)}` : 'stuck/budget');

    if (wFinal?.public_data?.reveal) {
      const wReveal = wFinal.public_data.reveal;
      ok('werewolf reveal present for all 5 players', Object.keys(wReveal).length === 5,
         `entries=${Object.keys(wReveal).length}`);
      ok('werewolf reveal has role + team per entry',
         Object.values(wReveal).every(r => r?.role && r?.team),
         JSON.stringify(Object.values(wReveal)[0]));
    }

    const { data: wAudit } = await host
      .from('game_actions').select('type,payload').eq('room_id', wr.id)
      .in('type', ['WEREWOLF_KILL', 'SEER_PEEK', 'DOCTOR_SAVE']);
    const allRedacted = (wAudit ?? []).every(r => r.payload?.submitted === true && !r.payload?.targetId);
    ok('night action payloads redacted in audit log',
       !wAudit || wAudit.length === 0 || allRedacted,
       `${(wAudit ?? []).length} private actions checked`);

    // ── Checkpoint: game-start + full match ─────────────────────────────────
    step('Checkpoint — create room (3p), start game, play to completion');
    cCode = randomCode();
    const cSeed = {
      name: '[e2e] checkpoint room',
      gameId: 'checkpoint',
      maxPlayers: 6,
      isPublic: false,
      inviteLink: `https://tangwong.app/join/${cCode}`,
    };
    await host.rpc('join_room', { p_code: cCode, p_seed: { ...cSeed, nickname: 'CHost', mascot: 'fox' } });
    await guest.rpc('join_room', { p_code: cCode, p_seed: { ...cSeed, nickname: 'CGuest', mascot: 'owl' } });
    await host.rpc('add_bot', { p_code: cCode, p_bot: { id: botId(), name: 'CBot 1', mascot: 'cat' } });
    cCleanup = async () => {
      try { await guest.rpc('leave_room', { p_code: cCode }); } catch {}
      try { await host.rpc('leave_room', { p_code: cCode }); } catch {}
    };

    const { data: cr } = await host.from('rooms').select('id,status').eq('code', cCode).single();
    ok('checkpoint room created', !!cr?.id, cr?.id);

    const cStart = await invoke(host, 'game-start', { code: cCode });
    ok('checkpoint game-start ok', cStart.ok, JSON.stringify(cStart.body));

    const { data: cgs0 } = await host.from('game_states').select('phase,status,public_data').eq('room_id', cr.id).single();
    ok('checkpoint starts at contract', cgs0?.phase === 'contract', `phase=${cgs0?.phase}`);
    ok('checkpoint demand card dealt', !!cgs0?.public_data?.demand, cgs0?.public_data?.demand);

    const { data: cHostPriv } = await host.from('game_private').select('player_id,private_data').eq('room_id', cr.id);
    ok('checkpoint RLS: host reads only its own private row',
       (cHostPriv ?? []).length === 1 && cHostPriv[0].player_id === hostId, `rows=${(cHostPriv ?? []).length}`);
    const hostOpts = cHostPriv?.[0]?.private_data?.contractOptions ?? [];
    ok('checkpoint: 2 different contract options dealt', hostOpts.length === 2 && hostOpts[0] !== hostOpts[1], JSON.stringify(hostOpts));

    const undealt = CP_CONTRACT_IDS.find(id => !hostOpts.includes(id));
    const badPick = await invoke(host, 'game-action', { code: cCode, type: 'CHOOSE_CONTRACT', payload: { contractId: undealt } });
    ok('checkpoint: un-dealt contract rejected', !badPick.ok, `status=${badPick.status}`);

    const cRun = await playCheckpointToEnd({ host, guest, hostId, guestId, code: cCode, roomId: cr.id });
    const cFinal = cRun.final;
    const CP = cFinal?.public_data ?? {};
    ok('checkpoint reached end state', !!cFinal && (cFinal.status === 'ended' || !!cFinal.winner),
       cFinal ? `phase=${cFinal.phase} status=${cFinal.status} winners=${JSON.stringify(cFinal.winner?.winners)}` : 'stuck/budget');
    ok('checkpoint: no contract id in public data before game end', !cRun.contractLeak, cRun.contractLeak ?? 'clean');
    ok('checkpoint: played players × 2 shifts', CP.shift === 6 && CP.totalShifts === 6, `shift=${CP.shift}/${CP.totalShifts}`);
    ok('checkpoint: win condition = checkpoint-wealth', cFinal?.winner?.conditionId === 'checkpoint-wealth', cFinal?.winner?.conditionId);

    const order = CP.playerOrder ?? [];
    const results = CP.contractResults ?? {};
    ok('checkpoint: contracts revealed for all 3 players', order.length === 3 && order.every(id => results[id]?.contractId),
       `results=${Object.keys(results).length}`);
    const mismatches = order.filter(id => {
      const goods = Object.entries(CP.delivered?.[id] ?? {}).reduce((sum, [g, n]) => sum + CP_GOODS[g].value * n, 0);
      const expected = (CP.cash?.[id] ?? 0) + goods + (CP.marketBonus?.[id] ?? 0) + (results[id]?.value ?? 0);
      return CP.wealth?.[id] !== expected;
    });
    ok('checkpoint: final score = cash + goods + market bonus + contract', order.length > 0 && mismatches.length === 0,
       mismatches.length ? `mismatch for ${mismatches.join(',')}` : JSON.stringify(CP.wealth));

    const { data: cGuestView } = await guest.from('game_states').select('public_data').eq('room_id', cr.id).single();
    ok('checkpoint: guest can read the revealed contracts',
       Object.keys(cGuestView?.public_data?.contractResults ?? {}).length === 3);

    const { data: cAudit } = await host
      .from('game_actions').select('type,payload').eq('room_id', cr.id)
      .in('type', CP_PRIVATE_TYPES);
    const cTypes = new Set((cAudit ?? []).map(r => r.type));
    ok('checkpoint: private payloads redacted in audit log',
       CP_PRIVATE_TYPES.every(t => cTypes.has(t)) && (cAudit ?? []).every(r => r.payload?.submitted === true && Object.keys(r.payload).length === 1),
       `${(cAudit ?? []).length} private actions checked (${[...cTypes].join(', ')})`);

  } catch (err) {
    fail++;
    console.log(`\n\x1b[31mFATAL: ${err.message}\x1b[0m`);
  } finally {
    step('Cleanup');
    await cleanup();
    console.log(`  room ${code} — both humans left`);
    await wCleanup();
    await cCleanup();
  }

  console.log(`\n\x1b[1mResult:\x1b[0m ${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}

main();
