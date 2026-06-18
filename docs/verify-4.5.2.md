# Verification Checklist — Epic 4.5.2 (Rooms over Supabase)

Status: 📋 Ready to run — 2026-06-18

Goal: prove that Supabase-backed rooms / chat / realtime work correctly across
**two devices** before any game-sync work (4.5.3) begins. Run every section in
order. Mark each line ☐ → ✅ (or ❌ with a note). This doc does **not** cover
game state — no game tables exist yet, by design.

Test setup: "Device A" and "Device B" must be genuinely separate clients —
two different machines, or two browsers / a private window + a phone on the same
account-less app (each gets its own anonymous `auth.uid()`). Two tabs in the
**same** browser profile share one anonymous session, so use distinct profiles.

References: [supabase-plan.md](supabase-plan.md) ·
[supabase/README.md](../supabase/README.md) ·
migrations `0001_profiles.sql`, `0002_rooms_chat.sql`.

---

## 1. Supabase project setup

- [ ] Project created on the free tier; Project URL + `anon` key copied
- [ ] **Anonymous sign-in enabled** — Authentication → Providers → Anonymous → ON
- [ ] Migration **0001_profiles.sql** applied (SQL Editor, run to success)
- [ ] Migration **0002_rooms_chat.sql** applied **after** 0001 (order matters —
      0002 has no dependency on 0001 today, but keep filename order as the rule)
- [ ] Tables exist: `profiles`, `rooms`, `room_players`, `chat_messages`
      (Table Editor)
- [ ] **Realtime enabled** for `rooms`, `room_players`, `chat_messages`
      — confirm each is in the `supabase_realtime` publication:
      `select tablename from pg_publication_tables where pubname='supabase_realtime';`
      (0002 adds all three; verify none are missing)
- [ ] **RLS active** on all four tables — Authentication → Policies shows the lock
      ON, with: `rooms_select`, `room_players_select`, `chat_select`,
      `chat_insert_own`, and the three `profiles_*` policies
- [ ] **RPC functions available** — Database → Functions lists: `join_room`,
      `leave_room`, `set_ready`, `update_settings`, `kick_player`,
      `transfer_host`, `add_bot`, `touch_presence`, `toggle_reaction`,
      `send_system`, `assert_host`, `is_room_member`, `touch_updated_at`
- [ ] Each mutating RPC is `SECURITY DEFINER`
      (`select proname, prosecdef from pg_proc where proname in (...)` → `prosecdef = true`)

## 2. Local env setup

- [ ] `cp .env.example .env.local`
- [ ] `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` filled in
- [ ] `VITE_USE_SUPABASE=true`
- [ ] `npm run dev` restarted after editing env (Vite only reads env at boot)
- [ ] In the browser console, network calls hit `…supabase.co` (not just local)
- [ ] **Fallback check:** rename `.env.local` → restart → app still loads and
      behaves as the local cross-tab guest (no crash, no blank screen). Restore after.
- [ ] **Anon identity check:** Device A and Device B each have a distinct
      `auth.uid()` (Application → Local Storage → `tw_auth`); both differ from the
      old `guest_…` id

## 3. Two-device functional test cases

Run as A = host unless noted. After each action, confirm the change appears on
the **other** device within ~1–2s without a manual refresh (realtime).

- [ ] **Create room (A)** — room appears; A is host (crown); a `rooms` row +
      one `room_players` row exist in the DB
- [ ] **Join via code (B)** — B types the 5-char code; B appears in A's roster
      and vice-versa; `room_players` now has 2 rows
- [ ] **Join via invite link (B)** — leave, then open the invite link / `?join=CODE`;
      B lands in the same room (parses code → same room id)
- [ ] **Ready toggle sync** — B taps ready; A sees B's ready chip + the
      `n/m พร้อม` count update; toggle off reverts on both
- [ ] **Chat message sync** — A sends; B sees it (right/left alignment correct by
      sender); B replies; A sees it; order + timestamps consistent
- [ ] **Emoji reaction sync** — A reacts to a message; B sees the chip + count;
      B taps the same emoji → count 2; A removes → count 1; last removal hides chip
- [ ] **Room settings sync** — A opens settings, changes name / max players /
      privacy / game; B sees all four update live
- [ ] **Add bot (A)** — bot appears on both devices with 🤖 badge, always-ready;
      blocked at max players (see §6)
- [ ] **Kick player (A kicks B)** — B is removed from A's roster; B is toasted
      "ถูกเชิญออกจากห้อง" and routed home (`onRemoved` fired exactly once)
