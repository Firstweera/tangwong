# Game Engine

Owns: **the game model** — state shape, game config, phases, actions, validation, win
conditions, bots, hidden-information rules, GameClient and transports, timers, and the
checklist for adding a game. Where files live is [architecture.md](architecture.md);
the server side is [supabase.md](supabase.md).

---

## 1. State Model

`GameState<TPublic, TPrivate>` (`engine/types.ts`):

| field | visible to | holds |
| ----- | ---------- | ----- |
| `room` | everyone | roster (`GamePlayer[]`), host, game id |
| `public` | everyone | `phase`, `turn`, `round`, `activePlayerId`, game `data: TPublic` |
| `private[playerId]` | **that player only** | `data: TPrivate` — role, hand, sealed offers, night info |
| `events` | everyone | `GameEvent[]` log |
| `winner` | everyone | `WinResult` once decided |

State is immutable. Every engine call returns a new object.

---

## 2. A Game Definition

`GameEngineConfig` (one per game, `<game>/config.ts`) bundles:

- `id`, `minPlayers`, `maxPlayers`
- `createInitialPublicState(players)`, `createInitialPrivateState(players)` (`setup.ts`)
- `phases: PhaseConfig[]` (`phases.ts`)
- `actions: Record<type, { validate, handle }>` (`actions.ts`)
- `winConditions` (`winConditions.ts`)
- `gameMaster` flags (auto-advance, etc.)

Types for public/private data and payloads live in `<game>/types.ts`.

---

## 3. Phases and Actions

- A phase lists its `allowedActions`. `engine.dispatch` rejects any other type with
  `Action "X" not allowed in phase "Y"`.
- `validate(state, action)` → `{ valid, error? }`. Compose with `engine/validation.ts`
  helpers. **Validate everything the server must trust**: actor, phase, target legality,
  turn order, one-action-per-phase.
- `handle(state, action, emit)` is **pure**: no randomness except in `setup.ts`, no
  clock, no I/O. It returns the next state, and the phase transition is part of that
  returned state.
- `createInitialState` starts in `'lobby'`. The authority then moves to the game's
  `firstPhase` (runtime registry).
- Prefer an explicit state machine. Each phase names the actions that leave it.
  Do not add an "anything goes" phase.

## 4. Win Conditions

Checked after every accepted action. The first non-null `WinResult` ends the game:
`phase = 'end'`, `room.status = 'ended'`. Include `reason` and `reasonTh`.

---

## 5. Bots

`nextBotAction(state, playerId) → GameAction | null` in `<game>/bot.ts`.

- It reads **full** state (it is part of the authority), and returns `null` when this
  seat has nothing to do right now.
- One function serves three jobs: server bots (`bot_*` seats), the **timeout default
  move** for a stalled human, and offline autoplay (🤖). It must always return a
  **legal** action, or the game stalls.
- A seat with no bot policy for a phase (e.g. Checkpoint's host-only `CONTINUE_SHIFT`)
  needs a human. Say so in the game's rules doc.
- Verify scripts drive whole games with it. A stall shows up there as
  `Engine stalled in phase X`.

---

## 6. ⚠ Hidden Information

This is the trust boundary of the product, not a UI detail.

1. **A client only ever receives its own private slice.** Online, RLS enforces it
   (`game_private_select_own`). Every transport also passes state through
   `redactStateFor(state, viewerId)`.
2. **Game UIs read only `state.private[meId]`.** They never iterate `state.private` or
   read another seat's entry. They also never infer secrets from data the server did
   not mean to publish.
3. **Public data must be public-safe.** Anything in `TPublic` is readable by the whole room.
   Do not put "who is a wolf" there, even temporarily.
4. **Action payloads that reveal a secret** (mission card, night target, sealed offer)
   go in the runtime's `privateActionTypes`. The server logs them as `{ submitted: true }`.
5. **End-of-game reveal** goes through `revealForPublic(state)`, which is merged into
   `public.data.reveal` once a winner exists. LocalTransport does the same, so the
   result page works offline.
6. Devtools (`SeatSwitcher`) may show god-view hints. The data it gives the game UI
   is still redacted.

---

## 7. GameClient and Transports

`engine/client/` adapts the boardgame.io Client pattern without the dependency.

```ts
const client = createGameClient<Pub, Priv, Moves>({ playerId, transport });
client.start();                               // connect
await client.moves.VOTE_TEAM({ approve: true }); // → { ok: true } | { ok: false, error }
client.getState(); // { status, match, state (redacted), version, busy, error }
```

| | LocalTransport (`createLocalMaster`) | SupabaseTransport (`services/supabase/gameTransport.ts`) |
| - | ------------------------------------ | --------------------------------------------------------- |
| authority | in-memory master, full state | Edge Functions |
| seats | many clients on one master | the authenticated user only |
| bots | `isBot(id)`, `setAutoPlay`, `botDelayMs` (0 = synchronous) | server resolves `bot_*` seats synchronously |
| sync | push on every change | Realtime "changed" → **serialized, coalesced refetch** |
| `version` | per-master counter | per-transport sequence (server row version resets on restart) |
| host checks | `hostOnly` (true by default; offline uses false) | server-enforced |

Rules:

- A move error is a value (`MoveResult`), never a throw. `snapshot.error` holds the last
  error. A good sync clears a *sync* error, but not a rejected-move error.
- New transports implement `GameTransport` and must satisfy §6.1.
- React binds through `useGameClient(client | null)`. Do not wrap the client in a
  second store.

---

## 8. Timers and Timeouts

- The server owns timer windows: `PHASE_TIMEOUT_SECONDS` in `game-action` (Avalon:
  `teamProposal` 45 s, `teamVote` 25 s, `mission` 25 s). UIs show a countdown with the
  same values (`PHASE_TIMER` in the UI) and, on expiry:
  - **online:** the host calls `onTimeout` → `TIMEOUT` intent. The server checks
    elapsed time and plays `nextBotAction` for the staller;
  - **offline:** `onTimeout` plays the viewed seat's default move.
- Werewolf's day discussion is a UI-side 3-minute countdown. The host then sends `CONTINUE`.
- Change a timer in **both** places in the same change.

---

## 9. Adding a Game — Checklist

Use the `new-game` skill. It walks through the steps below.

1. Rules doc in `docs/games/<id>-rules.md`. Write original names and text ([coding-standards §6](coding-standards.md)).
2. `types → setup → phases → actions → winConditions → config → bot → rules → ui/`.
3. Register it in all six places ([architecture §4](architecture.md)), and keep
   `runtime.ts` ≡ `_shared/games.ts`.
4. Add `scripts/verify-<id>.mjs` and add the game to `verify-game-client.mjs`.
5. Run the gate ([workflow §4](workflow.md)). Online play also needs an Edge Function
   redeploy.

## 10. Verification

| script | proves |
| ------ | ------ |
| `verify:<game>` | the engine finishes a full bot-driven game with valid actions |
| `verify:game-client` | every game finishes through GameClient with per-seat privacy, timeouts, autoplay hand-off, seat switching |
| `verify:supabase-transport` | sync contract: coalescing, restart, errors, redaction, unsubscribe |
| `verify:game-action` · `game-timeout` · `realtime-game` | Edge Function and client wiring still has the required pieces (static) |

When you change engine or game behaviour, extend the matching script. Don't only run it.
