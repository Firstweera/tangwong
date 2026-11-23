# TangWong Development Roadmap

## Status Legend

✅ Completed
🟡 In Progress
⚪ Not Started
🔒 Future

---

# Epic 0 - Foundation

Goal:
Create a scalable codebase before implementing gameplay.

## Architecture

### Feature-based Structure

✅ Completed

### Router Separation

✅ Completed

### Legacy Preservation

✅ Completed

---

## Design System

### Design Tokens

✅ Completed

### Theme System

✅ Completed

### Tailwind v4 Integration

✅ Completed

### Utility Helpers

✅ Completed

### Modern Design Spec + Home Refresh

✅ Completed — 2026-06-22

Files:

- PRODUCT.md
- docs/superpowers/plans/2026-06-22-modern-design-spec-and-home-refresh.md
- src/pages/DesignSpecPage.jsx
- src/pages/HomePage.jsx
- src/app/App.jsx
- src/app/router.jsx
- src/styles/components.css
- src/styles/tokens.css
- src/styles/reset.css
- src/styles/animations.css

Notes:

- added `/design-spec` as a direct URL-accessible design direction page with
  three options: Play Lobby Command Center, Cinematic Tabletop, and Lean Social
  Utility
- implemented Direction 1 as the first pass: Home now reads more like a modern
  multiplayer room command surface while keeping the tabletop/felt identity
- refreshed dark theme surface tokens and moved new Home/spec treatments into
  reusable CSS classes

Follow-up:

- apply the same Direction 1 vocabulary to Lobby once realtime game sync resumes
- add a full DESIGN.md capture with `/impeccable document`
- consider a lightweight route helper before adding more URL-addressable pages

### Project Redesign System Pass

✅ Completed — 2026-06-22

Files:

- DESIGN.md
- src/app/App.jsx
- src/styles/reset.css
- src/styles/tokens.css
- src/styles/layout.css
- src/styles/components.css
- src/pages/WelcomePage.jsx
- src/pages/GamesPage.jsx
- src/pages/FriendsPage.jsx
- src/pages/ProfilePage.jsx
- src/pages/ResultPage.jsx
- src/components/game/PlayerSeat.tsx
- src/features/lobby/components/RoomCodeDisplay.tsx
- src/features/lobby/components/GameSelector.tsx
- src/features/lobby/components/LobbyFooter.tsx

Notes:

- added the `Night Table Command Center` design direction as `DESIGN.md`
- changed theme behavior to default to the user's device preference via
  `prefers-color-scheme`, while keeping manual `system` / `dark` / `light`
  overrides in Tweaks
- tightened the shared surface, card, button, chip, page header, command-card,
  field, and status-row vocabulary for dark and light themes
- redesigned Welcome, Games, Friends, Profile, Lobby shared pieces, and Result
  toward a consistent mobile product UI
- fixed mobile shell/flex min-width guards after screenshot verification exposed
  clipping on the Welcome screen

Follow-up:

- continue applying the same component vocabulary to sheets/modals and the game
  phase controls after B5 timer sync
- add a dedicated light-mode screenshot pass once browser automation can emulate
  `prefers-color-scheme: light`

---

## UI Component Library

### Base Components

✅ Completed

Components:

- Button
- Badge
- Avatar
- Card
- Input
- Tooltip
- Modal
- Sheet
- Typography

## AI Tooling

### AI Operating Docs
✅ Completed — 2026-11-20

Files:
- `CLAUDE.md` (rewritten as a router), `AGENTS.md` (pointer only)
- `.ai/project-context.md`, `.ai/architecture.md`, `.ai/game-engine.md`,
  `.ai/supabase.md`, `.ai/coding-standards.md`, `.ai/workflow.md`
- `.claude/settings.json`, `.claude/hooks/push-guard.mjs`
- `.claude/agents/code-reviewer.md`, `.claude/agents/privacy-auditor.md`
- `.claude/skills/{new-game,game-action,verify,ship}/SKILL.md`
- `.gitignore`

Notes:
- structure adapted from two local reference repos (plugme-fnm, raot-marketplace):
  CLAUDE.md routes, `.ai/` owns each rule once with numbered sections, skills hold
  procedures, agents review against `.ai/`
- every rule from the old CLAUDE.md was moved to an owner file; `AGENTS.md` no longer
  duplicates CLAUDE.md
- new owner docs for previously undocumented core: game engine, hidden-information
  rules, GameClient/transports, the six game registries, Deno-shared code, Supabase
  authority and error envelope
- settings: allow the gate commands, ask before `git push` / live Supabase / function
  deploy, deny pushing to `main` and reading `.env` files; `push-guard` hook also
  blocks force pushes (tested against 12 command shapes)
- removed unrelated skills (`next-best-practices`, `next-upgrade`, `turborepo`,
  `remotion-best-practices`) and the generic `.claude/commands` (replaced by skills/agents)
- `.claude/` was entirely git-ignored; now the project-owned parts are tracked and
  third-party skills stay per-machine
- commits keep the `Co-Authored-By` trailer (decided 2026-11-20)

Follow-up:
- make `supabase/functions/_shared/games.ts` import `src/features/games/runtime.ts`
  so the registry parity rule becomes structural
- ~~decide npm vs pnpm and remove the other lockfile~~ → pnpm, see CI/CD below
- run the new `code-reviewer` / `privacy-auditor` agents on the next game change and
  tune them

### AI Setup Refresh (Claude Code late-2026 features)
✅ Completed — 2026-11-23 (verified in a fresh session)

Files:
- `AGENTS.md` (now the shared entry point), `CLAUDE.md` (`@AGENTS.md` + Claude specifics)
- `.claude/rules/{game-engine,supabase,ui}.md` (new, path-scoped)
- `.claude/hooks/migration-guard.mjs` (new), `.claude/settings.json`, `.gitignore`
- `.claude/skills/{ship,verify,new-game,game-action}/SKILL.md`,
  `.claude/agents/{code-reviewer,privacy-auditor}.md`
- `.ai/workflow.md` §6 (AI setup layers), pointer fixes in `.ai/coding-standards.md`,
  `.ai/supabase.md`, `docs/games/werewolf-rules.md`

Notes:
- based on the current Claude Code docs (memory, skills, subagents, hooks, settings) and
  the cross-tool AGENTS.md convention
- direction reversed: AGENTS.md holds the shared rules so Codex/Cursor get them too;
  Claude reads them through `@AGENTS.md` (Claude Code only reads AGENTS.md natively when
  no CLAUDE.md exists)
- the "task → read" routing is now also automatic: path-scoped rules load when a matching
  file is touched and point to the owner `.ai/` sections
- `ship` is user-invoked only (`disable-model-invocation`); `verify` pre-approves the gate
  commands by name (no wildcard, so `verify:live-game` still asks)
- reviewers are explicitly read-only (`disallowedTools`); `code-reviewer` keeps project
  memory for recurring findings
- `migration-guard` blocks Edit/Write on committed migrations (tested: 7 cases incl. path
  traversal, new migration allowed); allow rules mirrored for `pnpm`
- `migration-guard` also confirmed live: a Write to `0003_room_exists.sql` from this
  session was blocked by the hook
- `/context all` in a fresh session (2026-11-23): CLAUDE.md 1.1k + AGENTS.md 2.3k tokens
  loaded via `@AGENTS.md`; `ship` hidden from the skill list as intended; both agents
  listed
- path-scoped rule confirmed in a fresh session: after reading `checkpoint/goods.ts`, the
  answer quoted wording that exists only in `.claude/rules/game-engine.md`. The rule
  does not show under "Memory files" in `/context all` (only launch-time files do)
- that test exposed drift: `.ai/game-engine.md` §3 said randomness only in `setup.ts`,
  while Checkpoint draws in `CONTINUE_SHIFT`. The owner doc, the rule and the `new-game`
  skill now all allow a named draw step and explain why it is safe
- `verify` in a fresh session: gate 10/10 green, but its first loop failed with
  `command not found` (zsh does not word-split). The skill now ships a zsh-safe `eval`
  loop
- the user's "Save context" section in CLAUDE.md is kept as is
- `/doctor prompt-audit` (2026-11-23, target Opus 5.5): project-owned files clean of
  dated patterns; applied: ui rule tap-target wording matched to coding-standards §5,
  incident-specific "limits like cash" dropped from the engine rule, and the local
  `frontend-design` (contradicted AGENTS.md §2.6) and duplicate `skill-creator` skills
  removed from `.claude/skills/` and `.agents/skills/` (untracked, per machine)
- `verify` `allowed-tools`: closed as not needed. The ten gate commands are already in
  `permissions.allow` in `.claude/settings.json`, so a session never prompts for them
  either way; a test cannot tell the two sources apart. Gate run command by command in a
  fresh session (2026-11-23): 10/10 green
- `vercel-react-best-practices` (per machine, untracked): kept but made manual-only
  (`disable-model-invocation: true`), since its `server-*` rules and Next.js / React 19
  examples don't fit a Vite SPA on React 18. Invoke `/vercel-react-best-practices` for
  performance work; re-add the line if the skill is reinstalled

Not verified: none.

Follow-up:
- `npm run build` warns about a 646 kB JS chunk (Vite limit 500 kB): a code-splitting
  task (`React.lazy` / dynamic import per game) where the manual vercel skill fits
- `tailwind-design-system` skill is 565 lines (guidance: under 500); vendor file, left as is

## CI/CD