- [ ] **Transfer host (A → B)** — crown + host-only menus move to B on both
      devices; A loses host controls
- [ ] **Leave room (B)** — B leaves; A sees B disappear; if the host leaves, host
      hands off to the next human; last human leaving deletes the `rooms` row
- [ ] **Rejoin room** — after leaving, B rejoins via code; reappears; chat history
      still present (loaded from `chat_messages`)

## 4. Presence test cases

- [ ] **Close tab** — B closes the tab without "leave"; `last_seen` stops
      advancing; B is treated offline after the threshold (see follow-up note in §7)
- [ ] **Refresh page** — refresh on B keeps the same `auth.uid()`, same room
      membership, same chat history; no duplicate roster row
- [ ] **Network reconnect** — disable wifi on B ~15s then re-enable; realtime
      resubscribes and B converges to the current room state (may need a
      heartbeat tick); no stuck stale UI
- [ ] **Stale player behavior** — with B's tab closed, A's roster reflects B as
      offline/absent per current rules; no ghost-ready inflating the count
- [ ] **last_seen heartbeat** — while B is active, its `room_players.last_seen`
      advances roughly every 3s (`touch_presence`)

## 5. Security / RLS test cases

Run these from the browser console on an authenticated client (or Supabase SQL
Editor "Run as authenticated"). Each **must be rejected**.

- [ ] **Direct insert into `rooms` blocked** —
      `supabase.from('rooms').insert({...})` → RLS error (no insert policy)
- [ ] **Direct update of `room_players` blocked** —
      `supabase.from('room_players').update({is_ready:true}).eq(...)` → rejected
      (no update policy; only `set_ready` RPC may change it)
- [ ] **Non-member cannot read private room data** — a client that never joined
      room X reads `room_players` / `chat_messages` for X → returns 0 rows
      (RLS `is_room_member`), even though a public `rooms` row may be visible
- [ ] **Writes only succeed through RPC** — `set_ready` RPC works; the equivalent
      direct table write does not
- [ ] **Chat insert matches policy** — member can insert their **own** `kind:'user'`
      message; inserting with someone else's `player_id`, or `kind:'system'`,
      is rejected (system messages only via `send_system` RPC)
- [ ] **Reaction via RPC only** — `toggle_reaction` works for a member; a direct
      `update chat_messages set reactions=...` is rejected
- [ ] **Profile isolation** — Device A cannot `select` Device B's `profiles` row
      directly (owner-only); opponent display still renders (from denormalised
      `room_players.nickname/mascot`)

## 6. Failure cases

