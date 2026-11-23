---
paths:
  - "src/features/games/**"
  - "src/types/**"
  - "scripts/verify-*.mjs"
  - "scripts/e2e-*.mjs"
---

# Game Engine Rules (auto-loaded for engine, game and verify files)

Owner docs: `.ai/game-engine.md` (§2–6 rules, §6 hidden information, §9 checklist) and
`.ai/architecture.md` §4 (six registries), §8 (Deno-shared code). Read the sections your
change touches. This file only lists what must never slip.

- **Hidden information:** secrets live in `TPrivate` only. Never in `TPublic`, in event
  payloads, or in an action log payload. A secret-bearing action type goes into
  `privateActionTypes` in **both** `runtime.ts` and `supabase/functions/_shared/games.ts`.
- **Pure engine:** `validate` checks actor, phase, legality and once-per-phase; `handle`
  is pure. Randomness only in `setup.ts` or a draw step the rules doc names, never
  precomputed into state (it would leak future draws). See game-engine §3.
- **Deno-safe:** files under `src/features/games/` (outside `ui/`) and `src/types/` are
  imported by Edge Functions: relative imports with `.ts`, no `@/`, no
  `import.meta.env`, no DOM or React.
- **Bots never stall:** `nextBotAction` returns a legal action wherever a bot or a timed-out
  human must act.
- **Old state on the server:** a deploy runs in-progress games on the new code. Read new
  public/private fields defensively.
- **Registries:** a new game or action is wired in all six places; `npm run
  verify:registry-parity` fails if `runtime.ts` and the server registry disagree.
- **Verify:** extend `scripts/verify-<id>.mjs` (and privacy checks in
  `verify-game-client.mjs`) with every new rule. Procedures: `new-game`, `game-action`
  skills.
