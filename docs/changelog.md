# Changelog

## 2026-06-18 — Feature: Account sheet (edit profile + link + logout)

Upgraded the profile sheet into a fuller "บัญชีของฉัน" account screen, ported
from the updated prototype's `screen-account`.

Completed:

- **EditProfileSheet** now shows a live avatar/name preview + account status
  badge ("🎭 บัญชีผู้เยี่ยมชม"), a 6-col mascot grid with a check marker, an
  account-linking section (Google/Apple → "เร็วๆ นี้" toast until Epic 9), and a
  **ออกจากระบบ** (logout) action. Nickname cap aligned to 16 chars (matches Welcome).
- **Logout** (`useGuest.logout`): signs out of Supabase, clears the local guest,
  and reloads into a fresh un-onboarded state (Welcome).
- **ProfilePage**: ⚙️ settings button, avatar, and bio line now open the account
  sheet; bio reflects the guest status ("แตะเพื่อผูกบัญชี").
- `clearGuest()` added to guest storage.

OAuth linking stays a preview (no fake provider is persisted) so account status
is honest until real sign-in lands in Epic 9.

Files:

- src/features/guest/components/EditProfileSheet.tsx (account sheet)
- src/features/guest/hooks/useGuest.ts (`logout`), stores/guestStorage.ts (`clearGuest`)
- src/app/App.jsx (onLogout + showToast wired), src/pages/ProfilePage.jsx

Follow-up:

- wire real Google/Apple linking via `linkGoogle()` (Epic 9)

## 2026-06-18 — Feature: Welcome / onboarding entry + brand logo

Added a first-run Welcome screen (ported from the updated prototype) and switched
the logo to the new brand artwork.

Completed:

- **WelcomePage** (`src/pages/WelcomePage.jsx`): two-step entry — (1) sign in with
  Google/Apple **or** continue as Guest; (2) guest setup: pick a mascot + nickname
  (live avatar preview, 16-char cap) then "เริ่มเล่น". OAuth is previewed (shows a
  "เร็วๆ นี้" toast) until accounts land in Epic 9; the guest path is fully wired.
- **Onboarding flag**: `GuestProfile.onboarded` added. Brand-new guests start
  `false` → land on Welcome; returning guests (stored profile, or a Supabase
  profile on a new device) are `onboarded:true` and skip straight to Home.
- **App routing**: initial screen is `welcome` when not onboarded; a returning
  Supabase account that resolves async redirects off Welcome to Home.
- **Logo**: now image-based with `variant` (`illustration` / `wordmark` /
  default emblem+text), using `src/assets/brand/logo-*.webp`.
- **Favicon**: `public/favicon.webp` (+ apple-touch-icon) wired in `index.html`.

Files:

- src/pages/WelcomePage.jsx (new)
- src/app/router.jsx, src/app/App.jsx (welcome route + onboarding handlers)
- src/components/ui/Logo.jsx (image variants)
- src/features/guest/types/index.ts, stores/guestStorage.ts, hooks/useGuest.ts
  (`onboarded` flag + reconciliation)
- src/assets/brand/logo-illustration.webp, logo-wordmark.webp (new)
- public/favicon.webp (new), index.html

Follow-up:

- wire real Google/Apple OAuth (Epic 9) into `onOAuth`
- URL `/join/:code` deep link still lands on Welcome for first-run users

## 2026-06-18 — Fix: lobby chat 400s + host identity after Supabase sync

Epic:
Epic 4.5 - Supabase Backend (Phase 4.5.2 — Rooms + Realtime)

- chat keyed off the optimistic seed id (`room_<ts>_<rand>`) before `joinRoom`
  resolved → `chat_messages.room_id` (uuid) rejected it (400) and `send_system`
  fired before the room existed. `useSupabaseChat` now no-ops until `roomId` is a
  real UUID.
- `LobbyPage` used `player.id` (local) for host/ready checks, but Supabase stores
  `auth.uid()` — host silently lost controls after sync. `useRealtimeRoom` now
  exposes the resolved `meId`; the lobby uses it. Welcome notice seeds after sync.
