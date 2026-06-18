# Phase 4.5.3 — Game Sync + Hidden Info (design)

Status: 📐 Design — 2026-06-18
Epic: 4.5 Supabase Backend · depends on 4.5.2 (✅ rooms/chat/RLS verified)

Goal: play a **full Avalon match across devices** with **zero role leakage** — the
server is the only authority over game state, and each client can read only the
public state plus its **own** private slice (role + vision).

This doc is the build plan. It commits the open "reducer A/B/C" decision from
[supabase-plan.md](supabase-plan.md) and specifies the schema, RLS, Edge Function,
client hook, and rollout.

---

## 1. Decision: Option B — Edge Function authority (LOCKED)

`submit_action` must compute the next state **server-side**. We run the existing
**TypeScript engine** (`src/features/games/engine` + `avalon/`) inside a Supabase
**Edge Function** (Deno). Rationale:

- **Hidden info requires real server authority.** Avalon is social deduction —
  if any client (even the host) holds every player's role, it can cheat / be
  inspected. So a "trusted-host" model (Option C) is unacceptable for the core
  game. The whole point of 4.5.2's RLS verification was to enable this.
- **One source of truth.** Option A (re-implement the reducer in PL/pgSQL) would
  fork an 8-phase engine (roles, vision, quest tables, assassin) into SQL and
  drift. Option B reuses the engine we already test (240 bot games passed).
- The engine is **pure TS** (no React/DOM, imports only `@/types`) → it runs in
  Deno unchanged. `redactStateFor(state, viewerId)` already exists.

Trade-off accepted: we introduce Edge Function infra now (deferred until this
phase by design). Timers/bots get a server home (see §6, §7).

---

## 2. Architecture

```
 Client A (host)        Client B            Client C
   │  read public+own private (RLS)   │            │
   │  └────────────── Realtime (postgres_changes) ─┘
   │                      │
   │  POST /functions/v1/game-action  (JWT = auth.uid())
   ▼                      ▼
┌──────────────────────────────────────────────┐
│  Edge Function: game-action (Deno)            │
│   1. authenticate caller (auth.uid())         │
│   2. load full state (service role)           │
│   3. validate + dispatch  ← TS engine         │
│   4. resolve bots / auto-advance ← TS engine  │
│   5. write public + per-player private rows   │
└──────────────────────────────────────────────┘
   │ service_role writes (bypass RLS)
   ▼
 Postgres:  game_states (public) · game_private (per player) · game_actions (log)
   │ row change → Realtime fan-out (RLS-filtered) → clients refetch
```

The function is the **only** writer of game tables (service role). Clients have
**no write policy** on any game table — exactly the 4.5.2 pattern, extended.

---

## 3. Data model (migration `0004_game_state.sql`)

```sql
-- One public snapshot per room (everyone in the room may read it).
create table public.game_states (
  room_id      uuid primary key references public.rooms(id) on delete cascade,
  game_id      text not null,
  phase        text not null,
  turn         int  not null default 0,
  round        int  not null default 0,
  active_player_id text,
  public_data  jsonb not null default '{}'::jsonb,   -- TPublic (quest results, votes…)
  winner       jsonb,                                 -- WinResult | null
  status       text not null default 'in-game',       -- in-game | ended
  version      int  not null default 0,               -- optimistic-concurrency guard
  updated_at   timestamptz not null default now()
);

-- One private slice per (room, player). RLS: ONLY the owner can read it.
create table public.game_private (
  room_id    uuid not null references public.rooms(id) on delete cascade,
  player_id  text not null,                           -- auth.uid() (or bot id)
  private_data jsonb not null default '{}'::jsonb,    -- TPrivate (role, vision)
  updated_at timestamptz not null default now(),
  primary key (room_id, player_id)
);

-- Append-only action log (audit + replay + "what happened"). Public-safe only.
create table public.game_actions (
  id         bigint generated always as identity primary key,
  room_id    uuid not null references public.rooms(id) on delete cascade,
  player_id  text not null,
  type       text not null,
  payload    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index game_actions_room_idx on public.game_actions(room_id, id);
```

### RLS — read-only for clients, writes via service role only

