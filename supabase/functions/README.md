# Edge Functions (Phase 4.5.3 — game authority)

These Deno functions are the **only** writer of the game tables (`game_states`,
`game_private`, `game_actions`). They run the existing TypeScript engine
(`src/features/games/…`) with the **service role**, so clients never write game
state and never see another player's role. See `docs/phase-4.5.3-plan.md`.

## Functions

- **`game-start`** (B2) — host-only. Builds the initial state (assigns roles +
  vision via the engine), writes the public snapshot + per-player private rows,
  flips the room to `in-game`. Idempotent (won't re-deal an already-started room).
- **`game-action`** (B3) — authenticated room-member action entry point. Rebuilds
  full state with the service role, dispatches through the shared engine,
  resolves bot seats server-side, persists public/private snapshots with a
  version guard, and logs public-safe actions.

## How the engine is shared (Option B1)

Functions import the engine by **relative path** into `src/` (one source of
truth, no vendored copy). `deno.json` enables `sloppy-imports` so Deno resolves
the engine's extensionless local imports (`./types`, `./setup`, …) like Vite/tsc
do. Type-only imports (e.g. `import type … from '../engine'`) are stripped at
bundle time, so the React-pulling engine **barrel** never enters the function.

## Deploy

Requires the Supabase CLI (`brew install supabase/tap/supabase`) and a login
(`supabase login`) + project link (`supabase link --project-ref <ref>`).

```sh
supabase functions deploy game-start
supabase functions deploy game-action
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` are injected
automatically — no manual secrets needed for the functions.

> If the CLI fails to bundle the cross-directory `../../../src` imports, fallbacks
> (in order): (a) keep `sloppy-imports` but vendor the engine under
> `_shared/engine` (B3), or (b) add explicit `.ts` extensions to every local
> import in the pure engine/avalon files and drop `sloppy-imports`.

## Local static verify

This machine may not have Deno/Supabase CLI installed, so the repo includes a
contract smoke check for the B3 function:

```sh
npm run verify:game-action
npm run build
```

## Verify game-start (after deploy + 0004 applied)

1. Host opens a room with ≥5 players (humans/bots), then calls game-start
   (wired into the UI in B4; for now invoke directly):
   ```js
   await window.supabase.functions.invoke('game-start', { body: { code: 'XXXXX' } })
   ```
2. Expect: a `game_states` row (phase `roleReveal`), one `game_private` row per
   player, room `status = 'in-game'`.
3. **Hidden-info check (the gate):** on a non-host device, the player can read
   **only their own** `game_private` row:
   ```js
   const sb = window.supabase;
   const me = (await sb.auth.getUser()).data.user.id;
   console.log('mine', (await sb.from('game_private').select('*').eq('player_id', me)).data);   // 1 row
   console.log('others', (await sb.from('game_private').select('*').neq('player_id', me)).data); // [] (RLS)
   ```
4. Non-host calling game-start must return `host only`.

## Verify game-action (after game-start succeeds)

1. Submit a legal host continue from role reveal:
   ```js
   await window.supabase.functions.invoke('game-action', {
     body: { code: 'XXXXX', type: 'CONTINUE', payload: null }
   })
   ```
   Expect `{ ok: true, phase: 'teamProposal' }` and `game_states.version`
   increments by 1.
2. Submit an illegal action from the wrong player/phase. Expect HTTP 400 with
   the engine validation error.
3. Mission card privacy check: after a mission member submits
   `PLAY_MISSION_CARD`, `game_actions.payload` must show `{ submitted: true }`,
   not the actual success/fail card.
4. Bot resolution check: when the next legal actor is a `bot_*` seat, one
   function call may advance through bot actions and returns `botActions > 0`.
5. End-game reveal check: when the engine reaches a winner, `game_states.status`
   and `rooms.status` become `ended`, and `public_data.reveal` contains final
   role/side data for ResultPage.
