# TangWong (ตั้งวง)

Mobile-first social board game platform — "Discord for board games". Built with
Vite + React + TypeScript + Tailwind CSS v4, with a Supabase backend (Postgres +
Auth + Realtime). Full MVP flow: **Home → Create/Join Room → Lobby → Avalon Game
→ Result**, plus Games / Friends / Profile tabs, in a mobile-first dark UI.

## Run it

```bash
npm install
npm run dev      # dev server at http://localhost:5173
npm run build    # production build → dist/
npm run preview  # serve the production build
```

By default the app runs fully offline on a local guest identity with a cross-tab
(BroadcastChannel) realtime transport — no backend required for local dev. To
enable the Supabase backend (cross-device multiplayer), see
[DEPLOYMENT.md](DEPLOYMENT.md) and set the env vars in `.env.local`
(copy from [.env.example](.env.example)).

## Structure

```
index.html               Vite entry (loads fonts + /src/main.jsx)
src/
  main.jsx               React root, mounts into #device-scaler
  app/                   Composition root (App, router, TabBar)
  data.ts                Mascots, players, games, Avalon roles/quests, chat (typed)
  types/                 Shared domain types
  styles/                Design tokens + component styles + Tailwind v4 setup
  lib/                   cn() and small helpers
  components/
    ui/                  Icon, Avatar, GameCard, QuestTrack, DropdownMenu, …
    layout/              Screen, Header, BottomBar
    game/               Shared in-game pieces (PlayerSeat, …)
  pages/                 Home / Lobby / Game / Result / Games / Friends / Profile
  features/
    guest/               Guest identity (+ Supabase auth migration)
    room/                Room realtime store + hooks (cross-tab / Supabase)
    chat/                Chat store + hook (cross-tab / Supabase)
    lobby/               Lobby components
    games/
      engine/            Generic game engine (state machine, redaction, hooks)
      avalon/            Avalon definition + UI (config, phases, actions, bot)
  services/
    realtime/            Cross-tab transport (BroadcastChannel) + contract
    supabase/            Supabase client, auth, profiles, room + chat services
  devtools/              IOSFrame (device bezel) + TweaksPanel (live controls)

supabase/                SQL migrations (0001 profiles, 0002 rooms/chat) + setup README
docs/                    roadmap, changelog, plans, verification checklists
                         (docs/prototype/ holds the design prototype reference)
```

## Backend & deployment

- **Transport is swappable** via `VITE_USE_SUPABASE`: cross-tab for local dev,
  Supabase (server-authoritative, cross-device) for production. Same hooks,
  no caller changes.
- **Authority:** clients never write game/room state directly — all writes go
  through Supabase RPC (`SECURITY DEFINER`) guarded by RLS. Long-term game-sync
  authority is Edge Functions + Postgres + RLS.
- See [DEPLOYMENT.md](DEPLOYMENT.md) for GitHub → Supabase → Vercel setup and
  [docs/supabase-plan.md](docs/supabase-plan.md) for the architecture.

## Tweaks

The floating **Tweaks** panel controls: light/dark theme, accent palettes, lobby
layout (grid/list/circle), floating vs. bar navigation, nav labels, and jump-to
shortcuts for each screen.
