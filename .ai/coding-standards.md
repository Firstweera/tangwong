# Coding Standards

Owns: **rules true for every file** — language, types, naming, imports, styling, UI
behaviour, copy, IP rules, comments, dependencies, and the review checklist.

---

## 1. Language and Types

- New code is **TypeScript** (`strict`). Legacy `.jsx` pages may stay JSX until a task
  changes them substantially ([architecture §3](architecture.md)).
- No `any`. Use `unknown` at boundaries and narrow it. The engine's `unknown` generics
  in registries are the documented exception.
- Model game data in `<game>/types.ts`. Payload types are named after the action
  (`VoteTeamPayload`) and used by both `validate` and the UI call site.
- Prefer union string literals over `enum`.
- Named exports. A default export is only for page components the router imports.

## 2. Naming and Files

- Components `PascalCase.tsx`. Hooks `useThing.ts`. Other modules `camelCase.ts`.
  Game folders are lower-case game ids.
- Action types are `SCREAMING_SNAKE` verbs (`NOMINATE_TEAM`). Phase ids are `camelCase`
  (`teamProposal`).
- A game's files follow the fixed set in [game-engine §2](game-engine.md). Do not
  invent a new layout per game.

## 3. Imports

- App code imports with `@/` (→ `src/`). Siblings in the same feature may use relative paths.
- Files Deno loads (engine, game logic, `runtime.ts`) use **relative paths with `.ts`**
  and no `@/` ([architecture §8](architecture.md)).
- Respect the boundary table in [architecture §7](architecture.md).

## 4. Styling

- **Keep the current visual design** unless the task is a redesign.
- New UI uses Tailwind utilities bridged to tokens (`bg-surface`, `text-muted`,
  `border-line-2`, `bg-primary`, `rounded-card` …). Compose with `cn()` from `@/lib/utils`.
- **No raw hex / rgb in new code.** Tailwind's default palette is removed on purpose,
  so a colour must come from a token. Missing a token? Add it to the design system
  (`src/design-system/tokens.*` + `src/styles/tailwind.css` `@theme`). Do not hardcode it.
- **Preflight is off** while prototype CSS exists. `reset.css` already normalises
  `button` (no border/background, inherits font and colour). Do not re-enable preflight
  in a feature change.
- Existing prototype classes (`btn btn-primary`, `chip`, `th`, `screen`) remain valid.
  Reuse them before writing a near-duplicate.
- Dark is primary and light is first-class: both must work through tokens. Never style
  for one theme only.

## 5. UI Behaviour (Mobile-First)

- Design at phone width first. Touch targets are ≥ 44 px where practical. Primary
  actions sit bottom-anchored or in a command card.
- Respect safe areas (`env(safe-area-inset-*)`) for fixed elements.
- Every async surface has loading, empty and error states that say what the player is
  waiting for.
- Do not show state by colour alone. Pair it with an icon or a label.
- Support `prefers-reduced-motion`. Keep motion short and functional.
- Disable controls while `busy` so a submit can't fire twice.
- Map raw engine and network errors to short Thai toasts (`friendlyGameError` pattern).
  Never show raw error strings to players.
- Reuse shared components (`GameShell`, `components/ui`, design-system parts) before
  writing a per-game copy (CLAUDE.md: no duplicate components per game).

## 6. ⚠ Original IP Only

Games are *inspired by* real titles. **Never** use their official names, logos,
artwork, card text, role names, or rulebook wording, in code, copy, assets or commit
messages. Internal ids like `avalon` are tolerated as legacy keys. Player-facing names
must be original (e.g. ผู้ตรวจการ, ล่าหมาป่า). Do not add images or fonts without a
clear licence.

## 7. Copy

- Player-facing copy is **Thai first**, short and conversational. English appears as a
  secondary label where the design already does that.
- Game terms stay consistent within a game. Use the wording in its rules doc.
- No i18n framework yet. Do not add one as a side effect.

## 8. Comments

Explain **why** and the constraint that isn't visible in the code, not what the next
line does. Mark deliberate deviations with the reason. Cite owner docs as
`(game-engine §6)`.

## 9. Dependencies

Ask before adding any dependency, and never add a UI kit or state library without
approval. Check first whether React, the existing engine or `lib/` already covers the
need. Name the lockfile you changed ([project-context §2](project-context.md)).

## 10. Review Checklist

- [ ] Hidden info: UI reads only `private[meId]`; nothing secret in `TPublic` or in the action log ([game-engine §6](game-engine.md))
- [ ] Rules run once: no game logic or bot loop in a UI; engine files stay pure
- [ ] Registries: a new game or action is wired in every place ([architecture §4](architecture.md)); `runtime.ts` ≡ `_shared/games.ts`
- [ ] Deno-safe imports in engine and game files
- [ ] Tokens only, `cn()`, no new hex; mobile layout and safe areas; loading, empty and error states
- [ ] Original names and copy only
- [ ] Verify scripts extended for changed behaviour; gate green ([workflow §4](workflow.md))
- [ ] Docs and roadmap updated in the same change ([workflow §5–6](workflow.md))