### GitHub Actions gate + Edge Function auto-deploy
✅ Completed — 2026-11-20 (PR #4; first runs green on GitHub)

Files:
- `.github/workflows/ci.yml` (new): the merge gate on every PR and push to `main`
- `.github/workflows/deploy-supabase.yml` (new): after the gate, deploys `game-start` and
  `game-action` on pushes to `main` touching `src/features/games/**`, `src/types/**`,
  `supabase/functions/**` (also manual "Run workflow")
- `scripts/verify-registry-parity.mjs` (new) + `verify:registry-parity` in `package.json`
- `package.json` (`packageManager: pnpm@10.27.0`), `package-lock.json` removed
- `.ai/workflow.md` §4, `.ai/supabase.md` §6–7, `.ai/project-context.md`, `README.md`,
  `DEPLOYMENT.md`, `.claude/settings.json`, skills `verify` / `new-game` / `game-action` / `ship`

Notes:
- decisions (2026-11-20): pnpm only; deploy is automatic once the gate passes (the
  merge is the approval); migrations stay manual and the deploy workflow only warns
- registry parity is now checked: a game missing from either registry, or a
  `firstPhase` / `privateActionTypes` mismatch, fails the gate (tested by breaking the
  server registry on purpose)
- Supabase CLI pinned to 2.107.0 with `--use-api` bundling, the same way the last manual
  deploy succeeded
- repo secrets `SUPABASE_ACCESS_TOKEN` (scoped token: Edge Functions read-write, Edge
  Function Secrets no access) and `SUPABASE_PROJECT_REF` are set
- first GitHub run (manual "Run workflow" on `27ae447`): gate 31s ✅ → Edge Functions
  deployed 15s ✅
- action versions moved to Node 24 runtimes after the first run warned about Node 20:
  `actions/checkout@v7`, `actions/setup-node@v7`, `pnpm/action-setup@v6`,
  `supabase/setup-cli@v3` (runtimes checked in each action's `action.yml`)
- `verify:live-game` is not run by CI (it writes to production)

- verified on GitHub after PR #5 (`9d33775`): the push to `main` triggered CI #4 ✅ and
  Deploy #3 ✅ (gate 39s → Edge Functions deployed 19s) on the Node 24 action versions,
  with no Node 20 annotations. The earlier push-triggered Deploy #1 for PR #4 failed
  (log not reviewed; most likely the repo secrets were not set yet). Deploy #2, run by
  hand, and Deploy #3 passed

Not verified:
- Vercel now installs from `pnpm-lock.yaml` only; the next Vercel deploy must be checked

Follow-up:
- check the next Vercel deploy (first one installing with pnpm)
- optional: protect `main` so the CI gate is required before merge
- optional: a manual-only migration workflow (`supabase db push`) if migrations become frequent

---

# Epic 1 - Multiplayer Lobby MVP

Goal:
Allow users to create and manage rooms.

## Room System

### Create Room

✅ Completed

### Join Room

✅ Completed

### Leave Room

✅ Completed

### Rejoin Room

✅ Completed

### Room Settings

✅ Completed

Notes:

- max-player options are derived from the selected game's range
  (`Game.minPlayers`–`Game.maxPlayers`), not a fixed list
- changing the game snaps room size back into the valid range (defaults to cap)
- ranges: Avalon 5–10, Werewolf 6–16, Coup 2–6, Dixit 3–8

Files:

- src/types/index.ts (`Game.minPlayers` / `Game.maxPlayers`)
- src/data.ts (per-game ranges)
- src/features/room/components/CreateRoomSheet.tsx (range-driven selector)

---

## Lobby Components

### Room Display

✅ Completed

### Player List

✅ Completed

### Ready State UI

✅ Completed

### Game Selection UI

✅ Completed

### Chat UI

✅ Completed

### Multiplayer Components

✅ Completed

---

# Epic 2 - Guest Identity

Goal:
Replace hardcoded player identity.

Status:
✅ Completed — 2026-06-16

## Features

### Guest Profile

✅ Completed

- nickname
- avatar (mascot)
- playerId (stable random id)

Files:
- src/features/guest/types/index.ts
- src/features/guest/stores/guestStorage.ts
- src/features/guest/hooks/useGuest.ts

### Local Persistence

✅ Completed

- localStorage key: `tw_guest`
- survives page refresh
- gracefully handles unavailable or corrupt storage

Files:
- src/features/guest/stores/guestStorage.ts

### Edit Profile

✅ Completed

- change nickname (max 20 chars)
- change avatar (14 mascot options, visual grid picker)
- accessible from ProfilePage "แก้ไข" button
- accessible from avatar tap on HomePage header
- EditProfileSheet rendered at App level (available from any tab)

Files:
- src/features/guest/components/EditProfileSheet.tsx

### Room Integration

✅ Completed

- create room uses guest player identity as host
- join room uses guest player identity as joiner
- CreateRoomSheet default name uses guest nickname
- ResultPage MVP card uses guest player
- Removed hardcoded ME import from all pages

Files:
- src/app/App.jsx (useGuest wired, ME removed)
- src/app/router.jsx (player threaded to all pages)
- src/pages/HomePage.jsx
- src/pages/ProfilePage.jsx
- src/pages/ResultPage.jsx
- src/features/room/components/CreateRoomSheet.tsx

Follow-up:
- integrate player identity with Socket.io when Epic 4 starts
- add EN nickname field for international display

### Welcome / Onboarding

✅ Completed — 2026-06-18

First-run entry screen (ported from the updated prototype): sign in with
Google/Apple **or** continue as Guest, then a guest-setup step (pick mascot +
nickname with a live preview). OAuth is previewed with a "เร็วๆ นี้" toast until
Epic 9; the guest path completes onboarding and enters Home.

- `GuestProfile.onboarded` gates the screen: brand-new guests see Welcome;
  returning guests (stored locally, or a Supabase profile on a new device) skip it
- App initial screen = `welcome` when not onboarded; async Supabase reconciliation
  redirects a returning account off Welcome to Home
- brand logo switched to image artwork (`Logo` `variant`: illustration / wordmark /
  emblem+text); favicon + apple-touch-icon added

Files:
- src/pages/WelcomePage.jsx (new)
- src/app/router.jsx, src/app/App.jsx
- src/components/ui/Logo.jsx
- src/features/guest/{types/index.ts, stores/guestStorage.ts, hooks/useGuest.ts}
- src/assets/brand/logo-illustration.webp, logo-wordmark.webp (new)
- public/favicon.webp (new), index.html

Follow-up:
- wire real Google/Apple OAuth into `onOAuth` (Epic 9)

### Account Sheet (edit profile + link + logout)

✅ Completed — 2026-06-18

Upgraded the edit-profile sheet into a fuller "บัญชีของฉัน" account screen
(ported from the prototype `screen-account`): live avatar/name preview + account
status badge, mascot grid, account-linking buttons (Google/Apple, previewed),
and a logout action. Opened from the Home avatar and the Profile tab
(⚙️ / avatar / "แก้ไข" / bio line).

- nickname + mascot persist via `updateGuest` (16-char cap, matches Welcome)
- `useGuest.logout()` signs out of Supabase, clears the local guest, and reloads
  into a fresh un-onboarded state (Welcome)
- account linking is preview-only (no fake provider persisted) until Epic 9

Files:
- src/features/guest/components/EditProfileSheet.tsx
- src/features/guest/hooks/useGuest.ts, stores/guestStorage.ts
- src/app/App.jsx, src/pages/ProfilePage.jsx

Follow-up:
- wire real account linking via `linkGoogle()` (Epic 9)

---

# Epic 3 - Local Chat

Goal:
Make lobby chat functional.

Status:
✅ Completed — 2026-06-17

## Features

### Send Message

✅ Completed

- functional composer (Enter or send button) appends to the chat store
- sent as the guest player identity (`player.id`) → renders right-aligned
- empty/whitespace messages ignored
- auto-scrolls the stream to the newest message

### System Message

✅ Completed

- `kind: 'system'` messages rendered centred via SystemMessage
- lobby seeds a welcome notice the first time a room's chat is empty
- `sendSystem(text)` ready for engine/socket events (joins, ready, round start)

### Emoji Reactions

✅ Completed

- per-message reactions stored as `{ emoji, by: playerId[] }`
- tap a bubble → EmojiReactionBar picker; tap a chip → toggle your vote
- chips show emoji + count and highlight when you reacted

### Timestamps

✅ Completed

- messages store epoch-ms `ts`; shown as 24h `HH:MM` via `formatChatTime`
- applies to both user bubbles and system notices

### Chat Store

✅ Completed

- `useChat(roomId, meId)` owns messages + persists per-room to localStorage
  (key `tw_chat_<roomId>`), reloads on room change, caps history at 200
- mirrors the guestStorage pattern (localStorage + hook, no extra deps)

Files:

- src/types/index.ts (ChatMessage evolved: id, kind, who, text, ts, reactions; ChatReaction)
- src/features/chat/stores/chatStorage.ts
- src/features/chat/hooks/useChat.ts
- src/features/chat/utils.ts
- src/features/chat/index.ts
- src/features/lobby/components/ChatPanel.tsx (system + timestamps + reactions + auto-scroll)
- src/features/lobby/components/ChatMessage.tsx (model-driven, timestamp, reaction chips)
- src/features/lobby/components/SystemMessage.tsx (optional timestamp)
- src/pages/LobbyPage.jsx (floating chat button, useChat wiring, system seed)
- src/data.ts (LOBBY_CHAT demo seed migrated to new shape)

Notes:

- transport-free; mutations are local. The hook API (send/system/react) is the
  seam Socket.io replaces in Epic 4 without touching callers.

Follow-up:

- replace local mutations with Socket.io chat sync (Epic 4 · Chat Sync)
- emit system messages from real room events (join/leave/ready) once realtime lands

---

# Epic 4 - Realtime Multiplayer

Goal:
Turn TangWong into a real multiplayer platform.

Status:
🟡 In Progress — 2026-06-17 (cross-tab transport; Socket.io server deferred)

Approach:
A transport-agnostic realtime layer ships first. The current adapter is
**cross-tab** (BroadcastChannel + a shared localStorage room snapshot), giving
genuine multi-client sync — open two browser tabs to test join/leave/ready/chat.
The same `RealtimeService` seam is satisfied by a Socket.io adapter later, so no
feature code changes when the server lands.

Files:

- src/services/realtime/channel.ts (BroadcastChannel wrapper)
- src/services/realtime/types.ts (SyncedRoom, RealtimeService contract)
- src/services/realtime/index.ts
- src/features/room/stores/roomRealtime.ts (shared room store + mutations)
- src/features/room/hooks/useRealtimeRoom.ts (join/leave/ready/settings + heartbeat)
- src/features/chat/hooks/useChat.ts (cross-tab chat sync)
- src/pages/LobbyPage.jsx (mock PLAYERS/ready removed; live room wired)

## Backend

### Socket.io Server

🔒 Deferred — cross-tab transport stands in for the prototype; the
`RealtimeService` interface is the drop-in seam for a Node + Socket.io server.

### Room Service

✅ Completed — `roomRealtime` store: create/join/leave, host handoff, settings,
deterministic room id (`room_<code>`) so chat shares the room.

### Connection Management

✅ Completed — presence heartbeat (3s) + stale-member pruning (10s); explicit
leave removes self and notifies other clients.

### Reconnect Logic

🟡 Partial — rejoin restores room membership + chat history (localStorage). Deep
network-drop reconnect arrives with the Socket.io server.

---

## Realtime Features

### Player Join Sync

✅ Completed — joining a room code makes the player appear for every client.

### Player Leave Sync

✅ Completed — explicit leave removes immediately; a closed tab is pruned after
the heartbeat timeout.

### Ready Sync

✅ Completed — ready toggles broadcast; every client sees the live ready count.

### Chat Sync

✅ Completed — messages, system notices, and reactions sync across clients
sharing the room.

### Room Setting Sync

✅ Completed — host edits (name, size, game, privacy) broadcast to all clients.

---

## Host Controls

### Player Actions Menu (kick + transfer host)

✅ Completed — 2026-06-17

- host-only kebab (⋯) dropdown on each player, shown across list / grid / circle
  layouts and hidden for the host and yourself
- actions: **👑 โอนสิทธิ์เจ้าของห้อง** (transfer host) · **🚫 นำออกจากห้อง** (kick)
- only available pre-start (the lobby is the pre-game screen)
- kick: removes the player + broadcasts; the kicked client is detected via
  `onRemoved`, toasted, and sent home — covers the "stranger joined the room I
  made for friends" case
- transfer host: hands the crown over; menus follow the new host instantly
- built on a reusable `DropdownMenu` primitive (no UI library)

### Add Bot

✅ Completed — 2026-06-17

- host-only "เพิ่มบอท" adds a synced filler bot (always ready, distinct mascot),
  capped at the room max; bots show a 🤖 badge and are removable ("นำบอทออก")
- lets a host reach the minimum player count solo; the roster feeds the game

### Start Gate (minimum players + all ready)

✅ Completed — 2026-06-17

- Start needs `players.length >= game.minPlayers` **and** everyone ready; the CTA
  shows "ต้องการอีก X คน" / "รอพร้อม (n/m)" / "เริ่มเกม" with a matching hint + banner

Files:

- src/components/ui/dropdown-menu/DropdownMenu.tsx (new, reusable)
- src/features/room/components/PlayerActionsMenu.tsx (new)
- src/features/room/hooks/useRealtimeRoom.ts (`kick`, `transferHost`, `onRemoved`)
- src/features/room/stores/roomRealtime.ts (`transferHost`)
- src/features/lobby/components/LobbyFooter.tsx (start gate + hint)
- src/components/game/PlayerSeat.tsx + lobby Player{List,ListItem,Grid,Circle}.tsx (actions slot)
- src/pages/LobbyPage.jsx

---

## Coming soon (previewed, not built)

- **Voice channel** — dimmed with a "เร็วๆ นี้" badge in the lobby (`ComingSoon`)

---

# Epic 4.5 - Supabase Backend

Goal:
Let friends play from different devices / networks, deployable for free
(Supabase + Vercel). Long-term authority direction is **locked**: Supabase
Edge Functions + Postgres + RLS — clients never write game state directly.

Status:
✅ Completed — 2026-06-25 (4.5.1 auth, 4.5.2 rooms/realtime, 4.5.3 game authority +
hidden info, 4.5.4 deploy — all live + verified on production)

Plan:
See docs/supabase-plan.md for architecture, schema, RLS, and the phased plan.

## Phase 4.5.1 - Foundation + Auth

✅ Completed — 2026-06-18

- anonymous Supabase auth (`signInAnonymously`) → stable cross-device `auth.uid()`
- `profiles` table (id, nickname, mascot) + RLS (owner-only read/write)
- guest identity migration: local `tw_guest` is upgraded onto the real uid; a
  returning account's stored profile takes over nickname/mascot
- env setup; the backend is opt-in — with no `.env.local` the app runs on the
  local-only guest exactly as before
- `linkGoogle()` seam present for later account upgrade (not yet in the UI)

Files:

- src/services/supabase/{client,auth,profiles,index}.ts (new)
- src/features/guest/hooks/useGuest.ts (auth-aware migration)
- src/vite-env.d.ts (new), .env.example (new)
- supabase/migrations/0001_profiles.sql (new), supabase/README.md (new)

Notes:

- Edge Functions intentionally NOT implemented yet (Phase 4.5.3)
- no game/room tables yet — schema kept minimal, evolves incrementally

Follow-up:

- Phase 4.5.2 — rooms + chat over Supabase (RPC + Realtime, behind VITE_USE_SUPABASE)
- wire a "link Google account" button into the profile sheet

## Phase 4.5.2 - Rooms + Realtime

✅ Completed — 2026-06-18 (deployed + verified: security gate + live cross-device sync)

- schema + RLS + RPC: `rooms`, `room_players`, `chat_messages`; all writes go
  through `SECURITY DEFINER` functions (join/leave/ready/settings/kick/transfer/
  add_bot/touch_presence/toggle_reaction/send_system) — clients never write
  these tables directly (`0002_rooms_chat.sql`)
- display name + mascot are denormalised onto `room_players` so clients render
  opponents without reading owner-only `profiles`
- `roomService` / `chatService` — async, server-authoritative, realtime via
  Postgres changes; same surface as the cross-tab store
- `useRealtimeRoom` / `useChat` now switch transport on `useSupabaseTransport`
  (`VITE_USE_SUPABASE=true`); default stays cross-tab so local dev is unchanged

Bug fixes (2026-06-18):

- **auth UID race + kick detection**: `useSupabaseRoom` now resolves `auth.uid()`
  directly before joining; join effect gated on `authUid`; kick detection gated
  on `synced=true` (first real DB snapshot) — fixed "separate rooms" symptom

Files:

- supabase/migrations/0002_rooms_chat.sql (new)
- src/services/supabase/{rooms,chat}.ts (new), client.ts (`useSupabaseTransport`), index.ts
- src/features/room/hooks/useRealtimeRoom.ts (transport switch + auth fix)
- src/features/chat/hooks/useChat.ts (transport switch), src/pages/LobbyPage.jsx (pass code)

Verification (docs/verify-4.5.2.md):

- **§5 security gate — PASS 7/7** (the non-negotiable blocker for 4.5.3): direct
  writes to `rooms` / `room_players` / `chat_messages` all rejected by RLS;
  forged/system chat inserts rejected; reaction write affects 0 rows (verified by
  read-back); cross-room chat + foreign profile reads return 0 rows. Run live via
  the console kit on the deployed project.
- **§3 core loop — PASS** live on two real accounts: distinct `auth.uid()`,
  join-by-code into the same room, realtime two-way chat sync.
- Static SQL/code audit confirms §6 host-only guards (`assert_host`) and every
  mutating RPC is `SECURITY DEFINER`.

The "Must BLOCK moving to 4.5.3" criteria (security, realtime delivery, identity
stability, host guards) are all satisfied → cleared to start 4.5.3.

Follow-up (recommended spot-checks, non-blocking):

- two-device runtime pass of the remaining §3 host actions (ready/settings/kick/
  transfer/add-bot/leave/rejoin) + §4 presence — plumbing is shared with the
  proven chat path, guards are audited, so low risk
- tune presence pruning (currently last_seen is updated but not server-pruned)
- emit join/leave/ready system messages from real events

## Phase 4.5.3 - Game Sync + Hidden Info (Edge Function authority)

✅ Completed — 2026-06-25 (B0–B7 done; deployed + verified on production with a real
two-device match, approved by the user)

Design: see **docs/phase-4.5.3-plan.md** — commits Option B (Edge Function runs
the existing TS engine as the authority), defines `game_states` (public) +
`game_private` (owner-only RLS — the hidden-info boundary) + `game_actions`,
the `game-start` / `game-action` functions, server-resolved bots, host-driven
timers, and a B0–B7 build order. Hidden-info isolation rides on the RLS pattern
verified in 4.5.2.

Progress:

- **B0 — engine portability ✅** (2026-06-18): removed the Vite `@/` alias from
  every pure engine/avalon file (relative `.ts` imports — `allowImportingTsExtensions`
  keeps tsc/Vite green and gives Deno explicit paths). React/UI files unchanged
  (UI keeps `@/`). Deno `deno check` smoke test deferred to B2 (needs the
  `supabase/functions` deno.json import map for extensionless local imports).
- **B1 — game schema + RLS ✅ ready** (2026-06-18): `0004_game_state.sql` adds
  `game_states` (member-read), `game_private` (**owner-only read = hidden-info
  boundary**), `game_actions` (member-read); no client write policies (Edge
  Function/service-role writes only); realtime publication for all three.
  **Action: apply 0004 in Supabase SQL editor**, then RLS-verify with a §5-style
  console kit (another player's game_private row must be unreadable).

- **B2 — `game-start` Edge Function ✅ written** (2026-06-19, deploy pending):
  `supabase/functions/` scaffold — `deno.json` (npm supabase-js + `sloppy-imports`),
  `_shared/cors.ts` + `_shared/supabase.ts` (admin/service-role client + JWT
  caller id). `game-start/index.ts`: host-only, idempotent; runs the engine
  (createInitialState → first phase `roleReveal`), writes the public snapshot +
  per-player private rows, flips room to `in-game`. Imports the engine by
  relative path into `src/` (B1). **Action: `supabase functions deploy
  game-start`** + run the hidden-info verify in `supabase/functions/README.md`
  (others' `game_private` must read back `[]`).

- **B3 — `game-action` Edge Function ✅ written** (2026-06-22, deploy pending):
  `game-action/index.ts`: authenticated room-member action endpoint; reconstructs
  full game state from `game_states` + all `game_private` rows with the service
  role; dispatches through the shared TS engine; resolves `bot_*` seats on the
  server; persists public/private snapshots with an optimistic `version` guard;
  logs public-safe action rows (mission cards are redacted to `{ submitted: true }`);
  writes `public_data.reveal` on end for ResultPage. Local checks:
  `npm run verify:game-action`, TS transpile smoke, and `npm run build`.
  **Action: deploy `game-start` + `game-action`, then run the verify steps in
  `supabase/functions/README.md`.**

- **B4 — realtime game client ✅ written** (2026-06-22, deploy pending):
  `game.ts` adds the Supabase game read model (`game_states` + caller-owned
  `game_private`) and `game-start` / `game-action` intent calls; `useRealtimeGame`
  resolves the effective Supabase `auth.uid()`, fetches/subscribes to game rows,
  and exposes `start` + `submitAction`; `GamePage` now branches on
  `useSupabaseTransport`; `AvalonGame` has a state/action prop boundary while
  keeping the local engine path for offline/dev play. Local checks:
  `npm run verify:realtime-game` and `npm run build`.
  Files:
  `src/services/supabase/game.ts`,
  `src/features/games/engine/useRealtimeGame.ts`,
  `src/features/games/engine/index.ts`,
  `src/services/supabase/index.ts`,
  `src/pages/GamePage.jsx`,
  `src/features/games/avalon/ui/AvalonGame.tsx`,
  `src/types/index.ts`,
  `scripts/verify-realtime-game.mjs`,
  `package.json`.
  Notes: online mode waits for the server snapshot and disables local bot/timer
  automation; role reveal for ResultPage reads `public_data.reveal` when present,
  then falls back to local private state. Follow-up: deploy/apply B1-B4 backend
  pieces and verify with two real clients because local build cannot exercise
  Supabase Realtime/RLS or Edge Function runtime.

- **B5 — host-driven timer tick / timeout path ✅ written** (2026-06-23, deploy pending):
  `game-action/index.ts` now accepts the server intent `TIMEOUT`; only the
  current room host may call it, and the function verifies elapsed time against
  `game_states.updated_at` before choosing the next legal default action via
  `nextBotAction` and dispatching it through the engine. Timeout actions are
  audited in `game_actions` without exposing mission cards. The Supabase game
  service exposes `timeoutGame`, `useRealtimeGame` exposes `timeout`, and
  `AvalonGame` calls it once per expired online timer from the host client while
  preserving the local offline timer path. Local checks: `npm run
  verify:game-timeout`, `npm run verify:game-action`, `npm run
  verify:realtime-game`, and `npm run build`.
  Files:
  `supabase/functions/game-action/index.ts`,
  `src/services/supabase/game.ts`,
  `src/features/games/engine/useRealtimeGame.ts`,
  `src/features/games/avalon/ui/AvalonGame.tsx`,
  `src/pages/GamePage.jsx`,
  `scripts/verify-game-timeout.mjs`,
  `package.json`.
  Notes: host-driven timers pause if no host client is connected, matching the
  MVP decision in `docs/phase-4.5.3-plan.md`.

- **Deploy + runtime verify ✅** (2026-06-23): `game-start` + `game-action`
  deployed to project `lvhhzigrjqtlmzdokvfa`. Edge Function bundling fixes
  needed for Supabase's Deno bundler (which ignores `deno.json` `sloppy-imports`
  server-side): `_shared/supabase.ts` imports `npm:@supabase/supabase-js@2`
  directly, and every relative import in the pure engine/avalon files now carries
  an explicit `.ts` extension (`allowImportingTsExtensions` keeps tsc/Vite green).
  A live two-client harness (`scripts/e2e-live-game.mjs`, `npm run
  verify:live-game`) drives anon auth → room + bots → game-start → game-action →
  TIMEOUT against production and asserts the RLS hidden-info gate: **21/21 pass**.
  Confirmed: host-only game-start (403 for others), `roleReveal` snapshot,
  per-player `game_private` rows readable only by their owner (0 leaked),
  `CONTINUE → teamProposal` with version increment, illegal-action 400, early
  TIMEOUT 409, non-host TIMEOUT 403.

- **B6 — full-match + end-game reveal verified ✅** (2026-06-23): `verify:live-game`
  now plays a complete Avalon match against production — the harness supplies the
  two humans' legal moves (the server auto-resolves bot seats after each action),
  always approving teams and playing Success, which drives loyal to 3 quest wins →
  `assassinate` → `end`. Asserts: game reaches `status='ended'` with a winner,
  `public_data.reveal` carries role+side for all 5 players, room flips to `ended`,
  and the guest can now read the public reveal (hidden info released only at end).

- **B6 — reconnect / resume mid-match ✅** (2026-06-23): the harness simulates a
  page reload — a brand-new client adopts the guest's existing session (same
  `auth.uid`) and resumes the in-progress game from the server: current public
  phase, own private role, RLS still blocking others' roles, and the ability to
  act again (a phase-illegal vote reaches engine validation `400`, not the
  membership gate `403`, proving authenticated membership resumed). This mirrors
  the mobile reconnect path (`useRealtimeGame` re-fetches on a fresh client).
  Full run now **31/31 pass** (`verify:live-game`).

- **B7 — online play UX hardening (in progress)** (2026-06-23): closed two
  production gaps in the online game UI found while reviewing the deployed flow
  (impeccable `harden`): (1) **action failures were silent** — `submitAction` /
  `timeout` errors (validation 400, version-conflict 409, network) set
  `realtime.error` but nothing surfaced; now `AvalonGame` toasts a short, friendly
  Thai message per failure (`friendlyGameError` maps engine/network errors, deduped
  per occurrence). (2) **no in-flight guard** — action buttons (continue, nominate,
  vote, mission, assassinate) now `disabled` while a server round-trip is in flight
  (`busy`), preventing double-submit on slow mobile networks. `GamePage` threads
  `busy`/`error` from `useRealtimeGame`; offline play unaffected. Build + verify green.
  Files: `src/features/games/avalon/ui/AvalonGame.tsx`, `src/pages/GamePage.jsx`.

- **B7 — non-host navigation fix + live-test UX polish (2026-06-25)**: verified a
  full real two-device match, then fixed what the playtest surfaced:
  1. Non-host players stayed in the lobby on start — `LobbyPage` now navigates
     everyone to the game when `rooms.status` flips to `in-game` (was host-only).
  2. **Vote reveal**: Avalon votes are public once resolved — `AvalonGame` now
     shows each seat's ✓ approve / ✗ reject after all votes are in and keeps it
     visible through the mission (+ a ✓/✗ tally in the centre) so the loyal side
     can read the table.
  3. **End-game roles**: `GamePage.handleEnd` mapped `reveal` wrong (whole object
     as role key, others fell back to "servant"); now extracts `reveal[id].role`
     so ResultPage shows every player's real role.
  4. Chat bubbles got more breathing room (`.bubble` padding/line-height).
  5. Home hero overlapped copy with the table scene on narrow screens — relaid
     out as a vertical stack (copy → contained table band → signals).
  Files: `LobbyPage.jsx`, `AvalonGame.tsx`, `GamePage.jsx`, `HomePage.jsx`,
  `styles/components.css`. Build + verify green.

Next: visual confirm hero + vote reveal on device, then mark phase 4.5.3 ✅.

## Avalon shippable — invite + rematch (2026-06-25)

- **P1 — invite deep-link join ✅**: `/join/<CODE>` auto-joins once the guest is
  onboarded + session-ready (survives Welcome); URL cleans to `/` after joining;
  `generateInviteLink` uses the real origin (was the dead `tangwong.app`). SPA
  rewrite for `/join/*` already in `vercel.json`. Files: `app/App.jsx`,
  `features/room/roomUtils.ts`.
- **P2 — rematch ✅ (deployed + verified)**: `game-start` accepts host-only
  `{ restart: true }` — clears the finished game and re-deals fresh roles into the
  same room/roster. ResultPage host taps "เล่นอีกครั้ง"; everyone on the result
  screen subscribes to `game_states` and follows into the fresh game; non-host
  sees "รอหัวห้องเริ่มใหม่". `verify:live-game` now 37/37 on production
  (rematch: host-only 403 gate, fresh roleReveal v0, reveal cleared, both humans
  re-dealt). Files: `supabase/functions/game-start/index.ts`,
  `services/supabase/game.ts`, `engine/useRealtimeGame.ts`, `pages/ResultPage.jsx`,
  `pages/GamePage.jsx`.

- **P4 — polish pass (a11y) ✅** (2026-06-25, impeccable `polish`): fixed the real
  "Buttons must have discernible text" defect seen in DevTools — icon-only buttons
  across the core loop now have `aria-label` (game exit/chat, result home, lobby
  back/settings, home bell/invite, chat close). Root-caused the shared
  `layout/IconButton` dropping a11y props → now forwards `...rest` (one fix, all
  call sites benefit). No pixels changed. Files: `components/layout/Header.jsx`
  (+ `.d.ts`), `AvalonGame.tsx`, `ResultPage.jsx`, `HomePage.jsx`,
  `LobbyHeader.tsx`, `ChatSheet.jsx`.

Next: device smoke-test invite + rematch on tangwong.vercel.app, then "Avalon
shippable" is done — choose game #2 (Salem) or social layer (accounts/friends).

Follow-up (from 4.5.2, non-blocking): server-side presence pruning; emit
join/leave/ready system messages from real events.

## Phase 4.5.4 - Deploy (Vercel + Supabase)

✅ Deployed — 2026-06-18 (live at <https://tangwong.vercel.app/>)

- `vercel.json` — Vite framework preset + SPA catch-all rewrite so deep links /
  refreshes (`/join/:code`, `/lobby`, …) resolve to the app instead of 404
- `DEPLOYMENT.md` — end-to-end guide: GitHub push, Supabase project + anon auth,
  migration order (0001→0002), `.env.local`, Vercel env vars, and a pre/post
  deploy checklist with a two-device smoke test
- `.env.example` confirmed complete (URL, anon key, `VITE_USE_SUPABASE`)
- build + typecheck verified green; first Vercel deploy succeeded
- Supabase project created, migrations applied, anonymous auth enabled
- fixed darwin-arm64 native dep (`@tailwindcss/oxide-darwin-arm64` removed from
  devDependencies) + pinned Node 20 via `.nvmrc` to unblock Vercel build
- **responsive layout fix**: removed prototype phone/device frame; app now renders
  as a real mobile web app (`max-width:480px` shell, `position:fixed` tabbar with
  safe-area inset, real viewport scroll — no more phone-inside-phone on Safari)

Note (not a blocker): `/join/:code` resolves to the SPA but does not yet
auto-join from the URL — the in-memory router still expects the code pasted on
Home. URL → auto-join is a future feature; the rewrite is in place for when it lands.

Files:

- vercel.json (new), DEPLOYMENT.md (new), .nvmrc (new)
- package.json (darwin-arm64 removed)
- index.html, src/main.jsx, src/app/App.jsx, src/app/TabBar.jsx
- src/styles/tokens.css, src/styles/reset.css, src/styles/layout.css,
  src/styles/components.css

Follow-up:

- run the first GitHub → Vercel deploy; complete the post-deploy smoke test
- wire URL `/join/:code` → auto-join (feature, separate task)

---

# Epic 5 - Generic Game Engine

Goal:
Support multiple games with one engine.

Status:
✅ Completed — 2026-06-16

## Game State

### Public State

✅ Completed — `PublicGameState<TPublic>`: phase, turn, round, activePlayerId, typed game data

### Private State

✅ Completed — `PrivatePlayerState<TPrivate>`: per-player private data keyed by playerId

### Room State

✅ Completed — `RoomState`: roomId, roomCode, gameId, hostId, players, maxPlayers, isPublic, status, createdAt

Files:

- src/features/games/engine/types.ts
- src/features/games/engine/playerUtils.ts

---

## Game Lifecycle

### Setup

✅ Completed — `GameEngine.createInitialState(room)` builds immutable initial state from RoomState

### Turn

✅ Completed — `turn` and `round` counters in `PublicGameState`; `activePlayerId` tracks current turn

### Action

✅ Completed — `dispatch(state, action)` validates → handles → emits events → checks win → auto-advances

### Resolution

✅ Completed — `transitionTo(state, phase)` for manual phase transitions; `shouldAutoAdvance()` for automatic

### End Game

✅ Completed — `checkWin()` runs all `WinCondition` checkers after every action; sets `winner`, `phase='end'`, `status='ended'`

---

## Engine Features

### Event System

✅ Completed — typed `GameEvent` with factory helpers: `createEvent`, `systemEvent`, `playerEvent`, `eventsOfType`, `lastEventOfType`

Files:

- src/features/games/engine/events.ts

### Action Validation

✅ Completed — composable validators: `validatePlayerExists`, `validatePlayerConnected`, `validateIsHost`, `validateIsActiveTurn`, `validateGameNotEnded`, `validateGameInProgress`, `composeValidators(...)`, `alwaysValid`

Files:

- src/features/games/engine/validation.ts

### Win Conditions

✅ Completed — `WinCondition<TPublic, TPrivate>` plug-in interface; `WinResult` with team/individual/score type, winners, reason (EN + TH)

### Phase Management

✅ Completed — `DEFAULT_PHASES` (lobby → setup → discussion → voting → resolution → end); `PhaseConfig` with `allowedActions` and `PhaseTransition[]`; `isValidTransition`, `applyPhaseTransition`, `getAllowedActions`, `isActionAllowed`, `shouldAutoAdvance`

Files:

- src/features/games/engine/phases.ts

### React Integration

✅ Completed — `useGameEngine(config)` hook: `start`, `dispatch`, `transitionTo`, `isPlaying`, `phase`, `winner`, `engine`

Files:

- src/features/games/engine/engine.ts
- src/features/games/engine/useGameEngine.ts
- src/features/games/engine/index.ts

---

# Epic 5.1 - Game Client Layer (boardgame.io-inspired)

Goal:
One transport-agnostic client API for every game — `client.moves.X(payload)`,
`subscribe`, `getState` — adapted from the boardgame.io Client pattern without
adding the dependency or its Node server. Supabase Edge Functions + RLS stay
authoritative online; an in-memory master covers local multi-seat play.

Status:
🟡 In Progress — 2026-11-16 (all features built; browser + live Supabase checks
and the Edge Function registry switch remain)

## Features

### createGameClient
✅ Completed — 2026-11-16

Files:
- `src/features/games/engine/client/types.ts`
- `src/features/games/engine/client/createGameClient.ts`
- `src/features/games/engine/client/useGameClient.ts`
- `src/features/games/engine/client/index.ts`

Notes:
- typed `client.moves.ACTION(payload)` via Proxy + `MoveMap` generic
- `MoveResult` (`{ ok:false, error }`) replaces thrown errors, like `INVALID_MOVE`
- snapshot exposes `status`, redacted `state`, `version`, `busy`, `error`;
  stale (lower-version) snapshots are ignored
- `useGameClient` binds to React via `useSyncExternalStore`
- `GameTransport` interface is the seam for Local and Supabase transports

### LocalTransport
✅ Completed — 2026-11-16

Files:
- `src/features/games/engine/client/localTransport.ts`
- `scripts/verify-game-client.mjs` (`npm run verify:game-client`)

Notes:
- `createLocalMaster()` holds the full state; every seat connects through one
  transport and receives only `redactStateFor(state, seat)`
- `firstPhase`, bot auto-play, host-only start/timeout and timeout resolution
  mirror `supabase/functions/game-action` semantics
- `getFullState()` / `getActionLog()` for devtools and tests only
- verified: Avalon (3 humans + 2 bots) and Werewolf (4 humans + 3 bots) finish
  with per-seat privacy assertions, invalid-move rejection, and timeouts

Follow-up:
- move `firstPhase` / `nextBotAction` / `privateActionTypes` into a shared
  game runtime registry used by both LocalTransport and Edge Functions

### SupabaseTransport
✅ Completed — 2026-11-16

Files:
- `src/services/supabase/gameTransport.ts`
- `src/services/supabase/game.ts` (Edge Function error extraction)
- `src/services/supabase/index.ts`
- `src/features/games/engine/client/types.ts` (`MatchInfo`, `TransportError`)
- `src/features/games/engine/client/createGameClient.ts`
- `src/features/games/engine/client/localTransport.ts`
- `scripts/verify-supabase-transport.mjs` (`npm run verify:supabase-transport`)

Notes:
- wraps `services/supabase/game.ts` behind `GameTransport`; Edge Functions + RLS
  remain the only authority, no server changes and no redeploy needed
- Realtime change events trigger serialized, coalesced refetches (12 events →
  2 fetches in the verifier); snapshot `version` is a per-transport sequence so
  a restart (server row version → 0) is not dropped as stale
- intents refetch on success so the actor sees its result without waiting on
  Realtime
- defensively redacts to the viewer's seat even if RLS returned extra rows
- `match` (roomId, roomCode, gameId, hostId) is exposed before a game exists,
  for host-only auto-start gating
- fetch failures push a `TransportError`: last good state is kept, and the
  next good sync clears it (move errors are not cleared by syncs)
- `game.ts` intents now surface the Edge Function `{ error }` body ("host only",
  "version conflict") instead of the generic non-2xx message — this also
  improves errors in the existing `useRealtimeGame`
- verified against an in-memory fake service; not yet exercised against the
  live Supabase project

Follow-up:
- live check with two browsers once GamePage is migrated
- retry automatically on `version conflict` (409 `retry: true`)

### Migrate useRealtimeGame + GamePage to GameClient
✅ Completed — 2026-11-16 (online path; UI live check pending)

Files:
- `src/features/games/useOnlineGameClient.ts` (new)
- `src/features/games/engine/client/useGameClient.ts` (accepts `null`)
- `src/pages/GamePage.jsx`
- `src/features/games/engine/index.ts`
- `src/features/games/engine/useRealtimeGame.ts` (removed)
- `scripts/verify-realtime-game.mjs`, `scripts/verify-game-timeout.mjs`

Notes:
- `useOnlineGameClient(roomCode, enabled)` resolves the auth id via
  `ensureSession`, then builds one GameClient per room over SupabaseTransport
- GamePage maps the client snapshot onto the existing `GameUIProps`
  (`externalState`, `onSubmitAction`, `onStartGame`, `onTimeout`, `busy`,
  `error`) — no game UI changed
- host auto-start now keys off `snapshot.match.hostId`, available before a
  game exists
- Avalon-only typing of the old hook is gone
- offline/solo play is unchanged (still each UI's local `useGameEngine`)
- contract + runtime verifiers and `vite build` pass; NOT yet clicked through
  in two browsers against the live Supabase project

Follow-up:
- two-browser live run: host auto-start, guest sync, action, timeout, restart
- pass `client` through `GameUIProps` and drop the separate online props
- ~~route offline/solo play through LocalTransport~~ → done, see below

### Offline Play via LocalTransport
✅ Completed — 2026-11-16 (verified headless; not yet clicked through in a browser)

Files:
- `src/features/games/runtime.ts` (new — shared runtime registry)
- `src/features/games/useLocalGameClient.ts` (new)
- `src/features/games/engine/client/localTransport.ts`
- `src/features/games/registry.ts` (`autoPlay`, `onToggleAutoPlay` on `GameUIProps`)
- `src/pages/GamePage.jsx`
- `src/features/games/avalon/ui/AvalonGame.tsx`
- `src/features/games/werewolf/ui/WerewolfGame.tsx`
- `src/features/games/checkpoint/ui/CheckpointGame.tsx`
- `scripts/verify-game-client.mjs`, `scripts/verify-game-timeout.mjs`

Notes:
- game UIs now have ONE code path: state + actions always come from a
  GameClient; each UI's local `useGameEngine`, start/first-phase effects and
  bot `setTimeout` loops were removed
- runtime registry (`firstPhase`, `nextBotAction`, `revealForPublic`,
  `privateActionTypes`, `botDelayMs`) mirrors `supabase/functions/_shared/games.ts`
- LocalMaster gained: paced bots (`botDelayMs`: Avalon/Werewolf 900 ms,
  Checkpoint 520 ms — same as before), per-seat `setAutoPlay` (🤖 chip),
  `hostOnly` switch, end-game `reveal` like the server, timeout prefers seats
  a human controls; bot timer pauses when no seat is connected
- offline the UI now only receives the local seat's private state (was the
  full state); the result page still gets every role through `reveal`
- offline phase-timer expiry plays the local seat's default move, as before
- offline invalid moves now surface the same error toast as online
- verifier plays Avalon (6), Werewolf (7), Checkpoint (4) offline with a
  non-host local seat, paced bots, mid-game autoplay hand-off and reveal checks

Follow-up:
- click through all three games offline in a browser
- point `supabase/functions/_shared/games.ts` at `src/features/games/runtime.ts`
  (needs Edge Function redeploy)
- delete now-unused `useGameEngine` and `nextAutoActor` (update
  `verify-werewolf.mjs`)
- Checkpoint `CONTINUE_SHIFT` still needs the host to tap — autoplay does not
  cover it (unchanged behaviour)

### Devtools Seat Switcher
✅ Completed — 2026-11-16 (verified headless; not yet checked in a browser)

Files:
- `src/devtools/SeatSwitcher.tsx` (new)
- `src/features/games/useLocalGameClient.ts`
- `src/pages/GamePage.jsx`
- `scripts/verify-game-client.mjs`

Notes:
- offline only; shown on the Vite dev server or with `?devtools` in the URL
- floating 👁 button (left edge, touch-sized) opens a seat grid; tapping a
  seat renders the SAME match from that seat (boardgame.io Debug-panel idea)
- one GameClient per seat, so the UI still only receives the viewed seat's
  redacted state; the game UI remounts per seat (`key`) so selections and
  timers never leak between seats
- the viewed seat is played by hand, every other seat by bots (the previous
  seat becomes bot-played after a switch); 🤖 autoplay is per seat
- orange dot = seat has a legal move right now (god view, devtools only);
  "คุณ" marks the real player; results still credit the real player
- verifier switches seats mid-game in all three games (8–18 switches) with
  per-seat privacy assertions

Follow-up:
- optional "pause bots" toggle for pure hot-seat play (every seat manual)
- optional role peek / full-state inspector panel

---

# Epic 6 - Avalon MVP

Goal:
First playable game.

Status:
✅ Completed — 2026-06-25 (engine + UI + realtime online play; a full two-device
match runs Home → Room → Lobby → Avalon → Result on production. The MVP loop is live.)

Structure:
Games are now one folder per game under `src/features/games/`, with `engine/`
as the shared core: `src/features/games/avalon/` holds Avalon's definition.

## Engine (logic) — ✅ Completed

### Role Assignment

✅ Completed — `buildPrivateState`: composition per player count (5–10), shuffled
assignment; vision computed per role (Merlin sees evil except Mordred; Percival
sees Merlin + Morgana; evil see each other).

### Team Assignment

✅ Completed — quest team-size tables per player count; quest 4 needs 2 fails at 7+.

Files:

- src/features/games/avalon/types.ts (AvalonPublic / AvalonPrivate / phases)
- src/features/games/avalon/setup.ts (roles, quests, vision, selectors)
- src/features/games/avalon/phases.ts (state machine)
- src/features/games/avalon/actions.ts (NOMINATE_TEAM, VOTE_TEAM, PLAY_MISSION_CARD, CONTINUE, ASSASSINATE)
- src/features/games/avalon/winConditions.ts
- src/features/games/avalon/config.ts + index.ts
- src/features/games/index.ts (barrel)
- src/features/games/engine/types.ts (GamePhase widened for per-game phases)

Notes:

- engine verified via a scripted playthrough: role counts, Merlin vision,
  full quest loop, quest-4 two-fail rule, 3-fail evil win, 5-reject evil win
- mission cards are stored secret + cleared on reveal (must be redacted in transit)

## Gameplay (logic) — ✅ Completed

### Team Selection

✅ Completed — `NOMINATE_TEAM` (leader-only, exact size); phases `teamProposal` → `teamVote`.

### Voting

✅ Completed — `VOTE_TEAM`; strict-majority approve; reject rotates leader + counts toward the 5-reject loss.

### Mission

✅ Completed — `PLAY_MISSION_CARD`; team-only, one card each.

### Success/Fail

✅ Completed — resolves by required fail count; records per-quest outcome.

### Assassin Phase

✅ Completed (logic) — `ASSASSINATE` after good reaches 3 quests; kills Merlin → evil win, else good win.

---

## End Game

### Reveal Roles

✅ Completed — ResultPage reveals every player's real role/side from the game payload.

### Winner Screen

✅ Completed — ResultPage reads the `WinResult` (team + reason), shows the human's
real role, quest recap, and full role reveal.

---

## UI — Phase A (single-client, bot-driven) — ✅ Completed — 2026-06-17

Playable end-to-end: Home → Lobby → **Avalon** → Result. The human plays their
own seat; bots auto-play every other seat (and all seats in 🤖 auto mode).

Done:

- `AvalonGame` orchestrator on `useGameEngine(avalonConfig)` — per-phase center,
  action bar, round table, role strip, quest track, in-game chat
- `AvalonTable` (ring seats) + `RoleRevealCard` (tap to view role + vision)
- per-phase timer (auto-acts for an idle human on expiry)
- bots (`nextBotAction` / `nextAutoActor`) drive every role; 🤖 toggle for full autoplay
- GamePage bot-pads short rosters so a solo player can run a full match
- engine `redactStateFor` (hidden-info view) + `gamePlayerToPlayer` bridge

Files:

- src/features/games/avalon/bot.ts
- src/features/games/avalon/ui/{AvalonGame,AvalonTable,RoleRevealCard,index}.tsx
- src/features/games/engine/view.ts, playerUtils.ts (gamePlayerToPlayer)
- src/pages/GamePage.jsx (rebuilt on the engine), src/pages/ResultPage.jsx
- src/app/router.jsx (room + player threaded to the game)

Verified: 240 bot-driven games (5–10p) all completed; every win path occurs.

### Rules Screen (from engine)

✅ Completed — 2026-06-17

- `RulesSheet` shows objective, composition, roles, how-to-play, win conditions
  + tips; `getGameRules('avalon')` derives the facts from the engine
  (config/setup/phases/win conditions) so they always match real play
- opened from the Games tab (book button) and the lobby game selector ("อ่านกฎ")
- games without an engine show a "coming soon" rules placeholder

## UI — Phase B (realtime multiplayer) — ⚪ Not Started

- host-authoritative `useRealtimeGame`: host runs the engine, redacts per player,
  broadcasts; clients send action requests over the realtime channel
- host disconnect / reconnect handling

---

# Epic 6.5 - Generic Game Framework + Werewolf (Game #2)

Status:
✅ Completed — 2026-07-01 (A1–A4 framework + B1–B8 Werewolf with advanced roles,
deployed + verified 46/46 on production)

Goal:
Turn "add a new game" into a clean, well-scoped task by removing the remaining
Avalon hard-codes and introducing shared extension points, then prove it by
shipping Werewolf — which reuses the existing engine while adding day/night
cycles, player elimination, and night-action hidden roles. This strengthens the
engine before the more complex Salem 1692.

Sequencing decision (locked): **Salem 1692 is deferred to after Werewolf.**
Social features (accounts, friends, invitations, match history) come **after
TangWong has at least three fully playable games.**

Grounding (from the current code):
- Engine core is already game-agnostic: `GameEngine`, `PhaseConfig` +
  `PhaseTransition` (a `when:'condition'` transition already supports a cyclic
  day/night loop), `WinCondition`, `ActionDef`, and `redactStateFor` need no
  changes for Werewolf. Werewolf-sees-werewolf rides the same setup-time private
  `sees` pattern as Avalon's vision; dead-role reveal rides public data.
- The remaining Avalon couplings to remove:
  - `game-action` imports `nextBotAction` from `avalon/bot` directly and hard-codes
    `gameId === 'avalon'` for the end-game reveal blob.
  - `game-start` already uses `ENGINES` / `FIRST_PHASE` maps (extend, don't rework).
  - `GamePage` hard-branches to `AvalonGame` and `=== 'avalon'` checks.
  - No generic player alive/eliminated concept (Avalon never removed players).

## Phase A - Generic Game Framework (de-couple + extension points)

### A1 - Server game registry
✅ Completed — 2026-06-26

Files:

- supabase/functions/_shared/games.ts (new — `ServerGameEntry` interface + `GAME_REGISTRY`)
- supabase/functions/game-start/index.ts (removed direct avalon imports; uses `GAME_REGISTRY`)
- supabase/functions/game-action/index.ts (removed direct avalon imports + `gameId === 'avalon'` branch; all bot/reveal/redact logic reads from `GAME_REGISTRY`)

Notes:

- `ServerGameEntry` shape: `{ config, firstPhase, nextBotAction, revealForPublic, privateActionTypes }`
- Adding a new game = one entry in `GAME_REGISTRY`; the Edge Functions are now game-agnostic

### A2 - Client game registry
✅ Completed — 2026-06-26

Files:

- src/features/games/registry.ts (new — `GameUIProps`, `GameRegistryEntry`, `getGameEntry`)
- src/features/games/index.ts (exports `getGameEntry` + `GameRegistryEntry` / `GameUIProps`)
- src/pages/GamePage.jsx (removed direct AvalonGame/avalonConfig imports; routes UI through `entry.ui`; "coming soon" check is now `!entry`)

Notes:

- `GameUIProps` is the shared contract all in-game UI components must implement
- `handleEnd` in `GamePage` is still Avalon-specific — moved to a `TODO(A4/GameShell)` comment; will become a per-game `buildResultProps` when GameShell lands
- Adding a new game = one entry in `REGISTRY` inside `registry.ts`

### A3 - Player lifecycle convention
✅ Completed — 2026-06-26

Files:

- src/features/games/engine/playerUtils.ts (`isAlive`, `alivePlayers`, `eliminate`)

Notes:

- Convention: `TPublic` includes `eliminatedPlayers: string[]`
- `isAlive(players, playerId, eliminatedIds)` — checks roster + not eliminated
- `alivePlayers(players, eliminatedIds)` — filters to living seats
- `eliminate(eliminatedIds, playerId)` — idempotent append

### A4 - Shared GameShell UI
✅ Completed — 2026-06-26

Files:

- src/features/games/ui/GameShell.tsx (new)
- src/features/games/ui/index.ts (exports `GameShell`)
- src/features/games/avalon/ui/AvalonGame.tsx (re-skinned onto `GameShell`)

Notes:

- `GameShell` owns: top bar (exit / timer chip / extra chips / chat button), chat open/close state, `useChat` hook, `ChatPanel`, Confetti on good-team win, and the pre-game loading screen
- Slots: `track`, `table`, `roleStrip`, `actionBar`, `loadingContent`
- `AvalonGame` now purely owns game logic (engine, bots, timer, phase effects) and fills `GameShell` slots — no layout/chat code remains in it
- Build clean; `verify:game-action` + `verify:realtime-game` all pass

### A5 - Simultaneous night-action helper (optional)
⚪ Not Started — extract Avalon's mission-card "collect private submissions →
resolve when all in" into a reusable helper for Werewolf's night.

## Phase B - Werewolf (Game #2)

### B1 - Werewolf engine
✅ Completed — 2026-06-26

Files:

- `src/features/games/werewolf/types.ts` — WerewolfRole, WerewolfTeam, WerewolfPublic, WerewolfPrivate, DeathRecord, SeerInspection
- `src/features/games/werewolf/setup.ts` — composition table (5–10p), buildPublicState, buildPrivateState (role shuffle, wolf vision), compositionFor
- `src/features/games/werewolf/phases.ts` — WEREWOLF_PHASES: lobby → roleReveal → night → dawn → dayDiscuss → dayVote → resolve → (loop / end)
- `src/features/games/werewolf/actions.ts` — WEREWOLF_ACTIONS: WEREWOLF_KILL, SEER_PEEK, DOCTOR_SAVE, LYNCH_VOTE, CONTINUE; resolveNight inline on last night actor; LYNCH_VOTE resolves lynch on last vote; patchPriv/patch helpers
- `src/features/games/werewolf/winConditions.ts` — village-wins (all wolves dead, checked first), wolves-parity (wolves ≥ villagers)
- `src/features/games/werewolf/bot.ts` — nextBotAction (per-role logic: wolf picks non-wolf target, seer inspects unchecked, doctor avoids repeat, day vote uses seer knowledge), nextAutoActor
- `src/features/games/werewolf/config.ts` — werewolfConfig: GameEngineConfig (id, minPlayers 5, maxPlayers 10, autoAdvancePhase true)
- `src/features/games/werewolf/index.ts` — barrel export
- `scripts/verify-werewolf.mjs` — 89-check static verify script (npm run verify:werewolf)

Notes:

- Night auto-advances to dawn via `nightResolved` flag set by `resolveNight`
- Vote auto-advances to resolve via `voteResolved` flag set by last LYNCH_VOTE
- Protection order: doctor shield applied before wolf kill; seer result from pre-kill snapshot
- Doctor cannot protect same player two nights in a row; self-protect allowed
- Wolves must choose the same target (validated); disagreement returns error
- Village-wins listed first so a tie-trigger always favours village
- CONTINUE from resolve increments dayCount and clears day state for next night

Follow-up:

- B2: register in server + client registries (done below)
- B3: WerewolfGame UI using GameShell

**Rules spec (source of truth for play behaviour):** `docs/games/werewolf-rules.md`
— mechanics, role abilities, night-resolution order, composition table, hidden-info
model, and the engine build checklist. Update that doc first, then the engine.

### B2 - Register Werewolf
✅ Completed — 2026-06-26

Files:

- `supabase/functions/_shared/games.ts` — werewolfEntry added to GAME_REGISTRY; privateActionTypes: [WEREWOLF_KILL, SEER_PEEK, DOCTOR_SAVE]; revealForPublic exposes role + team
- `src/features/games/registry.ts` — werewolf entry with werewolfConfig + placeholder AvalonGame UI (to be replaced in B3); config field typed GameEngineConfig<any, any>

Notes:

- Placeholder UI (AvalonGame) allows GamePage to route to werewolf without crashing; B3 replaces it with WerewolfGame

### B3 - Werewolf UI
✅ Completed — 2026-06-26

Files:

- `src/features/games/werewolf/ui/WerewolfTable.tsx` — player ring with night/day theming, dead-player ghost treatment (0.28 opacity + struck-through name + role-reveal/skull badge), private wolf-sees ring (red, wolves only), private seer-knowledge dots (green/red), night-actor ✓ badge, vote-tally number badges, interactive tap for night targets + day vote
- `src/features/games/werewolf/ui/WolfRoleCard.tsx` — role reveal strip for all 4 roles: Wolf shows pack; Seer shows accumulated inspection history (evil/not-evil per player, day counter); Doctor shows last-protected warning; Villager gets a motivational hint
- `src/features/games/werewolf/ui/WerewolfGame.tsx` — main component: phase-driven center content + action bar for all phases (roleReveal, night×4 roles, dawn, dayDiscuss, dayVote, resolve, end); day/night track strip with cycle counter + alive/dead counts; offline bot autoplay; online mode; phase-change toasts; error toasts; role open state; nightTarget + voteTarget selection state
- `src/features/games/werewolf/ui/index.ts` — barrel export
- `src/features/games/registry.ts` — werewolf entry updated to use `WerewolfGame` (placeholder replaced)

Notes:

- Night phases use deep indigo glow + moon overlay on ring center; dawn uses warm gold glow
- Phase centers carry the day/night emoji + cycle counter
- Night action bar is role-specific: Wolf confirms kill, Seer confirms inspect, Doctor confirms protect (repeat-protection warning inline), Villager waits
- Day vote: tap ring to select target → "โหวตประหาร" or "งดออกเสียง" buttons both present
- Resolve shows lynch result (with role reveal) or "ไม่มีเสียงข้างมาก" in center
- Selection state (nightTarget/voteTarget) resets on every phase change
- Build: 208 modules, passes tsc --noEmit

Follow-up:

- B4: Add Werewolf to the GAMES selector + rules screen

### B4 - Lobby + rules
✅ Completed — 2026-06-26

Files:

- `src/features/games/werewolf/rules.ts` — Werewolf rules: 4 roles, 6 how-to-play steps (from WEREWOLF_PHASES), composition 5–10p (from compositionFor), 2 win conditions, 4 tips
- `src/features/games/rules.ts` — added `werewolf: werewolfRules` to central registry
- `src/features/games/registry.ts` — replaced `rules: null` with `rules: werewolfRules`

Notes:

- Werewolf was already in GAMES catalog in data.ts; RulesSheet routes through getGameRules automatically
- Composition table maps evil = wolves, good = total − wolves
- tsc --noEmit clean, build 764ms

Follow-up:

- B5: Deploy + verify full Werewolf match on production

### B5 - Deploy + verify
✅ Completed 2026-06-26

Files:
- scripts/e2e-live-game.mjs (Werewolf section + playWerewolfToEnd)
- supabase/functions/game-start/index.ts (deployed, registry-driven)
- supabase/functions/game-action/index.ts (deployed, registry-driven)

Notes:
- `playWerewolfToEnd` drives full 2-human + 3-bot match: CONTINUE → night actions (role-based) → day vote → repeat
- Root bug fixed: game_private queries inside playWerewolfToEnd must filter by `room_id` — without it, multi-room players' rows collide in maybeSingle()
- 5 private actions redacted (WEREWOLF_KILL, SEER_PEEK, DOCTOR_SAVE payloads → { submitted: true })
- End-game reveal carries role + team for all 5 players
- `verify:live-game` now **46/46 pass** (was 43/44 pre-fix)

Follow-up:
- Epic 7 (Salem) is next

Suggested order: A1 → A2 → A3 (enablers, low–med risk) → A4 (GameShell, high
risk, verify Avalon) → B1 → … → B5.

---

### B6 - dayDiscuss countdown + Werewolf result screen
✅ Completed 2026-06-26

Files:
- `src/features/games/werewolf/ui/WerewolfGame.tsx` — countdown timer + urgency styling
- `src/styles/animations.css` — ww-timer-urgent keyframe
- `src/pages/GamePage.jsx` — Werewolf-specific handleEnd branch
- `src/pages/ResultPage.jsx` — WW_ROLES constant + Werewolf result JSX branch

Notes:
- dayDiscuss phase shows a 3:00 countdown (tabular-nums) in the ring center
- Color shifts: neutral → amber (≤60s) → red (≤15s) with pulse animation
- Track strip day-chip border/color also shifts to match urgency
- Host action bar button turns btn-evil at ≤15s; auto-fires CONTINUE at 0:00 via actRef
- Non-host sees "⚠️ กำลังเปิดโหวต..." at urgency
- GamePage.handleEnd branches on gameId==='werewolf': passes roles (dead from revealedRoles, all from private offline, inferred for remaining online players)
- ResultPage: Werewolf path shows shield/wolf banner, reasonTh, my-role card with ring-color, staggered role-reveal list with good/evil badge + loser overlay

Follow-up:
- XP calculation is +128 placeholder — wire real score from engine
- Server-side full role reveal at game end for accurate online result screen

---

### B7 - Advanced roles: Cupid (กามเทพ) + Spell-caster (ผู้ร่ายคำสาปใบ้) + result badge fix
✅ Completed 2026-07-01

Files:
- `src/features/games/werewolf/types.ts` — added `'cupid' | 'spellcaster'` to WerewolfRole; `DeathRecord.cause` gains `'heartbreak'`; `WerewolfPublic` gains `lovers`, `silenced`; `WerewolfPrivate` gains `silenceTarget`, `loverOf`
- `src/features/games/werewolf/setup.ts` — COMPOSITION table: spellcaster at 6+, cupid at 7+; state factories initialize new fields
- `src/features/games/werewolf/actions.ts` — CUPID_LINK + SILENCE actions; `applyLoverDeath` helper; lover deaths in resolveNight + LYNCH_VOTE; CONTINUE clears `pub.silenced`
- `src/features/games/werewolf/phases.ts` — CUPID_LINK + SILENCE in night allowedActions
- `src/features/games/werewolf/winConditions.ts` — `loversWin` condition (2 lovers are last 2 standing) checked before village/wolf
- `src/features/games/werewolf/bot.ts` — cupid bot (link 2 alive non-self players on night 1); spellcaster bot (silence first alive non-self)
- `src/features/games/werewolf/ui/WolfRoleCard.tsx` — role info for cupid + spellcaster; `loverOf` prop shows lover's name with "die together" warning
- `src/features/games/werewolf/ui/WerewolfGame.tsx` — cupid 2-target picker; spellcaster night UI; heartbreak death toasts; dawn/resolve centers handle new roles + multiple deaths
- `src/pages/ResultPage.jsx` — WW_ROLES gains cupid + spellcaster; badge fixed: `'ชาวบ้าน'/'หมาป่า'` → `'ฝ่ายดี'/'ฝ่ายชั่ว'`; lovers-win banner (`'💘 คู่รักชนะ'`)
- `src/pages/GamePage.jsx` — passes `conditionId` + `winners` to Werewolf result

Mechanic correction (2026-07-01) — Spellcaster silence:
- Silenced player **cannot speak/discuss** (dayDiscuss) but **can still vote** (dayVote)
- `actions.ts` — removed silenced block from LYNCH_VOTE.validate; quorum is all alive players
- `bot.ts` — silenced bot votes normally in dayVote
- `WerewolfGame.tsx` — dayDiscuss shows "🤫 [name] ถูกสาปใบ้ — พูดไม่ได้"; dayVote shows name label (no vote block)
- `src/features/lobby/components/ChatPanel.tsx` — `inputDisabled` prop: replaces input with warning banner
- `src/features/games/ui/GameShell.tsx` — `chatInputDisabled` prop passed to ChatPanel
- Silenced player cannot type in chat during dayDiscuss + dayVote
- `src/features/games/werewolf/rules.ts` — description + tip corrected
- `src/features/games/werewolf/ui/WolfRoleCard.tsx` — spellcaster desc corrected

Composition:
- 5p: 1 wolf, 1 seer, 1 doctor, 2 villagers (unchanged)
- 6p: 2 wolves, 1 seer, 1 doctor, 1 spellcaster, 1 villager
- 7p: 2 wolves, 1 seer, 1 doctor, 1 spellcaster, 1 cupid, 1 villager
- 8p+: more wolves/villagers, always seer + doctor + spellcaster + cupid

Follow-up:
- Lovers-win XP bonus
- Visual "💘" link indicator on the ring seats for the cupid player

---

### B8 - Deploy + verify advanced Werewolf roles
✅ Completed — 2026-07-01

Files:
- `supabase/functions/_shared/games.ts` — `CUPID_LINK` + `SILENCE` in `privateActionTypes`
- `supabase/functions/game-start/index.ts` — deployed (registry-driven, werewolf entry)
- `supabase/functions/game-action/index.ts` — deployed (registry-driven, werewolf entry)
- `scripts/e2e-live-game.mjs` — cupid + spellcaster handlers; silenced skip removed from dayVote

Notes:
- `verify:live-game` **46/46 pass** on production
- Silenced players vote normally in dayVote; night-action payloads for CUPID_LINK + SILENCE redacted in game_actions log

---

### B9 - Werewolf mobile UX/UI optimization pass
✅ Completed — 2026-07-13

Files:
- `src/components/layout/BottomBar.jsx`
- `src/features/games/ui/GameShell.tsx`
- `src/features/games/werewolf/ui/WerewolfGame.tsx`
- `src/features/games/werewolf/ui/WerewolfTable.tsx`
- `src/styles/components.css`

Notes:
- split the shared game shell into fixed top/status/action regions with a
  scrollable board + private-role area, keeping the current phase CTA visible
  when role details expand or action copy grows on short mobile screens
- player seats are now interactive only when the current player can legally
  select a target; actionable seats expose button semantics, focus treatment,
  and `aria-pressed` selection state
- target selection now has a clear ring + check marker; Cupid displays numbered
  first/second selections and highlights both linked targets
- standardized Werewolf phase hints and status-strip sizing for faster scanning
- fixed lobby player presence/bot badges painting through the ready/start footer
  by giving the shared bottom action bar its own layer below chat and overlays
- verified the role-reveal and night-target flow in the mobile browser with no
  console errors; `npm run build` and `tsc --noEmit` pass

Follow-up:
- repeat a device pass for Cupid's two-target interaction and day-vote phase

---

### B10 - Private wolf tally + coordinated voting bots
✅ Completed — 2026-07-13 (local implementation)

Files:
- `docs/games/werewolf-rules.md`
- `src/features/games/werewolf/types.ts`
- `src/features/games/werewolf/setup.ts`
- `src/features/games/werewolf/actions.ts`
- `src/features/games/werewolf/bot.ts`
- `src/features/games/werewolf/ui/WerewolfGame.tsx`
- `src/features/games/werewolf/ui/WerewolfTable.tsx`
- `scripts/verify-werewolf.mjs`

Notes:
- every living Werewolf now casts one independent night vote; plurality selects
  the victim and a tie means no attack
- live target counts are copied only into each living wolf's private state, so
  the pack can coordinate without exposing voter identity or leaking night
  targets through the public snapshot
- wolf players see vote-count badges on target seats, a pack-only tally summary,
  and submitted/required vote progress
- night wolf bots follow the current pack leader and share a deterministic target
  before votes exist
- day bots now form voting blocs from a shared daily suspicion ranking without
  blindly following a wolf-seeded public leader; Seer-known evil remains the
  highest priority and wolf votes stay on non-wolves
- `verify:werewolf` passes 99/99; build and TypeScript pass; behavioral smoke
  test produced coordinated night votes and a 5–1 daytime bloc in a 6-bot table

Follow-up:
- redeploy `game-start` and `game-action` Edge Functions before production use
- run a 9-player / 3-wolf two-device pass to verify private tally isolation and
  tie = no-kill resolution on Supabase

---

### B11 - Werewolf full-height mobile table layout
✅ Completed — 2026-07-13

Files:
- `src/features/games/ui/GameShell.tsx`
- `src/styles/components.css`

Notes:
- the game content region now uses a real flex column, allowing the player table
  to expand into available viewport space instead of leaving a blank area below
  the private role strip
- the role strip has its own non-shrinking row and the table keeps bottom
  clearance, preventing lower player seats and labels from overlapping it
- the game top bar now follows the device safe area instead of always reserving
  60px, recovering useful height in iOS Safari while retaining PWA notch spacing

Follow-up:
- repeat the Werewolf day-vote pass on a physical iPhone with 8-10 players

---

### B12 - Full-screen mobile chat + incoming message spacing
✅ Completed — 2026-07-13

Files:
- `src/features/lobby/components/ChatPanel.tsx`
- `src/features/lobby/components/ChatMessage.tsx`
- `src/styles/components.css`

Notes:
- room and in-game chat now fills the mobile viewport instead of stopping at a
  72% bottom sheet with the game still visible behind it
- desktop retains the existing capped bottom-sheet presentation
- incoming messages group avatar, sender name, timestamp, bubble, and reactions
  into one readable block with predictable wrapping for long text
- the chat stream and composer respect device safe areas and remain independently
  scrollable when the mobile keyboard reduces available height

Follow-up:
- verify composer positioning with the software keyboard open on iOS Safari

---

### B13 - Chat unread notification badge
✅ Completed — 2026-07-13

Files:
- `src/features/chat/hooks/useUnreadChat.ts`
- `src/features/chat/index.ts`
- `src/features/games/ui/GameShell.tsx`
- `src/pages/LobbyPage.jsx`
- `src/styles/components.css`

Notes:
- lobby and in-game chat icons show a top-right unread count for new messages
  from other players while chat is closed
- system notices and the current player's own messages do not increase the count
- opening chat marks the current stream as read; the badge caps at `99+` and
  respects reduced-motion preferences

Follow-up:
- add an optional notification sound preference after profile settings are in scope

---

# Epic 7 - ผู้ตรวจการ (Original Bluffing & Negotiation)

Status:
🟡 In Progress

## Features

### Game Rules + Information Model
✅ Completed — 2026-07-13

Files:
- `docs/games/checkpoint-rules.md`

Notes:
- original 3–6 player negotiation game with rotating Gatekeeper and merchants
- limited inspection seals force prioritization instead of checking everyone
- public Rumors keep every merchant engaged during another player's negotiation
- sealed offers are private, final once submitted, and enforced by the game engine
- rules v0.2, public/private/server state boundaries, actions, phases, and mobile
  UI direction are documented for playtesting
- Goods are now explicitly split into Legal and Illegal sets; Illegal goods have
  higher value and higher inspection penalties, while declarations may name
  only an exact Legal good

Follow-up:
- run a paper or facilitated playtest before balancing the goods deck
- validate the approved `ผู้ตรวจการ` title and night-market theme with players

### Interactive Mobile UI Concept
✅ Completed — 2026-07-13

Files:
- `src/features/games/checkpoint/ui/CheckpointGame.tsx`
- `src/features/games/checkpoint/ui/index.ts`
- `src/styles/components.css`
- `src/pages/ResultPage.jsx`

Notes:
- merchant and Gatekeeper perspectives are represented in a clickable concept
- phase controls cover packing, negotiation, decision, reveal, and market close
- Goods cards now label `ถูกกฎหมาย` or `ผิดกฎหมาย` directly and show baht value;
  declarations list only exact Legal goods

### Engine Types + Config
✅ Completed — 2026-07-13

Files:
- `src/features/games/checkpoint/types.ts`
- `src/features/games/checkpoint/goods.ts`
- `src/features/games/checkpoint/setup.ts`
- `src/features/games/checkpoint/phases.ts`
- `src/features/games/checkpoint/actions.ts`
- `src/features/games/checkpoint/config.ts`
- `src/features/games/checkpoint/winConditions.ts`

Notes:
- fixed game length at two Gatekeeper rotations for every player count
- client and Edge Functions share the same authoritative config

### Pack + Declaration
✅ Completed — 2026-07-13

Notes:
- merchants privately pack 1–3 cards and publicly declare one Legal good
- declaration count is derived from the crate and therefore always truthful

### Sealed Offers + Rumors
✅ Completed — 2026-07-13

Notes:
- offers are visible only to the current Gatekeeper until settlement
- each merchant may publish one Rumor per shift

### Inspection + Settlement
✅ Completed — 2026-07-13

Notes:
- Pass transfers the sealed offer and delivers the full crate
- Inspect handles truthful compensation, confiscation, printed penalties, and
  Rumor rewards in one authoritative action

### Scoring + Contracts
🟡 In Progress — 2026-11-20 (engine + UI done; Edge Functions redeployed and live-checked)

Files:
- `docs/games/checkpoint-rules.md` (v0.3: demand deck, Contract values, tie-breaks)
- `src/features/games/checkpoint/market.ts` (new: demand cards, Contracts, scoring helpers)
- `src/features/games/checkpoint/{types,setup,phases,actions,winConditions,bot,rules}.ts`
- `src/features/games/checkpoint/ui/CheckpointGame.tsx`, `src/styles/components.css`
- `src/features/games/runtime.ts`, `supabase/functions/_shared/games.ts`
- `src/pages/GamePage.jsx`, `src/pages/ResultPage.jsx`
- `scripts/verify-checkpoint.mjs`, `scripts/verify-game-client.mjs`

Notes:
- new `contract` phase (firstPhase): each player keeps 1 of 2 secret Contracts via
  `CHOOSE_CONTRACT` (private action type); public only shows who has chosen
- Market demand: 7-card deck, one card per shift drawn at shift change (never
  precomputed), reshuffled when empty; bonuses tracked as public `marketBonus`,
  penalty increases on Weapons Crackdown / Counterfeit Alert, Honest Trade +1 baht from the bank
- final score = cash + delivered value + Market bonus + completed Contract value;
  Contracts revealed in public `contractResults` only at game end
- ties: most delivered Legal goods → most cash → shared
- bots choose a Contract and favour Contract/demand goods when packing
- fix: bot offers are capped at the bot's cash (bigger penalties made a 6-player
  stall reproducible in ~4.5% of games)
- UI reads all new fields defensively, so it still renders against the old server

Verified live (2026-11-20, after redeploying `game-start` + `game-action`):
- `npm run verify:live-game`: 46/46 (Avalon + Werewolf unaffected)
- one-off Checkpoint smoke on production (3 seats, 12/12):
  - game starts in `contract` with a demand card
  - each seat reads only its own private row
  - an un-dealt contract is rejected (400)
  - public data has no contract ids while someone is still choosing
  - the game moves to `pack` once everyone has chosen
  - `CHOOSE_CONTRACT` payloads are logged as `{ submitted: true }`
- the smoke covered the contract phase only. A full live match is now covered by
  `verify:live-game` (see Bots + Online Verification below)

Not verified:
- browser check of the contract screen, demand strip and result page (light + dark, phone width)
- two-browser online Checkpoint game in real browsers (result page with contracts);
  the engine side of a full online match is verified by `verify:live-game`

Follow-up:
- two-browser online Checkpoint game in real browsers
- ~~add Checkpoint to `scripts/e2e-live-game.mjs`~~ done 2026-11-20
- Supabase CLI 2.107.0 on macOS could not read its own Keychain login; deploy
  worked with `SUPABASE_ACCESS_TOKEN` set for the session
- balance playtest of Contract values and demand bonuses

### Bots + Online Verification
🟡 In Progress — 2026-07-13

Files:
- `src/features/games/checkpoint/bot.ts`
- `scripts/verify-checkpoint.mjs`
- `supabase/functions/_shared/games.ts`
- `supabase/functions/game-start/index.ts`

Notes:
- merchant bots pack, bluff, spread Rumors, and calculate sealed offers
- Gatekeeper bots prioritize Rumors and low offers without reading crate contents
- game-start resolves opening bot actions before persistence so a human
  Gatekeeper cannot deadlock while waiting for bot merchants
- runtime verifier completed a three-player game in 54 actions across 6 shifts
- 2026-11-20: `scripts/e2e-live-game.mjs` now plays a full 3-player Checkpoint match
  (2 humans + 1 bot) against the deployed Edge Functions. It checks:
  - the game starts in `contract` with a demand card
  - RLS limits each player to their own private row
  - an un-dealt contract is rejected
  - no contract id appears in public data before the end
  - exactly 6 shifts, and the `checkpoint-wealth` win condition
  - every player's contract is revealed at the end and the guest can read them
  - the final score recomputed from public data matches the server
  - `CHOOSE_CONTRACT` / `SUBMIT_CRATE` / `SUBMIT_OFFER` are redacted in `game_actions`
  First run: 61/61 (15 new Checkpoint checks)
- the harness mirrors goods values and contract ids from `goods.ts` / `market.ts`; a
  change there must be copied (the final-score check fails loudly otherwise)

Follow-up:
- complete multi-device private-state and reconnection verification in real browsers
  (Edge Functions are deployed automatically since CI/CD)

---

# Epic 8 - Salem-inspired Social Deduction

Status:
🔒 Future

## Features

### Role Cards

### Accusation

### Trial

### Evidence

### Witch Detection

---

# Epic 9 - User Accounts

Status:
🔒 Future

### Google Login

### Email Login

### User Profile

### Avatar Upload

---

# Epic 10 - Friends

Status:
🔒 Future

### Add Friend

### Friend List

### Invite Friend

### Online Status

---

# Epic 11 - Match History

Status:
🔒 Future

### Match Records

### Statistics

### Win Rate

### Favorite Game

---

# Epic 12 - Additional Games

Status:
🔒 Future

### Exploding Kittens

### Dixit

### Coup

### Werewolf

### Istanbul

---

# Current Priority

1. Epic 2 - Guest Identity
2. Epic 3 - Local Chat
3. Epic 4 - Realtime Multiplayer
4. Epic 5 - Generic Game Engine
5. Epic 6 - Avalon MVP

Do not work on future epics until Avalon MVP is fully playable.
