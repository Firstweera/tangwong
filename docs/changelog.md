# Changelog

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
