# TangWong Project Instructions

## Project Context

This folder (`tang-wong`) is the **main production project**.

The current codebase is a **prototype** — a visual and UX proof-of-concept built with plain JSX and a single CSS file. It demonstrates the design direction, screens, and game flow, but is not yet production-ready.

All new work should migrate away from the prototype structure toward the scalable architecture described in this file.

---

TangWong (ตั้งวง) is a mobile-first multiplayer board game platform for friends to create rooms, chat, bluff, vote, and play together online.

## Product Direction

Build TangWong as “Discord for board games”.

The platform should support:

- Avalon-inspired social deduction
- Salem 1692-inspired accusation and hidden role gameplay
- Sheriff-inspired bluffing and negotiation
- Exploding Kittens-inspired card effects
- Dixit-inspired creative party gameplay
- Istanbul-inspired strategy / euro board game gameplay

## Tech Stack

Use:

- React
- TypeScript
- Vite
- Tailwind CSS
- Socket.io-ready architecture

### Styling: Tailwind CSS v4 + cn()

Tailwind v4 is installed via the `@tailwindcss/vite` plugin (configured in
`vite.config.js`). Setup lives in `src/styles/tailwind.css`:

- **Preflight is intentionally excluded** while the prototype CSS still exists —
  only Tailwind's `theme` + `utilities` layers are imported, so adding Tailwind
  changes no existing pixels. Re-enable preflight once the CSS migration completes.
- **Theme is bridged to the design tokens** via `@theme`: utilities like
  `bg-primary` / `text-muted` resolve to the same live CSS variables as the
  design system and stay light/dark aware. Tailwind's default colour palette is
  cleared (`--color-*: initial`) so colours can't drift off-token.
- Class scanning is scoped to `src/` (`source("../")`).

Compose class names with **`cn()`** from `src/lib/utils.ts` (clsx +
tailwind-merge) so conditional classes merge and later Tailwind utilities win:

```tsx
import { cn } from "@/lib/utils"; // or relative: '../lib/utils'
<div className={cn("px-4 py-2", isActive && "bg-primary", className)} />;
```

Avoid:

- Large UI libraries unless explicitly requested
- Hardcoded duplicated screens
- One-off components that cannot be reused

## Design Direction

The UI should be:

- Mobile-first
- Modern
- Social
- Playful
- Premium
- Easy to use during hangouts

Visual inspiration:

- Discord
- Supercell
- Board Game Arena
- Modern startup apps

Use dark mode as the primary experience.

## UX Principles

Users should be able to:

- Create a room quickly
- Join with a room code
- Invite friends easily
- See who is ready
- Chat and react
- Start a game
- Play an entire match on mobile

Prioritize:

- Touch-friendly controls
- Clear game phases
- Clear turn indicators
- Clear voting state
- Hidden information privacy
- Reconnection-friendly state

## Architecture

Use a feature-based structure:

src/

- app/
- pages/
- components/
- features/
  - lobby/
  - room/
  - profile/
  - friends/
  - games/
    - avalon/
    - salem/
    - sheriff/
    - exploding-kittens/
    - dixit/
    - istanbul/
- hooks/
- services/
- stores/
- types/
- assets/

## Game Engine Direction

Design the game system so each game has:

- game config
- player state
- public state
- private player state
- phases
- actions
- events
- win condition
- validation rules

The system should support both:

- Auto Game Master
- Optional Host / Moderator tools

## Development Rules

Always:

- Keep the current visual design unless asked to redesign
- Use TypeScript types
- Create reusable components
- Separate UI from game logic
- Prefer clean state machines for game phases
- Keep mobile layout first

Never:

- Use copyrighted assets from real board games
- Use official names, artwork, logos, or rulebook text directly
- Build only for desktop
- Add unnecessary backend code before the MVP needs it
- Create duplicate components for each game when a shared component can work

## First MVP Goal

The first playable MVP should be:

Home → Create/Join Room → Lobby → Avalon-inspired Game → Result

Do not prioritize landing page, profile, friends, achievements, or monetization before the core multiplayer loop works.

# Progress Tracking Rules

Before starting any task:

1. Read docs/roadmap.md

2. Identify:
   - current epic
   - current feature
   - task status

3. Do not work on future epics unless explicitly instructed.

---

After completing a feature:

Update docs/roadmap.md

Change status:

⚪ Not Started
→ 🟡 In Progress
→ ✅ Completed

---

When marking a feature as completed:

Add:

- completion date
- implemented files
- notes
- follow-up tasks

Example:

### Guest Profile

✅ Completed

Files:

- guest-store.ts
- guest-types.ts
- ProfileSheet.tsx

Notes:

- nickname persistence implemented
- avatar selection implemented

Follow-up:

- integrate with Socket.io player identity

---

At the end of every implementation:

Provide:

1. What was completed
2. What roadmap items changed
3. What remains in the current epic
4. Suggested next task
