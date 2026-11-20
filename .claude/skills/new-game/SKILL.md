---
name: new-game
description: Add a new game to TangWong end to end — rules doc, pure-TS engine files, bot, UI, all six registries, verify script. Use when the user asks to add, scaffold or start building a new game.
---

# New Game

Rules this skill relies on (read them; this skill doesn't restate them):
`.ai/game-engine.md` §1–9 · `.ai/architecture.md` §4, §7–8 · `.ai/coding-standards.md` §4–7.

## 0. Gate

- Is the game in the current epic of `docs/roadmap.md`? If not, stop and ask.
- **Show the file plan and wait for approval** (CLAUDE.md §2.1).

## 1. Design first

1. Write `docs/games/<id>-rules.md`: player range, roles/components, phases in order,
   every action with who may take it, public vs **private** information per phase, win
   conditions, timers, and which steps need a human (no bot policy).
2. Names, roles and text must be **original** (coding-standards §6). Pick a lower-case
   `id` and a Thai display name.
3. Settle open rule questions with the user before writing code.

## 2. Engine — `src/features/games/<id>/` (pure TS, Deno-safe)

Write in this order. Each file uses relative imports **with `.ts`**, and no `@/`.

| file | contents |
| ---- | -------- |
| `types.ts` | `<Id>Public`, `<Id>Private`, payload types, phase id union |
| `setup.ts` | `createInitialPublicState`, `createInitialPrivateState`. The only place randomness is allowed |
| `phases.ts` | `PhaseConfig[]` with `allowedActions` |
| `actions.ts` | `{ validate, handle }` per action. Validate actor, phase, legality, once-per-phase |
| `winConditions.ts` | `WinCondition[]` with `reason` + `reasonTh` |
| `config.ts` | `GameEngineConfig` assembling the above |
| `bot.ts` | `nextBotAction(state, playerId)`: always legal, `null` when idle |
| `rules.ts` | `GameRules` sheet for the in-app rules screen |
| `index.ts` | barrel |

Keep secrets out of `TPublic` and out of event payloads (game-engine §6).

## 3. UI — `src/features/games/<id>/ui/<Id>Game.tsx`

- Props: `GameUIProps` from `registry.ts`. Render `externalState`, act via
  `onSubmitAction`, use `onTimeout`, `busy`, `error`, `autoPlay`, `onToggleAutoPlay`.
- Build on `GameShell` and the shared components. Copy the structure of an existing
  game UI. **No engine, no bots, no services in the UI.**
- Read only `state.private[meId]`. Show friendly Thai error toasts.
- Mobile-first, tokens + `cn()`, keep the design vocabulary (coding-standards §4–5).

## 4. Register — all six (architecture §4)

1. `src/data.ts` `GAMES`: catalog entry
2. `src/features/games/registry.ts`: config + UI + rules
3. `src/features/games/rules.ts`: rule sheet
4. `src/features/games/runtime.ts`: `firstPhase`, `nextBotAction`, `revealForPublic`,
   `privateActionTypes`, `botDelayMs`
5. `supabase/functions/_shared/games.ts`: **the same values as runtime.ts**
6. `src/pages/GamePage.jsx` `handleEnd` (+ `ResultPage.jsx` if the result differs)

## 5. Verify

1. Add `scripts/verify-<id>.mjs` (copy `verify-checkpoint.mjs`): drive a full game with
   bots and assert the win condition. Add `"verify:<id>"` to `package.json`.
2. Add the game to `scripts/verify-game-client.mjs` (`playOffline`, `seatSwitch`).
3. Run the `verify` skill.
4. Online play needs `supabase functions deploy game-start` and `game-action`. Ask
   first, and list it as not yet done if skipped.

## 6. Finish

- Roadmap feature entry: date, files, notes, follow-up, what's unverified.
- `.ai/project-context.md` §5 shipped-games table.
- Offer the `code-reviewer` and `privacy-auditor` agents.
