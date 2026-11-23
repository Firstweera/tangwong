---
paths:
  - "src/features/games/*/ui/**"
  - "src/features/games/ui/**"
  - "src/pages/**"
  - "src/components/**"
  - "src/styles/**"
  - "src/design-system/**"
---

# UI Rules (auto-loaded for screens, components and styles)

Owner docs: `.ai/coding-standards.md` §4–7 and §10, `.ai/architecture.md` §6–7,
`.ai/game-engine.md` §7, `DESIGN.md`. Read the sections your change touches.

- **One seat's view:** a game UI reads only `state.private[meId]`. Never iterate
  `state.private`, never put a secret in DOM attributes, `title`, `aria-label` or logs.
- **No rules in the UI:** state and actions come from the `GameClient` (`externalState`,
  `onSubmitAction`). No engine, bot loop or service call in `ui/`; only decide what to show.
- **Pages:** import registries and components, not game internals. If a result page needs
  game data, put it in public state at game end.
- **Design:** keep the current visual design. Mobile-first, design tokens + `cn()`, no new
  hex, tap targets ≥ 44 px where practical, loading/empty/error states, disable controls while `busy`.
  Reuse shared components instead of a per-game copy.
- **Copy:** Thai, friendly error toasts, no raw error text. Original IP only.
- **Not verified by the gate:** layout, touch and both themes need a browser check; say so
  in the report.
