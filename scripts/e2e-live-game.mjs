// e2e-live-game.mjs — live integration harness for Phase 4.5.3 (game authority).
//
// Drives the DEPLOYED Supabase backend (Edge Functions + RLS) exactly the way
// two real clients would, following supabase/functions/README.md verify steps:
//
//   B2 game-start · B3 game-action · B5 TIMEOUT · hidden-info RLS gate
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

async function main() {
  console.log(`\n\x1b[1mTangWong live game harness\x1b[0m → ${URL}`);
  console.log(`mode: ${SLOW ? 'slow (waits out a real phase timer)' : 'fast (core checks)'}`);

  const host = freshClient();
  const guest = freshClient();
  const code = randomCode();
  let cleanup = async () => {};

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
  } catch (err) {
    fail++;
    console.log(`\n\x1b[31mFATAL: ${err.message}\x1b[0m`);
  } finally {
    step('Cleanup');
    await cleanup();
    console.log(`  room ${code} — both humans left (empty room is deleted)`);
  }

  console.log(`\n\x1b[1mResult:\x1b[0m ${pass} passed, ${fail} failed`);
  process.exit(fail === 0 ? 0 : 1);
}

main();
