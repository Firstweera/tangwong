# UI Component Library

TypeScript, Tailwind v4, and `cn()`-driven primitives. Dark-mode first (colours
read theme tokens that default to dark), mobile-first, accessible, and
tree-shakeable — import each component from its own folder.

```
ui/
  typography/   Heading · Text · Caption · Label
  button/       Button · IconButton · ButtonGroup
  input/        Input · TextArea · SearchInput · Field (compound)
  badge/        Badge
  avatar/       Avatar · Avatar.Group · Avatar.Status (compound)
  card/         Card · Card.Header/Body/Footer/Media (compound)
  tooltip/      Tooltip.Root/Trigger/Content (compound)
  modal/        Modal.Root/Trigger/Content/Header/Title/Description/Footer/Close
  sheet/        Sheet.Root/Trigger/Content (bottom + side) /Header/Title/...
```

## Import (tree-shakeable, per folder)

```tsx
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Avatar } from '@/components/ui/avatar';
```

There is intentionally **no barrel** that re-exports every folder — per-folder
imports keep bundles minimal and avoid name clashes with the legacy flat
primitives (`Icon`, `Logo`, `GameCard`, `QuestTrack`, `Confetti`, `useToast`,
and the legacy `Avatar`) still exported from `./index.js` for the current app.

## Conventions

- **Styling** — Tailwind utilities composed with `cn()` (`@/lib/utils`); colours
  use the bridged tokens (`bg-surface`, `text-muted`, `border-line`, …) so every
  component is theme-aware and dark-first without `dark:` variants. Inline
  `style` is used only for gradients / signature shadows.
- **Compound pattern** — Card, Avatar, Tooltip, Modal, Sheet, and the input
  `Field` expose sub-components via React context (e.g. `Modal.Title` wires
  `aria-labelledby` automatically).
- **Accessibility** — dialogs (Modal, Sheet) trap focus, restore it on close,
  close on Escape/backdrop, and set `role="dialog"` + `aria-modal`. Field wires
  label/hint/error via `aria-describedby`/`aria-invalid`. Icon-only buttons
  require `aria-label`.
- **Controllable** — Modal/Sheet accept `open`/`defaultOpen`/`onOpenChange`.
- Overlays render absolutely within the `.app` device frame (no body portal, so
  the device scaling is preserved).

## Stories

Each component ships a `*.stories.tsx` with CSF-compatible examples (default
`meta` + named exports). They are documentation/examples and are not bundled
into the app (nothing imports them). Storybook is not yet installed — add
`@storybook/react` to render them live.

## Shared hooks

`@/hooks`: `useControllableState`, `useFocusTrap`, `useOnEscape`.
