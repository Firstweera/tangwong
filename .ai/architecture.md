# Architecture

Owns: **how the code fits together** — layers, folder map, the prototype migration,
registries, room/game data flow, and the import boundaries. Game-engine internals are
[game-engine.md](game-engine.md); the backend is [supabase.md](supabase.md).

---

## 1. Layers

```text
 UI          pages/*.jsx · features/*/components · features/games/*/ui · components/
   │  props only (state, onSubmitAction, busy, error …)
 Hooks       useOnlineGameClient · useLocalGameClient · room/chat hooks
   │
 Client      engine/client — createGameClient + GameTransport          (pure TS)
   │                       ├─ LocalTransport  (in-memory master)
   │                       └─ SupabaseTransport (services/supabase)
 Engine      engine/ + games/<id>/{config,phases,actions,bot,…}         (pure TS)
   │
 Authority   supabase/functions (Deno) run the SAME engine with the service role
 Data        Postgres + RLS (Supabase)
```

The rule that makes this work: **game rules exist once**, in pure TypeScript under
`src/features/games/`, and run unchanged in the browser (offline), in Node (verify
scripts) and in Deno (Edge Functions).

---

## 2. Folder Map

```text
src/
  app/            App.jsx (composition root), router, TabBar
  pages/          one file per screen (legacy JSX; GamePage routes to a game UI)
  components/     shared UI — ui/ (primitives), layout/, game/
  design-system/  tokens + design-system components (README inside)
  features/
    room/ lobby/ chat/ guest/ friends/
    games/
      engine/         GameEngine, phases, validation, events, view (redaction)
      engine/client/  GameClient, transports, useGameClient
      <game>/         types · setup · phases · actions · winConditions · config · bot · rules · ui/
      ui/             shared game chrome (GameShell)
      registry.ts     gameId → config + UI + rules        (client)
      runtime.ts      gameId → firstPhase, bots, reveal   (local authority)
      rules.ts        gameId → rule sheet
      useOnlineGameClient.ts · useLocalGameClient.ts
  services/
    supabase/     client, auth, rooms, chat, game, gameTransport
    realtime/     cross-tab room/chat channel (offline mode)
  devtools/       TweaksPanel, IOSFrame, SeatSwitcher — never shipped behaviour
  hooks/ lib/ types/ styles/ assets/
supabase/
  migrations/     ordered SQL, idempotent
  functions/      game-start, game-action, _shared (cors, supabase, games registry)
scripts/          verify-*.mjs — the test suite
```

New code goes into `features/<area>/` (TS). `stores/` from CLAUDE.md's original sketch
does not exist; room state lives in `features/room/stores/`.

---

## 3. Migrating Off the Prototype

- `pages/*.jsx`, `app/*.jsx` and `src/styles/*.css` are prototype-era. They stay JSX/CSS
  until a task needs to change them substantially; then move logic into typed
  `features/` code and keep the page thin.
- **Keep the current visual design** unless the task is a redesign. A migration that
  changes pixels is a bug.
- `docs/prototype/` is the original mock. Use it to understand intended screens and
  flow; never copy code from it.
- Tailwind preflight stays off until the prototype CSS is gone ([coding-standards §4](coding-standards.md)).

---

## 4. Registries — Where a Game Is Wired In

A game is registered in **six** places. Missing one fails quietly (game hidden, no bots,
no online play), so use the `new-game` skill.

| file | key | gives |
| ---- | --- | ----- |
| `src/data.ts` (`GAMES`) | `id` | catalog card: names, tags, player range, availability |
| `src/features/games/registry.ts` | `gameId` | engine config + UI component + rules for `GamePage` |
| `src/features/games/rules.ts` | `gameId` | rule sheet shown in the app |
| `src/features/games/runtime.ts` | `gameId` | `firstPhase`, `nextBotAction`, `revealForPublic`, `privateActionTypes`, `botDelayMs` — used by LocalTransport |
| `supabase/functions/_shared/games.ts` | `gameId` | the same runtime facts for the Edge Functions — **must match `runtime.ts`** (a follow-up will make it import `runtime.ts`) |
| `src/pages/GamePage.jsx` `handleEnd` + `ResultPage.jsx` | `gameId` | result-page props (until a per-game `buildResultProps` exists) |

---

## 5. Rooms and Chat

- Offline: `services/realtime` broadcasts room/chat messages across tabs
  (`BroadcastChannel`). Every tab is its own authority.
- Online: `services/supabase/rooms.ts` / `chat.ts` — writes go through Postgres RPC
  functions (the write authority), reads through RLS, updates via Realtime.
- Callers use the room hooks in `features/room/`; pages do not branch on transport.

---

## 6. Game Data Flow

`GamePage` decides the mode ([project-context §3](project-context.md)) and hands the
game UI one shape of props, whichever transport is behind it:

| | online | offline |
| - | ------ | ------- |
| hook | `useOnlineGameClient(roomCode)` — waits for `ensureSession()` | `useLocalGameClient(gameId, room, meId)` |
| transport | `SupabaseTransport` | `LocalTransport` (`hostOnly: false`, paced bots) |
| start | host auto-starts via `game-start` | starts on mount |
| other seats | real players (+ server bots `bot_*`) | bot-played; devtools SeatSwitcher can view any seat |

Game UIs never call services, never run the engine and never run bots. They render
`externalState` and call `onSubmitAction` / `onTimeout`. Detail: [game-engine §7](game-engine.md).

---

## 7. Import Boundaries

| from | may import | must not import |
| ---- | ---------- | --------------- |
| `features/games/engine/**`, `games/<id>/*.ts` (non-UI) | each other, `types/` | React, DOM, `services/`, `@/` alias in files Deno loads (§8) |
| `engine/client/**` | `engine/` | `services/`, React (except `useGameClient.ts`) |
| `services/supabase/**` | `engine` types, `engine/view` | UI, pages |
| `games/<id>/ui/**` | engine types, `components/`, `games/ui/` | `services/`, `engine` runtime (`GameEngine`, bots) |
| `pages/**` | hooks, registries, components | engine internals beyond the registries |
| `supabase/functions/**` | `src/` engine + game files by **relative `.ts` path** | anything with React/DOM/Vite env |

## 8. Code Shared With Deno

Edge Functions import game files straight from `src/` (`_shared/games.ts`). Any file in
that import graph must:

- use relative imports **with the `.ts` extension** (type-only imports are erased and may omit it);
- not use the `@/` alias, `import.meta.env`, React, or browser globals;
- stay deterministic apart from the shuffles in `setup.ts`.

Breaking this only shows up on the next `supabase functions deploy`, so check it when
editing engine or game logic.
