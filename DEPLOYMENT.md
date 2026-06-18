# Deployment

How to deploy TangWong: **GitHub** (source) → **Supabase** (backend) →
**Vercel** (frontend). All three have free tiers sufficient for friend groups.

Architecture: a Vite + React single-page app hosted as static files on Vercel,
talking to Supabase (Postgres + Auth + Realtime). There is no separate server to
deploy — Supabase is the backend.

See also: [docs/supabase-plan.md](docs/supabase-plan.md) ·
[docs/verify-4.5.2.md](docs/verify-4.5.2.md) ·
[supabase/README.md](supabase/README.md).

---

## 1. GitHub setup

1. Create a repository on GitHub (private is fine).
2. Push the project:
   ```bash
   git remote add origin git@github.com:<you>/tang-wong.git
   git push -u origin main
   ```
3. Confirm secrets are NOT committed: `.env`, `.env.local`, `.env.*` are
   git-ignored (only `.env.example` is tracked). Never commit real keys.

## 2. Supabase project setup

1. Create a project at [supabase.com](https://supabase.com) (free tier).
2. **Project Settings → API** → copy:
   - Project URL → `VITE_SUPABASE_URL`
   - `anon` public key → `VITE_SUPABASE_ANON_KEY`
   (The `anon` key is safe in the client; RLS is what protects data. Never ship
   the `service_role` key to the frontend.)
3. **Authentication → Providers → Anonymous → enable.** Players join with no
   login; a Google account can be linked later.
4. Apply migrations (next section).

## 3. Migration order

Open **SQL Editor** in Supabase and run each file's contents **in order**:

| Order | File | Adds |
|-------|------|------|
| 1 | `supabase/migrations/0001_profiles.sql` | `profiles` + RLS (owner-only) |
| 2 | `supabase/migrations/0002_rooms_chat.sql` | `rooms`, `room_players`, `chat_messages` + RLS + RPC (write authority) + realtime publication |

Each migration is idempotent (safe to re-run). After `0002`, verify realtime:

```sql
select tablename from pg_publication_tables where pubname = 'supabase_realtime';
-- expect: rooms, room_players, chat_messages
```

Run the full backend acceptance pass in [docs/verify-4.5.2.md](docs/verify-4.5.2.md)
before relying on multiplayer in production.

## 4. Local .env.local setup

```bash
cp .env.example .env.local
```

Fill in:

```bash
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
VITE_USE_SUPABASE=true
```

- `VITE_USE_SUPABASE=true` switches the room/chat transport from cross-tab
  (BroadcastChannel) to Supabase. Leave it unset/`false` for offline local dev.
- Vite only reads env at startup — restart `npm run dev` after edits.
- With **no** `.env.local`, the app still runs on the local-only guest identity
  and cross-tab transport (graceful fallback — verify before each release).

## 5. Vercel env vars

1. [vercel.com](https://vercel.com) → **Add New → Project** → import the GitHub repo.
2. Vercel auto-detects Vite via `vercel.json` (build `npm run build`, output `dist`).
3. **Project → Settings → Environment Variables** — add for **Production**
   (and Preview if you want PR deploys to hit the backend):

   | Name | Value |
   |------|-------|
   | `VITE_SUPABASE_URL` | your Supabase Project URL |
   | `VITE_SUPABASE_ANON_KEY` | your Supabase `anon` key |
   | `VITE_USE_SUPABASE` | `true` |

4. Redeploy after adding/changing env vars (client env is baked in at build time).

### Routing / invite links

`vercel.json` rewrites every path to `/index.html`, so deep links and page
refreshes (`/join/ABCDE`, `/lobby`, …) resolve to the SPA instead of 404-ing.

> Note: the app currently uses an in-memory screen router, so opening
> `/join/:code` directly loads the app but does **not** yet auto-join that code
> (users still paste the code on Home). Wiring URL → auto-join is a future
> feature, intentionally out of scope here. The rewrite is still required so
> those URLs don't 404 once that feature lands.

## 6. Deployment checklist

Pre-deploy:

- [ ] `npm run build` passes locally
- [ ] `npx tsc --noEmit` clean
- [ ] no secrets committed (`git ls-files | grep -E '^\.env'` → only `.env.example`)
- [ ] migrations `0001` then `0002` applied to the Supabase project
- [ ] anonymous auth enabled; realtime publication has all three tables
- [ ] [docs/verify-4.5.2.md](docs/verify-4.5.2.md) security/RLS section passes

Vercel:

- [ ] repo imported; framework detected as Vite
- [ ] `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_USE_SUPABASE=true` set
- [ ] first deploy succeeds; site loads

Post-deploy smoke test (two devices):

- [ ] both devices load the production URL and get distinct anonymous identities
- [ ] create room on A → join by code on B → both see each other
- [ ] ready toggle, chat, and reactions sync across devices
- [ ] refresh mid-session keeps identity + room membership (no 404, no reset)
- [ ] kicked/left player is handled cleanly

Rollback: Vercel keeps every deployment — promote a previous one from the
dashboard if a release misbehaves. Backend changes roll back via a new SQL
migration (write a corrective `000N_*.sql`; don't edit applied files in place).
