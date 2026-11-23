# AGENTS.md

<!--
Maintainer note (an HTML comment, so Claude Code strips it from context):
AGENTS.md is the shared, tool-neutral entry point for every coding agent (Claude Code,
Codex, Cursor, others). CLAUDE.md imports it with `@AGENTS.md` and adds only Claude Code
specifics. Rules themselves live in .ai/, one owner file each; this file routes to them.
Keep it short: facts every session needs, nothing derivable from the code.
-->

TangWong (ตั้งวง) is a mobile-first multiplayer board-game platform ("Discord for board
games"). This file says what to read and which rules are mandatory. The rules live in
[.ai/](.ai/), one owner file each. Setup is in [README.md](README.md), deploy in
[DEPLOYMENT.md](DEPLOYMENT.md).

React 18 · Vite · TypeScript · Tailwind v4 (tokens, no preflight) · Supabase (Postgres +
RLS, anonymous Auth, Realtime, Edge Functions) · pnpm. One shared pure-TS game engine runs
in the browser, the verify scripts and the Edge Functions.

---

## 1. Before Every Task

1. Read [docs/roadmap.md](docs/roadmap.md) and name the **current epic, feature and status**.
   Do not work on a future epic unless explicitly asked ([workflow §1](.ai/workflow.md)).
2. Read [.ai/project-context.md](.ai/project-context.md) §1–3 and
   [.ai/architecture.md](.ai/architecture.md) §1–2. Then read only the sections §3 below
   routes you to.
3. Follow the matching procedure in `.claude/skills/<name>/SKILL.md` if one exists
   (`new-game`, `game-action`, `verify`, `ship`). They are plain Markdown; any agent can
   follow them.

## 2. Mandatory Rules

1. **New feature or new files → show the file plan first and wait for approval.** Small
   edits to existing files don't need one.
2. **Hidden information is the trust boundary.** A client receives only its own private
   slice; a game UI reads only `private[meId]`; nothing secret goes in public state or the
   action log ([game-engine §6](.ai/game-engine.md)).
3. **Game rules exist once**, as pure TS under `src/features/games/`. No game logic, bot
   loop or engine call in a UI; state and actions come from a `GameClient`
   ([game-engine §7](.ai/game-engine.md)).
4. **The server is the authority online.** Edge Functions are the only writers of game
   tables. Never add a client write path or an RLS write policy for them ([supabase §2](.ai/supabase.md)).
5. **Original IP only.** Never use real games' names, art, logos, role names or rule text
   ([coding-standards §6](.ai/coding-standards.md)).
6. **Keep the current visual design**, mobile-first, tokens + `cn()` only, no new hex
   ([coding-standards §4–5](.ai/coding-standards.md)).
7. **Reuse before creating.** Use shared components instead of a per-game copy. Add no new
   UI kit, state library or dependency without approval.
8. **Validate before saying done** ([workflow §4](.ai/workflow.md)). Report failures and
   unverified parts as such.
9. **Docs and roadmap move with the code**: update the owner `.ai/` file and the roadmap in
   the same change ([workflow §1, §6](.ai/workflow.md)).
10. **Git:** commit or push only when asked, never to `main`, never force. Keep the
    `Co-Authored-By` trailer ([workflow §2–3](.ai/workflow.md)). Merging to `main`
    deploys the Edge Functions automatically ([supabase §6](.ai/supabase.md)).

When asked to explain something, answer in four parts: what it does · why this approach ·
what breaks if it is removed · the simpler alternative, if one exists.

---

## 3. Documentation Map

**Every rule has exactly one owner file.** A second statement of a rule is a pointer. If
two places disagree, fix the duplicate.

| file | owns |
| ---- | ---- |
| [.ai/project-context.md](.ai/project-context.md) | what TangWong is, stack, run modes + env, commands, shipped games, docs outside `.ai/` |
| [.ai/architecture.md](.ai/architecture.md) | layers, folder map, prototype migration, **game registries (6 places)**, room/game data flow, import boundaries, Deno-shared code |
| [.ai/game-engine.md](.ai/game-engine.md) | state model, game config, phases/actions/validation, win, bots, **hidden information**, GameClient + transports, timers, add-a-game checklist, verify scripts |
| [.ai/supabase.md](.ai/supabase.md) | tables + RLS, Edge Functions + error envelope, client services, migrations, deploy (CI), secrets |
| [.ai/coding-standards.md](.ai/coding-standards.md) | TS, naming, imports, styling, mobile UI behaviour, original IP, copy, comments, dependencies, **review checklist** |
| [.ai/workflow.md](.ai/workflow.md) | roadmap discipline, branches, commits, PRs, **merge gate + CI**, doc-update rule, end-of-task report |
| [PRODUCT.md](PRODUCT.md) · [DESIGN.md](DESIGN.md) | users, brand, design principles · visual direction |

Read **sections, not files**: `grep -n "^## " .ai/<file>.md`, then read the range you need.

| the task involves | read |
| ----------------- | ---- |
| any game logic, a new action or phase | game-engine §2–5 |
| anything a player should not see | game-engine §6 (always) |
| a game UI or `GamePage` | architecture §6 · game-engine §7 · coding-standards §4–5 |
| a new game | architecture §4 · game-engine §9 → `new-game` procedure |
| online play, RLS, Edge Functions | supabase §1–3 · architecture §8 |
| a migration | supabase §2, §5 |
| rooms / chat | architecture §5 |
| styling, a new screen | coding-standards §4–5 · DESIGN.md · `src/design-system/README.md` |
| a timer | game-engine §8 |

## 4. Source of Truth

1. Explicit user instruction
2. `docs/roadmap.md` scope and the user's approved plan
3. `.ai/` owner docs and PRODUCT.md / DESIGN.md
4. Per-game rules in `docs/games/`
5. Existing implementation
6. `docs/prototype/` (visual reference only, never code)
7. Generic framework knowledge

Never choose silently between conflicting requirements. If a conflict affects game rules,
privacy or architecture, stop and ask.

## 5. When Unsure

Ask instead of guessing when:

- a game rule is silent on a case the engine must handle;
- a change would put any secret where another seat could read it;
- the task needs a live Supabase write, a manual Edge Function deploy or a migration;
- the work belongs to a future epic.