```sql
alter table public.game_states  enable row level security;
alter table public.game_private enable row level security;
alter table public.game_actions enable row level security;

-- public snapshot: any room member may read
create policy game_states_select on public.game_states for select
  using (public.is_room_member(room_id));

-- THE hidden-info boundary: a player reads only their OWN private row
create policy game_private_select_own on public.game_private for select
  using (player_id = auth.uid()::text);

-- action log: members may read (public-safe data only)
create policy game_actions_select on public.game_actions for select
  using (public.is_room_member(room_id));

-- NO insert/update/delete policies on any of the three → clients cannot write.
-- The Edge Function uses the service_role key, which bypasses RLS.
```

Realtime publication:
```sql
alter publication supabase_realtime add table public.game_states;
alter publication supabase_realtime add table public.game_private;
```
- `game_states` change → all members refetch public state.
- `game_private` change → **only the owner** receives it (realtime respects the
  owner-only SELECT policy). This is the live hidden-info channel.

> Note: bots have synthetic `player_id` (`bot_*`) with no `auth.uid()`, so no one
> "reads as a bot". Bot private rows are simply never selected by a human — and
> the server resolves bot turns itself (§6), so bots never need to read.

---

## 4. Edge Functions

Location: `supabase/functions/`. Two functions (timers optional, §7).

### `game-start` (host only)
```
input: { code }
1. assert caller == room.host_id, room has ≥ minPlayers, status == 'waiting'
2. build RoomState from room_players (humans + bots)
3. state = engine.createInitialState(room)   // assigns roles + vision (Avalon setup)
4. write game_states (public) + one game_private per player (role/vision)
5. set rooms.status = 'in-game'
6. (resolve any opening bot/auto step — §6)
```

### `game-action` (the single game-write entry point)
```
input: { code, type, payload }
1. caller = auth.uid(); load room + game_states (must be in-game)
2. rebuild full GameState: public_data + ALL game_private rows (service role)
3. action = { type, playerId: caller, payload }
4. result = engine.dispatch(state, action)   // validates phase/turn/legality
   - if !result.valid → return 400 { error }
5. state = resolveBots(result.state)          // §6: run bot/auto actions to settle
6. persist diff: upsert game_states (version+1), upsert changed game_private rows,
   insert into game_actions
7. return { ok: true }   // clients converge via realtime
```

Concurrency: guard with the `version` column — `update … where version = $loaded`.
On mismatch, reload and re-apply or return a retry hint (rare in a turn-based game).

### Sharing the TS engine with Deno — the one real integration cost

