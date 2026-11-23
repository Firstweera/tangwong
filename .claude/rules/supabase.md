---
paths:
  - "supabase/**"
  - "src/services/supabase/**"
  - ".github/workflows/**"
---

# Supabase and Deploy Rules (auto-loaded for backend, service and CI files)

Owner docs: `.ai/supabase.md` (§2 RLS, §3 Edge Functions, §5 migrations, §6 deploy, §7
secrets) and `.ai/game-engine.md` §6–7. Read the sections your change touches.

- **Server authority:** Edge Functions are the only writers of game tables. No client
  write path, no RLS insert/update/delete policy on them. `game_private` is owner-only.
- **Caller identity:** an action's `playerId` comes from the caller's session, never from
  the request body. Host-only intents check the host server-side.
- **Migrations:** numbered, idempotent, one concern each. A committed migration is never
  edited (the `migration-guard` hook blocks it); add a new one. CI does **not** apply
  migrations; they are applied by hand before merging code that needs them.
- **Deploy:** merging to `main` redeploys `game-start` and `game-action` automatically
  (`.github/workflows/deploy-supabase.yml`) after the gate. Never deploy by hand without
  being asked.
- **Live writes:** `npm run verify:live-game` writes to production. Run it only when asked.
- **Secrets:** the browser gets only the anon key; the service role key exists only inside
  Edge Functions; CI secrets are never echoed. Never read `.env*` files.
