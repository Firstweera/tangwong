# TangWong Design System

Reusable, token-driven primitives for every surface — lobby, multiplayer game
screens, voting, card games, resource/strategy games, and social interactions.

```js
import { Button, Stack, Modal, VoteChip, RoleBadge, tokens } from '../design-system';
```

## Principles

- **Encodes the existing look, doesn't reinvent it.** Components that have a
  prototype equivalent reuse its CSS (`Button`→`.btn`, `Card`→`.card`,
  `PlayerAvatar`→`Avatar`/`.av`, `Toast`→`.toast`, `GameCard` is re-exported).
  Adopting the DS changes no pixels.
- **Tokens are the contract.** Colours come from CSS custom properties so
  light/dark and the live accent tweaks keep working. Structural scales live in
  both [`tokens.css`](./tokens.css) (CSS vars) and [`tokens.ts`](./tokens.ts)
  (typed JS mirror) — never hardcode hex/px in a component.
- **Additive & namespaced.** New styles use the `.ds-*` namespace and `:root`
  tokens; nothing overrides existing selectors.
- **Generic, not game-specific.** Gaming primitives take roles/phases/votes as
  plain data — no Avalon/Salem logic baked in.

## Tokens

`color` · `statusColor` · `space` · `radius` · `shadow` · `duration` · `easing`
· `zIndex` · `typography`. Z-index layers align with existing values
(nav 30, confetti 80, toast 90) so DS overlays stack correctly.

## Components

| Group | Exports |
|-------|---------|
| Layout | `Page` `Container` `Stack` `Grid` `Divider` |
| Typography | `Heading` `Text` `Caption` `Label` |
| Actions | `Button` `IconButton` `SegmentedControl` |
| Inputs | `Input` `TextArea` `Select` `SearchInput` |
| Feedback | `Badge` `Tag` `Tooltip` `Toast` / `useToast` |
| Overlay | `Modal` `Drawer` `BottomSheet` |
| Gaming | `PlayerAvatar` `PlayerStatus` `VoteChip` `RoleBadge` `GamePhaseIndicator` `TurnIndicator` |
| Cards | `Card` `PlayingCard` `ResourceCard` `GameCard` |

Overlays render absolutely within the nearest positioned ancestor (the `.app`
device frame), matching how the prototype layers the tab bar and toast.

## Status

Foundation only — primitives are built and compile-verified, but **not yet wired
into the existing pages**. Migrating screens to consume these is a later step.
No game-specific components are included by design.
