# Supabase + Vercel — Backend Plan

Status: 📋 Planned (not started) — 2026-06-18

Goal: let friends play TangWong together from different devices / networks,
deployable for free, on a foundation that can grow into a real product.

This becomes **Epic 4.5 — Supabase Backend** in the roadmap (between the
cross-tab realtime that exists today and the future account/friends epics).

---

## Locked decisions

| Topic | Decision |
|---|---|
| **Hosting** | FE → Vercel (free Hobby) · Backend → Supabase (free tier) |
| **Auth** | Anonymous sign-in now (play with no login) **+** link a Google account later. Guest identity migrates onto a real Supabase `auth.uid()`. |
| **Authority** | **Long-term: Supabase Edge Functions + Postgres + RLS** (locked). Clients may **never** write game state directly. Rooms/lobby/chat use Postgres RPC (`SECURITY DEFINER`); the Avalon game reducer runs in an Edge Function that imports the existing TS engine (single source of truth). Edge Functions are **not** implemented yet — they land in Phase 4.5.3. |
| **Transport** | Keep the existing BroadcastChannel transport behind an env flag (`VITE_USE_SUPABASE`). dev/test can stay offline; prod uses Supabase. Same `RealtimeService` interface for both. |

---

## Architecture

```
[Phone A]   [Phone B]   [Laptop C]      friends on different devices/networks
     └──────────┼──────────┘
                │ HTTPS (RPC) + WebSocket (Realtime)
        ┌───────▼────────┐
        │   Supabase     │
        │  ├ Auth        │  anonymous → linkable to Google
        │  ├ Postgres    │  rooms, players, chat, game state
        │  ├ RPC fns     │  ← the ONLY way to write (authority layer)
        │  ├ Realtime    │  push row changes to subscribed clients
        │  └ RLS         │  game_private readable only by its owner
        └───────▲────────┘
                │
        ┌───────┴────────┐
        │  React (Vite)  │   Vercel
        └────────────────┘
```

Two guarantees this design buys us:

1. **No illegal writes** — tables deny direct INSERT/UPDATE from clients; only
   RPC functions (which validate first) can mutate. The client "asks", the DB
   decides.
2. **Hidden information** — `game_private` has an RLS policy
   `player_id = auth.uid()`, so a player's role/cards are physically
   unreachable by anyone else, host included.

---

## Database schema

```
profiles        id (=auth.uid), nickname, mascot, created_at
rooms           id, code (unique), name, game_id, host_id, max_players,
                is_public, status, created_at
room_players    room_id, player_id, is_ready, is_bot, joined_at, last_seen
chat_messages   id, room_id, player_id, kind, text, reactions (jsonb), created_at
games           room_id (pk), public_state (jsonb), phase, turn, round,
                active_player_id, winner (jsonb), updated_at
game_private    room_id, player_id, private_state (jsonb)   ← RLS: owner-only read
game_actions    id, room_id, player_id, type, payload (jsonb), created_at
                ← append-only action log (event source / audit / replay)
```

### RLS summary

| Table | SELECT | INSERT / UPDATE |
|---|---|---|
| profiles | self + room co-members | self only (via RPC) |
| rooms | members (+ public rooms for discovery) | RPC only |
| room_players | members | RPC only |
| chat_messages | members | members may insert own message; reactions via RPC |
| games | members | **RPC only** |
| game_private | `player_id = auth.uid()` only | **RPC only** |
| game_actions | members | **RPC only** (`submit_action`) |

---

## RPC functions (the authority layer)

All `SECURITY DEFINER`, all validate the caller (`auth.uid()`) before mutating.

**Rooms / lobby** — direct SQL, no game engine needed:
```
create_room(name, game_id, max_players, is_public) → room
join_room(code) → room
leave_room(room_id)
set_ready(room_id, ready)
kick_player(room_id, target_id)        -- host only
transfer_host(room_id, target_id)      -- host only
add_bot(room_id)                        -- host only
update_settings(room_id, settings)     -- host only
```

**Game**:
```
start_game(room_id)                     -- host only; builds initial state
submit_action(room_id, type, payload)   -- the single game-write entry point
```

`submit_action` is the heart of the authority model:
1. validate the game is live and it's a legal action for this player/phase
   (cheap checks against the `games` row),
2. append the action to `game_actions`,
3. reduce → write new `public_state` + each affected `game_private` row.

