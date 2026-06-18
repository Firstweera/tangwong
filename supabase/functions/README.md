# Edge Functions (Phase 4.5.3 — game authority)

These Deno functions are the **only** writer of the game tables (`game_states`,
`game_private`, `game_actions`). They run the existing TypeScript engine
(`src/features/games/…`) with the **service role**, so clients never write game
state and never see another player's role. See `docs/phase-4.5.3-plan.md`.

## Functions

- **`game-start`** (B2) — host-only. Builds the initial state (assigns roles +
  vision via the engine), writes the public snapshot + per-player private rows,
  flips the room to `in-game`. Idempotent (won't re-deal an already-started room).
- `game-action` (B3) — not yet implemented.

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
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` are injected
automatically — no manual secrets needed for game-start.

> If the CLI fails to bundle the cross-directory `../../../src` imports, fallbacks
> (in order): (a) keep `sloppy-imports` but vendor the engine under
> `_shared/engine` (B3), or (b) add explicit `.ts` extensions to every local
> import in the pure engine/avalon files and drop `sloppy-imports`.

## Verify (after deploy + 0004 applied)

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