The engine imports `@/types` (the `@` alias is Vite-only; Deno can't resolve it).
Options, pick at build start:

- **B1 (recommended): a tiny shared `packages/engine` with relative imports** —
  move/keep the pure engine where both Vite and Deno import it by **relative
  path** (no `@` alias). Vite app imports it; the Edge Function imports it with a
  Deno import map. One source, no copy.
- **B2: bundle step** — `deno bundle` / esbuild the engine into the function dir
  on deploy. Simple but adds a build step and a generated artifact.
- **B3 (interim): vendor a copy** under `supabase/functions/_shared/engine` kept
  in sync by a script. Fastest to ship, риск of drift — only if B1 is slow.

Decision criterion: try B1 first; the engine already has no React/DOM deps, so
the only blocker is the `@/types` alias on a couple of files — replace those few
imports with relative paths and both runtimes are happy.

---

## 5. Client integration

The UI (`AvalonGame`, `AvalonTable`, `RoleRevealCard`, …) stays — it already
renders from a `GameState`. We swap the **state source**:

- New hook **`useRealtimeGame(roomCode, meId)`** (mirrors `useRealtimeRoom`):
  - reads `game_states` (public) + the caller's `game_private` row, merges them
    into a `GameState` whose `private` map has only `{ [meId]: … }` (RLS already
    redacted it — `redactStateFor` becomes "the DB did it"),
  - subscribes to both tables → updates on change,
  - `submitAction(type, payload)` → `supabase.functions.invoke('game-action', …)`,
  - `start()` (host) → invoke `game-start`.
- `GamePage` branches like the room/chat hooks do: `useSupabaseTransport`
  ? `useRealtimeGame` : the current local `useGameEngine` (solo + bots, unchanged
  for offline/dev).
- `AvalonGame` takes an injected `{ state, submitAction }` instead of owning the
  engine, so both transports feed the same UI. (Small refactor: lift the engine
  calls behind a prop boundary.)

No game logic moves into the UI — the UI only renders state and calls
`submitAction`. Same separation we already keep.

---

## 6. Bots (server-resolved)

Reuse `avalon/bot.ts` (`nextBotAction`, `nextAutoActor`) **inside the Edge
Function**, not on any client:

- after a human action in `game-action`, loop: while the active actor is a bot
  (or auto-advance applies), compute `nextBotAction` and `engine.dispatch` it,
  until it's a human's turn or the game ends. Persist once at the end.
- this keeps bots authoritative + cheat-proof (no client drives them) and reuses
  tested code. Solo/offline play still runs bots locally via the existing path.

---

## 7. Timers (per-phase auto-act) — keep simple for MVP

Edge Functions have no persistent timers. Options:

- **MVP: host-driven tick.** The host client runs the existing countdown; on
  expiry it calls a `game-tick` function (or `game-action` with a `TIMEOUT`
  action). The server verifies elapsed time against `updated_at` before
  auto-acting (so a client can't rush it). Good enough; no extra infra.
- **Later: `pg_cron`** scheduled sweep for abandoned turns. Defer.

Acceptable MVP behavior: if no host is connected, the timer pauses — log as a
follow-up, not a blocker.

---

## 8. Reconnect / spectate / end

- **Reconnect**: a returning client just refetches public + its own private row
  and resubscribes — state is fully server-held, nothing to restore locally.
- **Host disconnect**: game state lives in the DB, not the host, so the match
  survives. Only host-driven timers pause (§7).
- **End**: `winner` set + `status='ended'`; ResultPage already reads the reveal
  from state. On end, the server may relax private RLS for a reveal, **or** write
  a `reveal` blob into public_data (simpler) so every client can show all roles.

---

## 9. Build order (tasks)

- **B0** — engine portability: drop the `@/types` alias from engine/avalon pure
  files (relative imports); confirm it imports clean in a Deno smoke test. (B1)
- **B1** — `0004_game_state.sql`: tables + RLS + realtime publication. Verify
  RLS with the §5-style console kit (private row unreadable by others).
- **B2** — `game-start` Edge Function (build initial state + write rows).
- **B3** — `game-action` Edge Function (dispatch + bots + persist + version).
- **B4** — `useRealtimeGame` hook + `GamePage` transport branch + `AvalonGame`
  prop-boundary refactor.
- **B5** — server-side bot resolution (§6) + host-driven timer tick (§7).
- **B6** — end-game reveal path (§8) + reconnect test.
- **B7** — two-device verify doc (mirror verify-4.5.2): no role leakage, full
  match sync, reconnect, host-disconnect survival.

Ship B0–B1 first (infra + the hidden-info boundary), then the functions, then UI.

---

## 10. Security invariants (the hard gate, like §5 was)

- A non-owner can **never** read another player's `game_private` row (RLS) — the
  Merlin/spy test: Device B cannot see Device A's role via any query or realtime.
- No client can write `game_states` / `game_private` / `game_actions` directly
  (no policies) — only the Edge Function (service role).
- `game-action` rejects illegal actions (wrong phase/turn/not-your-seat) via the
  engine validators — a client can't force a state by crafting a payload.
- `game-start` is host-only and idempotent (can't double-start / re-deal roles).

These must be runtime-verified (console kit + two devices) before 4.5.3 is ✅,
same bar as 4.5.2.

---

## 11. Open questions to confirm before B2

1. Engine sharing: B1 (relative-path shared) vs B3 (vendored copy) — try B1.
2. End-game reveal: relax RLS vs write a public `reveal` blob — lean public blob.
3. Timer authority for MVP: host-tick (chosen) — accept pause-on-no-host.
4. `game_actions` log: keep for audit/replay now, or defer? (cheap; keep.)
