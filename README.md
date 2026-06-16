# TangWong (ตั้งวง)

Mobile-first social board game platform — a Vite + React build of the exported
Claude Design prototype. Full MVP flow: **Home → Lobby → Avalon Game → Result**,
plus Games / Friends / Profile tabs, all inside a 402×874 iOS frame.

## Run it

```bash
npm install
npm run dev      # dev server at http://localhost:5173
npm run build    # production build → dist/
npm run preview  # serve the production build
```

## Structure

```
index.html               Vite entry (loads fonts + /src/main.jsx)
src/
  main.jsx               React root, mounts into #device-scaler
  app/                   Composition root
    App.jsx              Device scaler, theme/accent vars, shell + Tweaks panel
    router.jsx           screen id → page element mapping
    TabBar.jsx           Bottom navigation + main tabs
  data.ts                Mascots, players, games, Avalon roles/quests, chat (typed)
  types/                 Shared domain types
  styles/                Split design tokens + component styles (index.css imports all)
  components/
    ui/                  Icon, Avatar, AvatarStack, Logo, GameCard, QuestTrack, Confetti, useToast
    layout/              Screen, Header, BottomBar
  pages/
    HomePage.jsx
    LobbyPage.jsx        grid / list / circle layout variants
    GamePage.jsx         the ตั้งวง circle — proposal → vote → mission → result
    ResultPage.jsx       celebration + full role reveal
    GamesPage / FriendsPage / ProfilePage
  features/              Feature-scoped components (lobby, room, friends)
  devtools/              IOSFrame (device bezel) + TweaksPanel (live controls)

legacy/                  Original single-file prototype source (app.jsx, screen-*.jsx,
                         theme.css, design-system.html, …) — kept as design reference only,
                         not part of the build.
```

## Tweaks

The floating **Tweaks** panel (driven by the Claude Design host, or visible when
activated) controls: light/dark theme, 4 accent palettes, lobby layout
(grid/list/circle), floating vs. bar navigation, nav labels, and jump-to
shortcuts for each screen.
