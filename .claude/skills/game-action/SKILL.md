---
name: game-action
description: Add or change an action, phase, win condition, timer or bot behaviour in an existing TangWong game, keeping engine, bot, UI, registries, server parity and verify scripts in step. Use for any game-rule change.
---

# Game Action

Owner rules: `.ai/game-engine.md` §2–8 · `.ai/architecture.md` §4, §8. Read the
sections your change touches before editing.

## 1. Pin the rule

- Update `docs/games/<id>-rules.md` (or the rules sheet) first. Record the new step:
  who acts, in which phase, what becomes public, what stays private.
- If the rule is ambiguous (ties, dead players, disconnected seats), ask.

## 2. Engine (pure, Deno-safe)

1. `types.ts`: payload type, plus any new public/private fields. Secrets go in `TPrivate`.
2. `phases.ts`: add the type to `allowedActions` of the right phase or phases; add the
   phase and its exits if it is new.
3. `actions.ts`: `validate` checks actor, phase, target legality, once-per-phase.
   `handle` is pure and returns the next state, including any phase change.
4. `winConditions.ts` if outcomes change.
5. `bot.ts`: `nextBotAction` must produce a **legal** version of the new action
   wherever a bot or a timed-out human could need it. Otherwise the game stalls.

## 3. Privacy

- Does the payload reveal a secret? Add the type to `privateActionTypes` in **both**
  `src/features/games/runtime.ts` and `supabase/functions/_shared/games.ts`.
- Does the end-game reveal need the new data? Update `revealForPublic` in both places.

## 4. UI

- Add the control in the game's `ui/`. Call `onSubmitAction('TYPE', payload)`. Disable it
  while `busy`. Only show it when the engine would accept it.
- No rule logic in the UI beyond deciding what to show.

## 5. Timers

If a phase gains or changes a time limit, update the server `PHASE_TIMEOUT_SECONDS`
(`supabase/functions/game-action/index.ts`) **and** the UI timer together (game-engine §8).

## 6. Verify and finish

1. Extend `scripts/verify-<id>.mjs` so a full game exercises the new action. If the
   action is private, also extend the privacy assertions in `verify-game-client.mjs`.
2. Run the `verify` skill.
3. Changed shared game code → Edge Functions need a redeploy. Ask first; otherwise list
   it as not done.
4. Update the roadmap entry and the owner `.ai/` doc if a rule changed.
