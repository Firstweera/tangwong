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

---

# Epic 3 - Local Chat

Goal:
Make lobby chat functional.

Status:
⚪ Not Started

## Features

### Send Message

### System Message

### Emoji Reactions

### Timestamps

### Chat Store

---

# Epic 4 - Realtime Multiplayer

Goal:
Turn TangWong into a real multiplayer platform.

Status:
⚪ Not Started

## Backend

### Socket.io Server

### Room Service

### Connection Management

### Reconnect Logic

---

## Realtime Features

### Player Join Sync

### Player Leave Sync

### Ready Sync

### Chat Sync

### Room Setting Sync

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
⚪ Not Started

## Setup

### Role Assignment

### Team Assignment

---

## Gameplay

### Team Selection

### Voting

### Mission

### Success/Fail

### Assassin Phase

---

## End Game

### Reveal Roles

### Winner Screen

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
