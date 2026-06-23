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
🟡 In Progress — 2026-06-18 (Phase 4.5.1 done; rooms/realtime next)

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

🟡 In Progress — 2026-06-23 (B2/B3/B5 deployed + runtime-verified on production; B6/B7 next)

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

Next: B6 (reconnect + end-game reveal verification path).

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

# Epic 6 - Avalon MVP

Goal:
First playable game.

Status:
🟡 In Progress — 2026-06-17 (engine + Phase A UI playable; realtime sync = Phase B)

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

# Epic 7 - Salem 1692

Status:
🔒 Future

## Features

### Role Cards

### Accusation

### Trial

### Evidence

### Witch Detection

---

# Epic 8 - Sheriff

Status:
🔒 Future

## Features

### Goods

### Bagging

### Declaration

### Inspection

### Bribery

### Scoring

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