- Sheet overlay `absolute inset-0` → `fixed inset-0` (popup invisible after the
  device-frame removal); `joinRoom`/`fetchRoom` now log errors instead of swallowing.

Files:

- src/features/chat/hooks/useChat.ts, src/features/room/hooks/useRealtimeRoom.ts
- src/pages/LobbyPage.jsx, src/components/ui/sheet/sheet.tsx
- src/services/supabase/rooms.ts

## 2026-06-18 — Fix: production responsive layout (remove device frame)

Epic:
Epic 4.5 - Supabase Backend (Phase 4.5.4 — Deploy)

Removed the prototype phone/device frame so TangWong renders as a real mobile
web app on Safari and Chrome instead of a phone mockup inside the phone screen.

Completed:

- `index.html`: replaced `#stage` + `#device-scaler` with a plain `#root` mount
- `main.jsx`: mount to `#root`
- `App.jsx`: removed `IOSDevice` wrapper, `scale` state, resize `useEffect`, and
  the `transform:scale(…)` wrapper div — app content renders directly
- `tokens.css`: removed `#stage`/`#device-scaler` rules; `.app` gains
  `max-width:480px; margin:0 auto; min-height:100dvh` (centred mobile shell)
- `reset.css`: `overflow:hidden` → `overflow-x:hidden` (allow real scroll);
  `height:100%` → `min-height:100dvh` on html/body
- `layout.css`: `.screen` changed from `position:absolute;inset:0` to
  `flex:1; position:relative` (fills flex-column parent instead of overlapping)
- `components.css`: `.tabbar` → `position:fixed; left:50%;
  transform:translateX(-50%); bottom:calc(22px + env(safe-area-inset-bottom));
  width:calc(min(100vw,480px)-28px)` — anchors to real viewport bottom
- `TabBar.jsx`: bar variant updated with centred width + safe-area paddingBottom

Files:

- index.html, src/main.jsx
- src/app/App.jsx, src/app/TabBar.jsx
- src/styles/tokens.css, src/styles/reset.css, src/styles/layout.css,
  src/styles/components.css

## 2026-06-18 — Fix: Vercel build (darwin-arm64 native dep + Node 20)

Resolved `npm install` failure on Vercel (Linux x64):

- Removed `@tailwindcss/oxide-darwin-arm64` from `devDependencies` — it is a
  Mac-ARM-only native binary that blocks install on Linux
- Added `.nvmrc` pinning Node 20 to satisfy engine requirements from typescript
  and supabase-js transitive deps

Files: `package.json`, `package-lock.json`, `.nvmrc`

## 2026-06-18 — Fix: room join (auth UID race + kick detection)

Resolved two bugs that put players in separate rooms when using Supabase transport:

1. Race condition — `joinRoom` was called before the anonymous Supabase session
   was established, so `auth.uid()` was null → `join_room` RPC threw
   "not authenticated"; the error was silently swallowed; each client stayed on
   its own local seed room.
2. ID mismatch — `player.id` is a locally-generated UUID (localStorage) while
   Supabase stores `auth.uid()` as `player_id`; kick detection compared
   `room.players[].id` (Supabase UIDs) against `meId` (local UUID) → always
   false → player was immediately ejected back to Home.

Fix: `useSupabaseRoom` now resolves `auth.uid()` via `supabase.auth.getSession()`
+ `onAuthStateChange`, delays `joinRoom` until `authUid` is set, and guards kick
detection behind `synced=true` (first real DB snapshot).

Files: `src/features/room/hooks/useRealtimeRoom.ts`

## 2026-06-18 — Deploy readiness (Vercel + Supabase + GitHub)

Epic:
Epic 4.5 - Supabase Backend (Phase 4.5.4 — Deploy)

Prepares the project for its first GitHub → Supabase → Vercel deployment. No new
features.

Completed:

- verified `npm run build` + `npx tsc --noEmit` pass
- `vercel.json` — Vite framework preset (build `npm run build`, output `dist`) +
  SPA catch-all rewrite so deep links / refreshes (`/join/:code`, `/lobby`, …)
  resolve to `index.html` instead of 404
