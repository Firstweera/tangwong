# Supabase backend

SQL migrations and setup for TangWong's backend.
See [`../docs/supabase-plan.md`](../docs/supabase-plan.md) for the full plan and
locked decisions (Edge Functions + Postgres + RLS as the long-term authority).

## One-time setup (Phase 4.5.1)

1. Create a project at [supabase.com](https://supabase.com) (free tier).
2. **Project Settings → API** → copy the Project URL and the `anon` public key.
3. In the repo root, copy the env template and fill it in:
   ```bash
   cp .env.example .env.local
   # set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
   ```
4. **Enable anonymous sign-in:** Authentication → Providers → Anonymous → on.
5. Apply the schema: open **SQL Editor**, paste the contents of each file in
   `migrations/` in order, and run.

Without `.env.local`, the app runs fine on the local-only guest identity — the
backend is an opt-in enhancement.

## Migrations

| File | Adds |
|---|---|
| `migrations/0001_profiles.sql` | `profiles` table (id, nickname, mascot) + RLS (owner-only) |
| `migrations/0002_rooms_chat.sql` | `rooms`, `room_players`, `chat_messages` + RLS, RPC (the write authority), and realtime publication |

Run them in filename order. Each is idempotent (safe to re-run).

After `0002`, switch the app onto Supabase realtime by setting in `.env.local`:

```bash
VITE_USE_SUPABASE=true
```

Leave it unset to keep the cross-tab (BroadcastChannel) transport for local dev.

## Later phases (not in this folder yet)

- 4.5.3 — games, game_private, game_actions + game RPC / Edge Function authority
