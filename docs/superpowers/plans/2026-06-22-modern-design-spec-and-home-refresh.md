# Modern Design Spec And Home Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/design-spec` route with three modern design directions, then apply the recommended focused Home/app-shell visual refresh.

**Architecture:** Keep the existing in-memory screen router and add a URL-aware `design-spec` screen for direct access. Preserve the current mobile-first shell and prototype tabletop identity while moving visual polish into reusable CSS classes.

**Tech Stack:** React 18, Vite, JSX/TSX mix, plain CSS design tokens, current custom UI components.

---

### Task 1: Product Context

**Files:**
- Create: `PRODUCT.md`

- [x] **Step 1: Capture strategic context**

Write `PRODUCT.md` with product register, users, purpose, personality, anti-references, principles, and accessibility needs inferred from `AGENTS.md`, `README.md`, and `docs/roadmap.md`.

### Task 2: Design Spec Route

**Files:**
- Create: `src/pages/DesignSpecPage.jsx`
- Modify: `src/app/router.jsx`
- Modify: `src/app/App.jsx`

- [x] **Step 1: Add a DesignSpecPage**

Create a mobile-first page that presents three design directions:

1. Play Lobby Command Center
2. Cinematic Tabletop
3. Lean Social Utility

Each direction includes intent, visual system, interaction notes, tradeoffs, and a recommended badge on direction 1.

- [x] **Step 2: Wire screen routing**

Add `design-spec` to `renderScreen`, and make `App.jsx` initialize that screen when `window.location.pathname === '/design-spec'`.

- [x] **Step 3: Preserve app navigation**

Make the shared `go()` helper update browser history for `/design-spec` and return other screens to `/`, without changing the main tab model.

### Task 3: Focused Home Refresh

**Files:**
- Modify: `src/pages/HomePage.jsx`
- Modify: `src/styles/components.css`
- Modify: `src/styles/tokens.css`
- Modify: `src/styles/reset.css`
- Modify: `src/styles/animations.css`

- [x] **Step 1: Replace the current hero with a modern tabletop command hero**

Keep the round-table scene but strengthen hierarchy, add room-status chips, remove generic eyebrow dependence, and make create/join actions feel like the primary app workflow.

- [x] **Step 2: Add reusable CSS classes**

Move new visual treatment into classes such as `.home-hero`, `.home-command`, `.home-join`, `.section-head`, and `.home-step` so the JSX is not only inline styles.

- [x] **Step 3: Refresh section rhythm**

Tune online friends, popular games, and "start in 30 seconds" spacing so the page reads as a modern app dashboard, not a landing page.

### Task 4: Roadmap And Verification

**Files:**
- Modify: `docs/roadmap.md`

- [x] **Step 1: Record completion**

Add a completed design polish entry under Epic 0 Design System with date, files, notes, and follow-up tasks.

- [x] **Step 2: Verify**

Run `npm run build`. If possible, run a local dev server and inspect `/design-spec` plus Home on mobile width.
