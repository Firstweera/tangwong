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

## Result log

| Date | Tester | Result | Notes |
|------|--------|--------|-------|
|      |        |        |       |
