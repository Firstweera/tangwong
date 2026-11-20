# Supabase Backend

Owns: **the backend contract** — tables and RLS, Edge Function behaviour and error
envelope, the client service layer, migrations, deploy, and secrets. Setup steps live in
[../supabase/README.md](../supabase/README.md) and [../DEPLOYMENT.md](../DEPLOYMENT.md).
Design reasons live in [../docs/supabase-plan.md](../docs/supabase-plan.md) and
[../docs/phase-4.5.3-plan.md](../docs/phase-4.5.3-plan.md).

---

## 1. Role

Supabase is the whole backend: Postgres + RLS, **anonymous Auth** (every player gets an
`auth.uid()` with no login), Realtime, and two Deno Edge Functions. Nothing else runs
server-side. Do not add backend code the MVP does not need (CLAUDE.md).

Authority:

| data | writer | reader |
| ---- | ------ | ------ |
| profiles | the owner (RLS) | the owner |
| rooms, room_players | Postgres RPC functions (`0002`) | room members (RLS) |
| chat_messages | the sender (RLS insert-own) | room members |
| game_states, game_private, game_actions | **Edge Functions only** (service role) | members / owner-only / members |

---

## 2. Tables and RLS

| migration | adds |
| --------- | ---- |
| `0001_profiles.sql` | `profiles` + owner-only RLS |
| `0002_rooms_chat.sql` | `rooms`, `room_players`, `chat_messages`, RLS, RPCs, `is_room_member()`, Realtime publication |
| `0003_room_exists.sql` | `room_exists(code)` — SECURITY DEFINER boolean so a former member can tell "deleted" from "private" |
| `0004_game_state.sql` | `game_states` (public snapshot + `version`), `game_private` (**owner-only select**), `game_actions` (log); **no write policies** |

The game tables have no insert/update/delete policy. That is deliberate: with RLS on,
every direct client write fails, and only the service role can write. Do not "fix"
this by adding a write policy.

---

## 3. Edge Functions

`supabase/functions/game-start` and `game-action` load the game from
`_shared/games.ts` and run the **same engine** as the client ([architecture §8](architecture.md)).

| | game-start | game-action |
| - | ---------- | ----------- |
| caller | host only | any human room member |
| does | build initial state → `firstPhase` → resolve opening bots → insert public + private rows | rebuild state → dispatch → resolve bots → write with optimistic `version` check → log actions |
| special | `restart: true` replaces a finished game | `type: 'TIMEOUT'` (host only, after `PHASE_TIMEOUT_SECONDS` + 750 ms grace) plays `nextBotAction` for the staller |

Error envelope: `json({ error: string, ...extra }, status)` from `_shared/cors.ts`.

| status | meaning | client should |
| ------ | ------- | ------------- |
| 400 | invalid action / unsupported game | show the message |
| 401 / 403 | not authenticated · not a member · host only | prompt to rejoin / explain |
| 404 | room or game missing | back to lobby |
| 409 | `version conflict` (`retry: true`), not in-game, timer not expired (`retryAfterMs`), nothing to timeout | retry or wait |

`version` is optimistic concurrency. Concurrent writers conflict instead of overwriting
each other. Automatic retry on 409 is an open follow-up.

---

## 4. Client Service Layer

- `services/supabase/client.ts`: the single client, plus `isSupabaseEnabled` and `useSupabaseTransport`.
- `game.ts`: `fetchGame`, `subscribeGame`, `startGame`, `submitAction`, `timeoutGame`.
  Intents surface the function's `{ error }` text through `invokeErrorMessage`.
- `gameTransport.ts`: wraps `game.ts` as a `GameTransport` ([game-engine §7](game-engine.md)).
- Pages and game UIs never import `supabase` directly. They go through these services
  and hooks.

---

## 5. Migrations

- Numbered `NNNN_<name>.sql`, applied **in order**, each **idempotent** (`if not exists`,
  `drop policy if exists`).
- One concern per migration. Explain *why* in the header comment, as the existing ones do.
- Never edit an applied migration's meaning. Add a new one.
- A schema change ships with the code that needs it, in the same change.

## 6. Deploy

- SQL: paste into the Supabase SQL Editor in order (no CLI migration pipeline yet).
- Functions: `supabase functions deploy game-start` and `supabase functions deploy game-action`.
  Redeploy **both** after changing anything under `src/features/games/` that they import.
- Live check: [../supabase/functions/README.md](../supabase/functions/README.md) and
  `npm run verify:live-game`. These write to the real project, so run them only when asked.

## 7. Secrets

- The browser gets only the **anon** key. RLS is what protects data.
- `SUPABASE_SERVICE_ROLE_KEY` exists only inside Edge Functions (injected by the platform).
- `.env`, `.env.local` are git-ignored and are **not read** by Claude (settings deny).