---

## ⚠️ Key open decision — the Avalon reducer (Phase 3)

We already have a complete **TypeScript** Avalon engine. "Authority in the DB"
means step 3 above (compute next state) must run server-side. Three ways to do
it — pick before starting Phase 3:

| Option | How | Pros | Cons |
|---|---|---|---|
| **A. PL/pgSQL reducer** | reimplement Avalon's reduce in SQL inside `submit_action` | pure DB authority, no extra infra, matches the locked decision | **duplicates** the TS engine in SQL; Avalon is complex (8 phases, vision, quest tables) → high effort + divergence risk |
| **B. Edge Function reducer** | `submit_action` validates + logs; a Supabase Edge Function (Deno) imports the **existing TS engine**, computes, writes back | **reuses our engine** (one source of truth), still server-authoritative | adds Edge Function infra now (the thing we said to defer) |
| **C. Trusted-host hybrid (interim)** | RPC validates + appends action; the host's browser computes and writes via a privileged RPC; RLS still hides private from everyone else | ships fastest, reuses engine | host *could* cheat (its browser holds full state); not zero-trust |

**Recommendation:** Phases 1–2 (rooms/chat) are unaffected and fully satisfy the
"no direct writes" rule today — start there. For Phase 3, lean **Option B**:
keep the TS engine as the single source of truth and run it in an Edge Function
as the authority. This honours "DB/server authority, clients can't write state"
**and** avoids maintaining the game in two languages. (This is exactly the
"consider Edge Functions when the engine gets complex" escape hatch — Avalon is
already that complex.) Decide A vs B at the start of Phase 3.

---

## Phased plan

### Phase 4.5.1 — Foundation + Auth  ✅ (2026-06-18)
- ✅ add `@supabase/supabase-js`; `src/services/supabase/client.ts` (null when unconfigured)
- ✅ `profiles` table + RLS migration (`supabase/migrations/0001_profiles.sql`)
- ✅ env setup (`.env.example`, `src/vite-env.d.ts`)
- ✅ `signInAnonymously()` on first load (`ensureSession`)
- ✅ guest migration: local `tw_guest` → profile row under the real `auth.uid()`
- ✅ `linkGoogle()` seam present (not yet wired into the UI)
- **Outcome:** every player gets a real, cross-device identity, no login wall;
  app still runs fully on the local guest when Supabase env is absent
- Note: Edge Functions intentionally **not** implemented (land in 4.5.3); no
  game/room tables created yet (kept minimal, evolves incrementally)

### Phase 4.5.2 — Rooms over Supabase  🟡 (2026-06-18, pending live test)
- ✅ room/chat RPC functions + RLS (`0002_rooms_chat.sql`) — all writes via RPC
- ✅ `roomService` / `chatService` (async, server-authoritative)
- ✅ subscribe to `rooms` / `room_players` / `chat_messages` changes (realtime)
- ✅ `VITE_USE_SUPABASE` flag selects Supabase vs cross-tab in the room/chat hooks
- ✅ presence via `last_seen` heartbeat
- ⏳ verify end-to-end on two devices with real keys; add server-side prune
- **Outcome:** friends on different devices join / ready / chat / kick for real

### Phase 4.5.3 — Game sync + hidden info  ⚪
- resolve the reducer decision (A/B/C above)
- `start_game` + `submit_action` RPCs; `games` + `game_private` tables
- client subscribes to `games` (public) + its own `game_private` row
- bots driven by the authority (host or function), not every client
- **Outcome:** a full Avalon match across devices with no role leakage

### Phase 4.5.4 — Deploy  ⚪
- push to GitHub → Vercel auto-deploy (FE)
- `vercel.json` SPA rewrite (so invite links like `/join/CODE` resolve)
- set `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` in Vercel env
- Supabase is already cloud-hosted — no separate deploy
- **Outcome:** share a link; friends play from their phones

---

## What to prepare (accounts + deps)

- [ ] Supabase account + new project (free tier)
- [ ] Vercel account linked to the GitHub repo
- [ ] `@supabase/supabase-js` dependency
- [ ] env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_USE_SUPABASE`
- [ ] Google OAuth client (only when we turn on account linking)

## Free-tier limits (plenty for friend groups)

- Supabase: 500 MB DB · 50k monthly active users · realtime ~200 concurrent / 2M msgs
- Vercel: Hobby — unlimited static deploys
