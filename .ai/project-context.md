# Project Context

Owns: **what TangWong is** — stack, run modes, env flags, commands, shipped games, and
where the non-`.ai/` docs live. How the pieces fit together is
[architecture.md](architecture.md).

---

## 1. What This Is

TangWong (ตั้งวง) is a mobile-first multiplayer board-game platform — "Discord for
board games". Friends create a room, share a code, chat, and play hidden-information
games on their phones.

Product intent and users: [../PRODUCT.md](../PRODUCT.md). Visual direction:
[../DESIGN.md](../DESIGN.md) (mobile-first, social, playful, premium; dark primary.
Reference feel: Discord, Supercell, Board Game Arena, modern startup apps).
Long-range vision: [../docs/vision.md](../docs/vision.md).

Planned game directions (each original, only *inspired by* the genre — [coding-standards §6](coding-standards.md)):
Avalon-style social deduction · Salem-style accusation · Sheriff-style bluffing and
negotiation · Exploding-Kittens-style card effects · Dixit-style creative party ·
Istanbul-style euro strategy. The engine supports both an **auto Game Master** and
optional **host/moderator tools**.

The MVP loop is **Home → Create/Join Room → Lobby → Game → Result**. Landing page,
profile, friends, achievements and monetisation wait until that loop is solid.

The codebase started as a visual prototype (plain JSX + one CSS file). It is being
migrated, not rewritten — see [architecture.md §3](architecture.md).

---

## 2. Stack

| layer | choice |
| ----- | ------ |
| UI | React 18 · Vite 5 · TypeScript (new code) + legacy JSX pages |
| Styling | prototype CSS (`src/styles/`) + Tailwind v4 utilities bridged to design tokens — [coding-standards §4](coding-standards.md) |
| Backend | Supabase — Postgres + RLS, anonymous Auth, Realtime, Edge Functions (Deno) — [supabase.md](supabase.md) |
| Hosting | Vercel (static SPA) — [../DEPLOYMENT.md](../DEPLOYMENT.md) |
| Package manager | pnpm in practice (`node_modules/.pnpm`, newer `pnpm-lock.yaml`); README still says `npm install` and `package-lock.json` is also tracked. Scripts run fine via `npm run`. Ask before adding a dependency, and say which lockfile you updated |

There is no Node server and no Socket.io server. "Socket.io-ready" in older docs means
the transport seam exists ([game-engine §7](game-engine.md)); Supabase is the live backend.

---

## 3. Run Modes

| mode | when | rooms / chat | games |
| ---- | ---- | ------------ | ----- |
| **Offline** | `VITE_USE_SUPABASE` unset / not `true` | cross-tab `BroadcastChannel` (`services/realtime`) | in-memory `LocalTransport`, other seats bot-played |
| **Online** | Supabase URL + anon key set **and** `VITE_USE_SUPABASE=true` | Supabase tables + RPC + Realtime | `SupabaseTransport` → Edge Functions |

Env vars (template: [../.env.example](../.env.example), real values in `.env.local`,
never committed, never read by Claude):

| var | effect when unset |
| --- | ----------------- |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | no Supabase client; guest identity is local-only |
| `VITE_USE_SUPABASE` | offline mode even if the two above are set |

Offline mode is the default for development and must keep working — it is how a solo
developer plays a full match.

---

## 4. Commands

| command | does |
| ------- | ---- |
| `npm run dev` | Vite dev server |
| `npm run build` | production build (also the only bundler-level type gate for JSX) |
| `npx tsc --noEmit -p .` | typecheck `src/` |
| `npm run verify:game-client` | headless matches through GameClient: multi-seat, offline, seat switching (all games) |
| `npm run verify:supabase-transport` | SupabaseTransport against an in-memory fake service |
| `npm run verify:werewolf` · `verify:checkpoint` | per-game engine runs |
| `npm run verify:game-action` · `verify:game-timeout` · `verify:realtime-game` | static contract checks over Edge Function + client wiring |
| `npm run verify:live-game` | ⚠ drives the **deployed** Supabase backend — creates real rows; run only when asked |

There is no unit-test runner and no linter configured. The verify scripts are the test
suite. The merge gate is [workflow.md §4](workflow.md).

---

## 5. Shipped Games

| id | name (th) | engine folder | rules doc |
| -- | --------- | ------------- | --------- |
| `avalon` | Avalon-inspired social deduction | `src/features/games/avalon/` | in-app (`avalon/rules.ts`) |
| `werewolf` | ล่าหมาป่า — night/day deduction | `src/features/games/werewolf/` | [../docs/games/werewolf-rules.md](../docs/games/werewolf-rules.md) |
| `checkpoint` | ผู้ตรวจการ — bluffing & negotiation | `src/features/games/checkpoint/` | [../docs/games/checkpoint-rules.md](../docs/games/checkpoint-rules.md) |

Games are **inspired by** real titles; names, art and rule text are original
([coding-standards §6](coding-standards.md)).

---

## 6. Docs Outside `.ai/`

| path | holds |
| ---- | ----- |
| [../docs/roadmap.md](../docs/roadmap.md) | epics, features, status — **read before every task** ([workflow §1](workflow.md)) |
| [../docs/changelog.md](../docs/changelog.md) | dated change history |
| [../docs/feature-list.md](../docs/feature-list.md) | product feature inventory |
| [../docs/games/](../docs/games/) | per-game rules (design source for that game's engine) |
| [../docs/supabase-plan.md](../docs/supabase-plan.md) · [../docs/phase-4.5.3-plan.md](../docs/phase-4.5.3-plan.md) | backend design decisions and their reasons |
| [../docs/prototype/](../docs/prototype/) | the original HTML/JSX prototype — **visual reference only**, never a code source |
| [../supabase/README.md](../supabase/README.md) · [../supabase/functions/README.md](../supabase/functions/README.md) | backend setup, function deploy and live verification steps |
| [../DEPLOYMENT.md](../DEPLOYMENT.md) | GitHub → Supabase → Vercel |
| [../src/design-system/README.md](../src/design-system/README.md) | design-system components and tokens |
