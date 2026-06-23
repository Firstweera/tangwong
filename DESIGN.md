# Design System

## Register

product

## Direction

Night Table Command Center. TangWong should feel like a mobile command room for
friends playing board games together: fast, social, readable in a low-light
hangout, and trustworthy around hidden information.

## Theme

The app defaults to the user's device theme through `prefers-color-scheme`.
Tweaks may force `dark` or `light`, but the production default is `system`.

Dark is the primary physical scene: friends on phones during a call or late-night
hangout. Light remains first-class for users whose device is set to light mode.

## Visual Vocabulary

- Surfaces: restrained dark/light panels, crisp borders, minimal blur.
- Primary action: violet-to-cyan gradient, reserved for room creation, start,
  share, and continuation.
- Accent: warm brass/orange for readiness, tabletop warmth, and positive
  handoff moments.
- State colors: blue for good/successful quest, red for evil/fail/danger, green
  for online/ready, amber for warnings.
- Shape: 10/14/18/24px radius scale. Cards avoid nested-card layouts.
- Motion: short state feedback only. No decorative page choreography. Reduced
  motion must keep content visible.

## Interaction Rules

- Every primary action must be reachable by thumb at the bottom or in a clear
  command card.
- Room state should be visible before decoration: code, players, readiness,
  selected game, and start gate.
- Hidden/private information must use explicit affordances, not ambiguous color
  alone.
- Empty/loading states should explain what the player is waiting for.

## Surfaces

- Welcome: concise onboarding command card with immediate guest path.
- Home: room command center, not a marketing landing page.
- Lobby: share code, selected game, readiness, and player seats are the core.
- Game: table state first; actions are phase-specific and bottom anchored.
- Result: outcome report, quest recap, role reveal, and next action.
- Secondary tabs: Games/Friends/Profile use the same page header, command card,
  list row, chip, and button vocabulary.