- `DEPLOYMENT.md` — full guide: GitHub setup, Supabase project + anonymous auth,
  migration order (0001→0002 with a realtime-publication check), `.env.local`,
  Vercel env vars, and a pre/post-deploy checklist incl. a two-device smoke test
- confirmed `.env.example` is complete and matches the env the app reads
  (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_USE_SUPABASE`)
- migrations 0001 + 0002 documented in `supabase/README.md` and `DEPLOYMENT.md`

Honest caveat (documented, not a blocker):

- the app uses an in-memory screen router, so `/join/:code` loads the SPA but
  does not yet auto-join from the URL — wiring that is a future feature; the
  rewrite is in place so the route won't 404 once it lands

Files:

- vercel.json (new), DEPLOYMENT.md (new)
- docs/roadmap.md (Phase 4.5.4 → deploy-ready)

## 2026-06-18 — Epic 4.5.2: verification checklist

Added a detailed two-device verification checklist for the Supabase rooms/chat/
realtime layer (docs/verify-4.5.2.md) to run before marking 4.5.2 Completed and
before starting game sync (4.5.3). No implementation code.

Covers: project setup (anon auth, migrations 0001+0002 in order, realtime
publication, RLS active, RPC present + SECURITY DEFINER), local env + safe
fallback, two-device functional cases (create / join-by-code / join-by-link /
ready / chat / reactions / settings / kick / transfer host / add bot / leave /
rejoin), presence (close tab / refresh / reconnect / stale / heartbeat),
security/RLS (no direct table writes, non-member can't read, RPC-only mutations,
chat insert + reaction policy), failure cases (invalid code, full room, kicked
rejoin, non-host guards, missing env), and acceptance criteria split into
must-pass / allowed-follow-up / must-block-4.5.3.

Files:

- docs/verify-4.5.2.md (new)
- docs/roadmap.md (link the checklist as the 4.5.2 gate)

## 2026-06-18 — Epic 4.5.2: Rooms + chat over Supabase (behind a flag)

Epic:
Epic 4.5 - Supabase Backend (Phase 4.5.2 — Rooms + Realtime)

Status: implemented; pending live verification with real Supabase keys. The
default transport stays cross-tab, so the working lobby is unchanged until
`VITE_USE_SUPABASE=true`.

Completed:

- `0002_rooms_chat.sql` — `rooms`, `room_players`, `chat_messages` with RLS
  (members read), realtime publication, and the **authority layer**: every write
  is a `SECURITY DEFINER` RPC (`join_room`, `leave_room`, `set_ready`,
  `update_settings`, `kick_player`, `transfer_host`, `add_bot`, `touch_presence`,
  `toggle_reaction`, `send_system`). Clients never write these tables directly;
  the one exception is members inserting their own user chat message (RLS-checked)
- name + mascot denormalised onto `room_players` so clients can show opponents
  without reading owner-only `profiles`
- `roomService` / `chatService` — async, server-authoritative; assemble the same
  `SyncedRoom` / `ChatMessage` shapes; realtime via Postgres changes
- `useRealtimeRoom` / `useChat` split into Supabase + cross-tab implementations,
  selected by `useSupabaseTransport`; same public surface so no caller changed
  (LobbyPage just passes the room code for host system messages)

Files:

- supabase/migrations/0002_rooms_chat.sql (new), supabase/README.md
- src/services/supabase/{rooms,chat}.ts (new), client.ts (`useSupabaseTransport`), index.ts
- src/features/room/hooks/useRealtimeRoom.ts, src/features/chat/hooks/useChat.ts
- src/pages/LobbyPage.jsx

Next:

- live test on two devices; presence pruning on the server; Phase 4.5.3 (game
  sync + hidden info via Edge Function authority)

## 2026-06-18 — Epic 4.5.1: Supabase foundation + anonymous auth

Epic:
Epic 4.5 - Supabase Backend (Phase 4.5.1 — Foundation + Auth)

Direction (locked):
Friends play across devices via **Supabase + Vercel** (free tier). Long-term
authority is **Supabase Edge Functions + Postgres + RLS** — clients never write
game state directly. Edge Functions are not built yet (Phase 4.5.3).

Completed:

- `@supabase/supabase-js` added; shared client created only when env is present
  (`isSupabaseEnabled`) so the app still runs offline on the local guest
- anonymous auth (`ensureSession` → `signInAnonymously`) gives every player a
  stable, cross-device `auth.uid()` with no login wall
- `profiles` table (id, nickname, mascot) + RLS (owner-only) — `0001_profiles.sql`
- guest identity migration: the local `tw_guest` is upgraded onto the real uid on
  first sign-in; a returning account's stored profile takes over nickname/mascot;
  edits sync back to the backend best-effort
- `linkGoogle()` seam in place for the later account upgrade (not wired into UI)
- env setup: `.env.example`, `src/vite-env.d.ts`

Scope guard (intentionally deferred):

- no Edge Functions yet · no room/game tables yet — schema kept minimal and
  evolves incrementally

Files:

- src/services/supabase/{client,auth,profiles,index}.ts (new)
- src/features/guest/hooks/useGuest.ts (auth-aware migration + `ready`)
- src/vite-env.d.ts (new), .env.example (new)
- supabase/migrations/0001_profiles.sql (new), supabase/README.md (new)
- docs/supabase-plan.md (new), docs/roadmap.md (Epic 4.5)

Next:

- Phase 4.5.2 — rooms + chat over Supabase (RPC + Realtime, behind `VITE_USE_SUPABASE`)

## 2026-06-17 — Game rules sheet (from engine) + add-bot UI polish

Completed:

- **RulesSheet** — slide-up rules per game: objective, team composition,
  roles, how-to-play, win conditions, tips. Content is derived from the real
  engine (`getGameRules`) — player counts, roles, quest sizes, phase flow, and
  win conditions all come from Avalon's config/setup, so rules can't drift from
  gameplay. Games without an engine show "กติกากำลังจะมา"
- "อ่านกฎ" entry points: a book button on game cards (Games tab) and a chip in
  the lobby game selector; only shown for games that have rules
- add-bot UI now matches the prototype: an inline dashed **tile** inside the
  grid layout, and a full-width dashed **button** under the list / circle layouts

Files:

- src/features/games/rules.ts (new — registry + types), src/features/games/avalon/rules.ts (new)
- src/features/games/avalon/setup.ts (compositionFor)
- src/features/games/ui/RulesSheet.tsx (new), src/features/games/ui/index.ts (new)
- src/components/ui/Icon.jsx (book icon), GameCard.jsx + index.d.ts (onRules)
- src/features/lobby/components/AddBotTile.tsx (new), PlayerGrid.tsx (extra slot), GameSelector.tsx (onRules)
- src/pages/GamesPage.jsx, src/pages/LobbyPage.jsx

## 2026-06-17 — Lobby: add bots + prototype UI sync

Matches the updated prototype lobby.

Completed:

- **Add bot** — host-only "เพิ่มบอท" button adds a filler bot to the room (synced,
  always ready, distinct mascot from BOT_POOL); disabled when the room is full
- bots are real room members: shown with a 🤖 avatar badge + "บอท · พร้อมเสมอ",
  exempt from presence pruning, and removable via the player menu ("นำบอทออก")
- player actions menu hides "transfer host" for bots
- start gate now needs the minimum players AND everyone ready; the button shows
  "ต้องการอีก X คน" / "รอพร้อม (n/m)" / "เริ่มเกม" with a matching hint
- "ต้องการอีก X คน — เพิ่มบอทเพื่อเติมที่นั่ง" banner + accent count when short
- voice channel restyled to the inline muted-mic + "🔜 เร็วๆ นี้" treatment
- the in-lobby roster (incl. bots) now feeds the Avalon game directly

Files:

- src/types/index.ts (Player.bot), src/data.ts (BOT_POOL)
- src/components/ui/avatar-legacy.jsx + index.d.ts (bot badge)
- src/features/room/stores/roomRealtime.ts (addBot, bot prune/online exempt)
- src/features/room/hooks/useRealtimeRoom.ts (addBot)
- src/features/room/components/PlayerActionsMenu.tsx (isBot)
- src/features/lobby/components/{LobbyFooter,PlayerListItem,PlayerCircle}.tsx
- src/components/game/PlayerSeat.tsx, src/pages/LobbyPage.jsx

## 2026-06-17 — Epic 6: Avalon playable (Phase A — bot-driven, single client)

Epic:
Epic 6 - Avalon MVP

Completed:

- the full loop is playable: Home → Lobby → Avalon → Result; the human plays
  their seat, bots auto-play the rest (🤖 toggle drives every seat)
- `AvalonGame` on `useGameEngine(avalonConfig)`: per-phase center + action bar,
  round table, secret role strip, quest track, in-game chat
- `AvalonTable` (ring seats, leader crown, team/vote badges, tap-to-select) +
  `RoleRevealCard` (tap to view role, side, and role-specific vision)
- per-phase timer that auto-acts for an idle human
- bots (`nextBotAction` / `nextAutoActor`) play every role with sensible heuristics
- GamePage rebuilt: bot-pads short rosters so a solo player runs a full match;
  maps `WinResult` → ResultPage
- ResultPage now reveals real players/roles and reads the winner from the payload
- engine: `redactStateFor` (hidden-info view, for Phase B) + `gamePlayerToPlayer`

Verified:

- 240 bot-driven games (5–10 players) all reached a winner with no stalls;
  every win path observed (3 fails, assassin hit, assassin miss)

Files:

- src/features/games/avalon/bot.ts (new)
- src/features/games/avalon/ui/{AvalonGame,AvalonTable,RoleRevealCard,index}.tsx (new)
- src/features/games/engine/view.ts (new), engine/playerUtils.ts, engine/index.ts
- src/pages/GamePage.jsx (rebuilt), src/pages/ResultPage.jsx, src/app/router.jsx

Next (Phase B):

- host-authoritative realtime sync (per-player redaction) for true multiplayer

## 2026-06-17 — Epic 6: Avalon game engine (logic)

Epic:
Epic 6 - Avalon MVP

Structure:
`src/features/games/` is now one folder per game, with `engine/` as the shared
core. Added `src/features/games/avalon/`.

Completed (pure logic, no UI yet):

- `GamePhase` widened with a `string & {}` escape hatch so games declare their
  own phases (Avalon: roleReveal → teamProposal → teamVote → mission →
  questReveal → assassinate → end)
- role composition + shuffled assignment per player count (5–10); per-role vision
  (Merlin sees evil except Mordred; Percival sees Merlin + Morgana; evil see each other)
- quest team-size tables; quest 4 requires 2 fails at 7+ players
- actions: NOMINATE_TEAM, VOTE_TEAM (strict majority), PLAY_MISSION_CARD
  (team-only, good can't fail), CONTINUE (host), ASSASSINATE
- win conditions: 3 failed quests, 5 rejected proposals, assassin kills Merlin;
  good wins only if the assassin misses after 3 successes
- verified by a scripted playthrough (role counts, vision, full loop, both
  evil-win paths)

Files:

- src/features/games/avalon/{types,setup,phases,actions,winConditions,config,index}.ts (new)
- src/features/games/index.ts (new barrel)
- src/features/games/engine/types.ts (GamePhase widened)

Next:

- GamePage rebuilt on the engine + realtime sync + hidden-info per-player views

## 2026-06-17 — Player actions menu: transfer host + kick

Epic:
Epic 4 - Realtime Multiplayer (Host Controls)

Completed:

- `DropdownMenu` — reusable, dependency-free popover (kebab trigger; closes on
  outside-click or Escape); added a `more` kebab icon
- `PlayerActionsMenu` — host-only ⋯ menu per player: 👑 transfer host · 🚫 kick
- `transferHost` — added to the room store + `useRealtimeRoom`; the crown (and the
  menus) move to the new host across all clients instantly
- Player components now take a generic `actions` / `renderActions` slot instead of
  a single `onKick` prop — the kebab replaces the bare ✕ across list/grid/circle
- Menu shown only for other players (not the host, not yourself), pre-start only

Files:

- src/components/ui/Icon.jsx (more icon)
- src/components/ui/dropdown-menu/DropdownMenu.tsx (new)
- src/features/room/components/PlayerActionsMenu.tsx (new)
- src/features/room/stores/roomRealtime.ts (transferHost)
- src/features/room/hooks/useRealtimeRoom.ts (transferHost)
- src/components/game/PlayerSeat.tsx
- src/features/lobby/components/PlayerList.tsx, PlayerListItem.tsx, PlayerGrid.tsx, PlayerCircle.tsx
- src/pages/LobbyPage.jsx

## 2026-06-17 — Host controls: kick player + start gate

Epic:
Epic 4 - Realtime Multiplayer (Host Controls)

Completed:

- Start gate — the Start button is disabled until the room has at least the
  game's `minPlayers`, even when everyone is ready; the footer shows the hint
- Kick player — host-only ✕ on each player across list / grid / circle layouts
  (hidden for the host and yourself); removes the player and broadcasts
- Kicked client — `useRealtimeRoom` fires `onRemoved` when the player is no
  longer a member; LobbyPage toasts and sends them home
- Solves the "stranger joined the room I made for friends" case

Files:

- src/features/room/hooks/useRealtimeRoom.ts (kick, onRemoved)
- src/features/lobby/components/LobbyFooter.tsx (start gate)
- src/components/game/PlayerSeat.tsx
- src/features/lobby/components/PlayerListItem.tsx
- src/features/lobby/components/PlayerList.tsx
- src/features/lobby/components/PlayerGrid.tsx
- src/features/lobby/components/PlayerCircle.tsx
- src/pages/LobbyPage.jsx

## 2026-06-17 — Epic 4: Realtime Multiplayer (cross-tab transport)

Epic:
Epic 4 - Realtime Multiplayer

Approach:
Transport-agnostic realtime layer with a cross-tab adapter (BroadcastChannel +
shared localStorage room). Socket.io-ready: the same `RealtimeService` seam will
back a Node server later. Open two tabs to test live sync.

Completed:

- `createChannel(name)` — BroadcastChannel wrapper with a no-op fallback
- `SyncedRoom` / `RealtimeService` — the transport contract (room + presence)
- `roomRealtime` store — shared room in localStorage: create/join/leave, host
  handoff, ready, settings, deterministic id (`room_<code>`), stale-member prune
- `useRealtimeRoom(seed, player)` — joins + syncs the room across tabs, presence
  heartbeat (3s), exposes `setReady` / `updateSettings` / `leave`
- `useChat` — now syncs messages/system/reactions across tabs for the same room
- LobbyPage — mock `PLAYERS` + hardcoded ready removed; renders the live room
  (real join/leave/ready/settings/chat)
- `ComingSoon` wrapper — dims unbuilt features with a "เร็วๆ นี้" badge; applied
  to the lobby voice channel
- buildRoomFromCode — joiner becomes host when seeding a brand-new room

Deferred:

- Socket.io Node server (interface seam is in place)
- Deep network-drop reconnect (rejoin + history restore works today)

Files:

- src/services/realtime/channel.ts (new)
- src/services/realtime/types.ts (new)
- src/services/realtime/index.ts (new)
- src/features/room/stores/roomRealtime.ts (new)
- src/features/room/hooks/useRealtimeRoom.ts (new)
- src/features/chat/hooks/useChat.ts
- src/components/ui/coming-soon/ComingSoon.tsx (new)
- src/features/room/roomUtils.ts
- src/pages/LobbyPage.jsx

## 2026-06-17 — Room size follows the selected game

Change:
Create Room — max-player options are now driven by the chosen game's range.

Completed:

- `Game.minPlayers` / `Game.maxPlayers` added to the game type + catalog
  (Avalon 5–10, Werewolf 6–16, Coup 2–6, Dixit 3–8)
- CreateRoomSheet builds the room-size chips from the selected game's range
  instead of a fixed `[5..10]` list
- switching games re-clamps the chosen size into the valid range (defaults to cap)
- label shows the active game's range hint (e.g. "Coup · 2–6 คน")

Files:

- src/types/index.ts
- src/data.ts
- src/features/room/components/CreateRoomSheet.tsx
- docs/feature-list.md
- docs/roadmap.md

## 2026-06-16 — Epic 5: Generic Game Engine

Epic:
Epic 5 - Generic Game Engine

Completed:

- `GameEngine<TPublic, TPrivate>` — pure immutable state machine; never mutates state in place
- `GameState<TPublic, TPrivate>` — room state, public state, per-player private state, event log, winner
- `GameEngineConfig` plug-in interface — each game supplies phases, actions, win conditions, initial state factories
- `ActionDef` — `{ validate, handle }` per action type; `handle` receives emit callback for side-effect-free event emission
- `WinCondition` — type-safe checker returning `WinResult | null`; runs after every dispatched action
- `DEFAULT_PHASES` — 6-phase canonical flow: lobby → setup → discussion → voting → resolution → end
- `composeValidators(...)` — combinator for building validation chains; stops at first failure
- `shouldAutoAdvance()` — checks `all-voted` and `condition` triggers for automatic phase transitions
- `useGameEngine(config)` — React hook: `start`, `dispatch`, `transitionTo`, `isPlaying`, `phase`, `winner`, `engine`
- `playerUtils` — `playerToGamePlayer`, `roomToRoomState`, `requirePlayer` bridge UI types → engine types

Files:

- src/features/games/engine/types.ts (new)
- src/features/games/engine/events.ts (new)
- src/features/games/engine/phases.ts (new)
- src/features/games/engine/validation.ts (new)
- src/features/games/engine/engine.ts (new)
- src/features/games/engine/useGameEngine.ts (new)
- src/features/games/engine/playerUtils.ts (new)
- src/features/games/engine/index.ts (new)

Notes:

- Engine is fully generic — Avalon, Salem, Sheriff, etc. each supply their own TPublic/TPrivate types
- Immutability enforced by convention — all handlers must return new state objects
- `alwaysValid` stub available for placeholder actions during game development
- `GameMasterConfig.autoAdvancePhase` enables automatic transitions (e.g. auto-resolve after all players vote)
- Engine has zero React dependency except in `useGameEngine.ts` — safe to unit-test without a DOM

---

## 2026-06-16 — Epic 2: Guest Identity

Epic:
Epic 2 - Guest Identity

Completed:

- Guest profile (playerId, nickname, mascot)
- localStorage persistence via `tw_guest` key
- `useGuest` hook with lazy init and stable update callback
- `EditProfileSheet` — nickname input + 14-mascot visual grid picker
- Room integration — create/join rooms use guest player identity as host/joiner
- CreateRoomSheet default room name derived from guest nickname
- ResultPage MVP card uses guest player
- Removed all hardcoded `ME` imports from pages

Files:

- src/features/guest/types/index.ts (new)
- src/features/guest/stores/guestStorage.ts (new)
- src/features/guest/hooks/useGuest.ts (new)
- src/features/guest/components/EditProfileSheet.tsx (new)
- src/features/guest/index.ts (new)
- src/app/App.jsx (useGuest wired, editProfileOpen state, ME removed)
- src/app/router.jsx (guest + player + openEditProfile threaded)
- src/pages/HomePage.jsx (player prop, avatar tap opens EditProfileSheet)
- src/pages/ProfilePage.jsx (guest identity displayed, แก้ไข button wired)
- src/pages/ResultPage.jsx (player prop, ME removed)
- src/features/room/components/CreateRoomSheet.tsx (player prop, ME removed)

Notes:

- Guest identity survives page refresh via localStorage
- `guestToPlayer()` converts GuestProfile → Player for backward compat with existing Avatar/PlayerSeat components
- EditProfileSheet is rendered at App level — accessible from HomePage avatar, ProfilePage แก้ไข button
- playerId is stable once generated (never regenerated on subsequent loads)
- Storage write errors (private browsing, quota) are silently ignored — app stays functional
- `ME` still exists in data.ts as part of the demo PLAYERS roster but is no longer used as the current user's identity