- [ ] **Invalid room code** — joining a non-existent code does not crash; the
      client shows an appropriate empty/"not found" state (note actual behavior —
      `join_room` currently *creates* a room for an unknown code; confirm whether
      that's acceptable for join-by-code vs. should error → log as follow-up if not)
- [ ] **Full room** — at `max_players`, `add_bot` is a no-op and a human join is
      prevented/handled gracefully (record exact behavior)
- [ ] **Kicked player tries to rejoin** — after being kicked, B re-entering the
      code rejoins as a normal member (kick is not a ban — confirm this is the
      intended behavior; if a ban is wanted, log as follow-up)
- [ ] **Non-host tries to kick** — B calls `kick_player` → rejected ("host only")
- [ ] **Non-host tries to change settings** — B calls `update_settings` → rejected
- [ ] **Non-host tries transfer_host / add_bot / send_system** → all rejected
- [ ] **Missing Supabase env** — with env removed, the app runs on cross-tab
      transport, no console errors referencing Supabase, mutations still work locally

## 7. Acceptance criteria

### Must PASS before marking 4.5.2 ✅ Completed

- All of §1 (setup), §2 (env + fallback)
- §3: create, join-by-code, join-by-link, ready sync, chat sync, reaction sync,
  settings sync, kick, transfer host, add bot, leave, rejoin — all sync across
  two real devices
- §5 (security): every "must be rejected" line is actually rejected — **this is
  non-negotiable**, it is the whole point of the RPC-authority model
- §6: host-only guards (kick / settings / transfer / add_bot / send_system) all
  reject non-hosts; missing-env fallback works

### Allowed as FOLLOW-UP (do not block 4.5.2)

- Server-side presence pruning (today `last_seen` updates but stale rows aren't
  swept by the server; client-side offline display is acceptable for now)
- Network-reconnect convergence needing a heartbeat tick rather than being instant
- `join_room` creating a room for an unknown code (acceptable if create+join share
  one path; revisit if a strict "join only" is desired)
- Kick = not a ban (rejoin allowed)
- Cosmetic: optimistic-seed flash before the first fetch resolves

### Must BLOCK moving to 4.5.3

- Any §5 security check failing (private data readable by non-members, or direct
  table writes succeeding) — game roles depend on this isolation
- Realtime not delivering cross-device updates (would make game sync impossible)
- Identity instability (uid changes on refresh, or duplicate roster rows)
- Host-only RPC guards not enforced

---

## Static SQL / code audit — 2026-06-18

Code-level verification of the security model (the §5/§6 "must be rejected" gate),
done by auditing `0001_profiles.sql`, `0002_rooms_chat.sql`, and the client
services. This does **not** replace the two-device runtime run (§3/§4), but it
proves the policies/guards are correct by construction.

### §5 Security — all PASS (enforced by SQL)

- **Direct insert into `rooms`** — RLS ON, only a `rooms_select` policy exists
  (no INSERT/UPDATE/DELETE policy) → direct writes denied; `join_room` is the only
  path (SECURITY DEFINER, bypasses RLS). ✅
- **Direct update of `room_players`** — RLS ON, only `room_players_select` → all
  direct writes denied; only `set_ready` / `touch_presence` / etc. (DEFINER) mutate. ✅
- **Non-member reads** — `room_players_select` and `chat_select` both gate on
  `is_room_member(room_id)` (DEFINER, `auth.uid()`), so a non-member reads 0 rows;
  `rooms_select` is `is_public OR is_room_member(id)` (public row visible by design). ✅
- **Writes only via RPC** — confirmed: no table has insert/update/delete policies
  except `chat_insert_own`. ✅
- **Chat insert policy** — `chat_insert_own` with_check =
  `kind='user' AND player_id=auth.uid()::text AND is_room_member(room_id)`:
  foreign `player_id` → rejected; `kind='system'` → rejected (system only via
  `send_system` DEFINER); own user message → allowed. ✅
- **Reaction via RPC only** — no UPDATE policy on `chat_messages` → direct
  `update … set reactions` denied; `toggle_reaction` (DEFINER) checks
  `is_room_member`. ✅
- **Profile isolation** — `profiles` has owner-only `select/insert/update`
  (`auth.uid() = id`); opponents render from denormalised
  `room_players.nickname/mascot`, never from `profiles`. ✅

### §6 Host-only guards — all PASS

- `kick_player`, `update_settings`, `transfer_host`, `add_bot`, `send_system`
  all call `assert_host(p_code)` → raises `host only` when
  `host_id <> auth.uid()`. ✅
- `set_ready` / `touch_presence` scope to `player_id = auth.uid()` (self-only,
  no host needed); `toggle_reaction` gated by `is_room_member`; `leave_room`
  self-only; `join_room` requires auth. ✅
- Every mutating RPC is `SECURITY DEFINER` with `set search_path = public`. ✅

### Client-side consistency

- All room mutations go through `roomService` RPC calls; chat user messages insert
  directly (matches `chat_insert_own`); everything else (reactions, system) via RPC. ✅
- `chat.sendMessage` inserts `player_id: meId` where `meId` is the resolved
  `auth.uid()` (LobbyPage uses the hook's `meId`), so it satisfies the insert
  policy `player_id = auth.uid()`. ✅

### Notes / accepted follow-ups (do not block)

- `join_room` creates a room for an unknown code (create+join share one path).
- `add_bot` trusts a host-supplied bot `player_id` (host-scoped, low risk).
- Server-side presence pruning still absent (client-side offline display only).

**Static audit verdict:** the §5 security gate and §6 host guards are correct in
SQL. Remaining to mark 4.5.2 ✅: the live two-device runtime run (§1 dashboard,
§3 sync, §4 presence) + executing the §5 console kit below against the deployed
project.

## §5 console test kit (run on the live app, authenticated client)

Open the app on a device that is **currently sitting in a room with at least one
chat message** (create a room + send one message first). Open DevTools → Console
and paste the whole block. It auto-discovers your room + a message id, then runs
every "must be rejected" check. The client is on `window.supabase`.

```js
const sb = window.supabase;
const me = (await sb.auth.getUser()).data.user.id;
const roomId = (await sb.from('room_players').select('room_id').eq('player_id', me)).data?.[0]?.room_id;
const msgId  = (await sb.from('chat_messages').select('id').eq('room_id', roomId).limit(1)).data?.[0]?.id;
console.log('context →', { me, roomId, msgId });   // all three should be defined

const show = (name, r) => console.log(name, r.error ? '✅ rejected: ' + r.error.message : (Array.isArray(r.data) && r.data.length === 0 ? '✅ 0 rows' : '❌ ALLOWED', r.data));

// 1. direct room insert — must be rejected (no insert policy)
show('1 rooms.insert ', await sb.from('rooms').insert({ code:'HACK1', name:'x', game_id:'avalon', host_id:me }));
// 2. direct ready flip on any row — must be rejected (no update policy)
show('2 rp.update   ', await sb.from('room_players').update({ is_ready:true }).eq('room_id', roomId).neq('player_id', me));
// 3. read a room you never joined — must return 0 rows
show('3 foreign chat', await sb.from('chat_messages').select('*').eq('room_id','00000000-0000-0000-0000-000000000000'));
// 4. forge a message as someone else — must be rejected (player_id must = auth.uid)
show('4 forge chat  ', await sb.from('chat_messages').insert({ room_id:roomId, player_id:'someone-else', kind:'user', text:'forged' }));
// 5. inject a system message — must be rejected (kind must be 'user')
show('5 inject sys  ', await sb.from('chat_messages').insert({ room_id:roomId, player_id:null, kind:'system', text:'fake' }));
// 6. direct reaction write — must be rejected (no update policy)
show('6 react direct', await sb.from('chat_messages').update({ reactions:[] }).eq('id', msgId));
// 7. read another user's profile — must return 0 rows (owner-only)
show('7 foreign prof', await sb.from('profiles').select('*').neq('id', me));
```

Read PASS as: lines 1, 2, 4, 5, 6 print `✅ rejected: …`; lines 3, 7 print
`✅ 0 rows`. Any `❌ ALLOWED` = a hole → **block 4.5.3** and report it.

Sanity counter-check (this one **should succeed** — proves you really are a member
and the kit isn't failing for the wrong reason):

```js
console.log('member read (should have rows):', (await sb.from('room_players').select('*').eq('room_id', roomId)).data);
```

## §6 host-guard console kit (run on Device B = a NON-host member)

Device B joins the host's room, then in its console — every host-only RPC called
by a non-host **must be rejected** with `host only`:

```js
const sb = window.supabase;
const code = 'XXXXX'; // ← the 5-char room code shown in the lobby
const g = (n, r) => console.log(n, r.error ? '✅ rejected: ' + r.error.message : '❌ ALLOWED', r.data);
g('kick           ', await sb.rpc('kick_player',     { p_code: code, p_target: 'anyone' }));
g('update_settings', await sb.rpc('update_settings', { p_code: code, p_settings: { name: 'hacked' } }));
g('transfer_host  ', await sb.rpc('transfer_host',   { p_code: code, p_target: 'anyone' }));
g('add_bot        ', await sb.rpc('add_bot',         { p_code: code, p_bot: { id: 'b', name: 'b', mascot: 'fox' } }));
g('send_system    ', await sb.rpc('send_system',     { p_code: code, p_text: 'fake' }));
```

All five must print `✅ rejected: … host only`. Any `❌ ALLOWED` (or Device A
seeing the room name change to "hacked") = a hole → report it.

## Result log

| Date | Tester | Result | Notes |
|------|--------|--------|-------|
| 2026-06-18 | Claude (static) | ✅ SQL audit | §5/§6 enforced in SQL; awaiting live two-device run + console kit |
| 2026-06-18 | User (2 accounts) | ✅ chat sync | 2 real accounts, same room, two-way chat works live — confirms identity split, join-by-code, realtime delivery, chat RLS for members |
| 2026-06-18 | User (console kit) | ✅ §5 security 7/7 | All "must be rejected" pass: direct rooms insert / room_players update / chat forge / system inject / reaction write all blocked (0 rows affected, verified by read-back); foreign chat + foreign profile return 0 rows. #2/#6 initial ❌ were a helper false-positive (UPDATE returns null on 0 rows) — re-test confirmed 0 rows affected. Non-negotiable security gate PASS |
| 2026-06-18 | User (console kit) | ✅ §6 host guards 5/5 | Non-host (Device B) calling kick_player / update_settings / transfer_host / add_bot / send_system → all rejected with `host only`. Host-authority RPC guards confirmed at runtime |
| 2026-06-18 | User (2 devices) | 🐛→✅ kick redirect | Kicked player stayed on a 0/max lobby instead of going home (RLS hides room_players after removal → empty/null roster missed the old guard). Fixed in fdc7ac8 (detect removal in refresh: not-in-roster OR room unreadable; heartbeat refresh safety net). Retest after deploy |
