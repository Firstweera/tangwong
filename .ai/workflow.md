# Workflow

Owns: **how work moves** — roadmap discipline, branches, commits, pull requests, the
merge gate, the documentation-update rule, and the end-of-task report.

Written from what the repo actually does as of 2026-11-20. Where nothing has been
decided, this file says so.

---

## 1. Roadmap Discipline

[../docs/roadmap.md](../docs/roadmap.md) is the plan of record.

1. **Before a task:** read it, then name the current epic, the feature, and its status.
2. **Do not work on a future epic** unless the user explicitly asks.
3. **Status flow:** ⚪ Not Started → 🟡 In Progress → ✅ Completed (🔒 Future = not planned yet).
4. **On completion**, the feature entry gets: completion date, implemented files, notes,
   follow-up tasks. Also record anything **not verified** (browser, live Supabase).
   Do not hide it inside a ✅.
5. Tooling and docs work with no product epic goes under **Epic 0 — Foundation**.

## 2. Branches

- `main` is the only long-lived branch and is what Vercel deploys.
- Work on a feature branch. Prefixes: `feat/` · `fix/` · `chore/` · `refactor/` · `docs/`,
  named after the area (`feat/game-client-layer`, `chore/ai-operating-docs`).
- **Do not commit or push unless asked.** If you are on `main`, branch first. The
  `push-guard` hook blocks pushing to `main` and any force push.

## 3. Commits

Conventional Commits with a scope, matching the history:

```
feat(werewolf): private wolf pack tally + coordinated bots
fix(game-shell): safe-area top bar, role strip
chore(ai): add .ai operating docs and project skills
```

- types: `feat` · `fix` · `refactor` · `docs` · `chore` · `style` · `test`
- scope: game id, feature folder, or repo area (`engine`, `game-client`, `supabase`, `ai`, `deps`)
- subject: English, imperative, lower case, no trailing period
- body: what changed and **why**, wrapped at ~72 columns
- **Footer: keep the `Co-Authored-By: Claude …` trailer** (decided 2026-11-20)
- One topic per commit where practical. A large feature may land as one commit when its parts can't build alone.

## 4. Merge Gate

Run the gate locally before every commit and PR. GitHub Actions
(`.github/workflows/ci.yml`) runs **the same list** on every PR and every push to `main`;
a red CI blocks the merge just like a red local run. Keep the two lists identical.

```bash
npx tsc --noEmit -p .
npm run build
npm run verify:registry-parity
npm run verify:game-client
npm run verify:supabase-transport
npm run verify:werewolf && npm run verify:checkpoint
npm run verify:game-action && npm run verify:game-timeout && npm run verify:realtime-game
```

The `verify` skill runs this and reports it. `verify:live-game` is **not** part of the gate:
it writes to the real Supabase project.

What the gate cannot see, and which must therefore be stated in the PR:

- the UI in a browser (layout, touch, both themes)
- online play against the deployed project (two browsers)
- whether the post-merge Edge Function deploy succeeded (it runs only after the merge,
  see [supabase.md §6](supabase.md))

## 5. Pull Requests

- Target `main`. A human reviews and merges. Claude never merges.
- Title in commit format. The body has Summary · Changes · **Behaviour changes** ·
  Testing (automated vs not yet done) · Follow-up. The `ship` skill fills it in.
- **Create with `gh pr create`.** If `gh` answers `Could not resolve to a Repository`,
  the `gh` login lacks access to `Firstweera/tangwong` (seen 2026-11-20). In that case,
  give the user the web link
  `https://github.com/Firstweera/tangwong/pull/new/<branch>` and the PR body as a file.
- A rule change carries its `.ai/` update in the same PR.

## 6. Documentation Update Rule

When a change alters behaviour, architecture or a contract, update the owner doc in the
**same change**:

| change | update |
| ------ | ------ |
| layers, folders, registries, boundaries | `.ai/architecture.md` |
| engine model, bots, hidden info, transports, timers | `.ai/game-engine.md` |
| tables, RLS, functions, error envelope | `.ai/supabase.md` (+ `supabase/README.md` setup steps) |
| a cross-cutting coding rule | `.ai/coding-standards.md` |
| commands, env, run modes, shipped games | `.ai/project-context.md` |
| a game's rules | `docs/games/<id>-rules.md` |
| progress | `docs/roadmap.md` (+ `docs/changelog.md` for shipped changes) |

**One owner per rule.** Elsewhere, point to it; don't copy it. Write down the reason,
not only the rule.

## 7. End-of-Task Report

Every implementation ends with:

1. What was completed
2. What roadmap items changed
3. What remains in the current epic
4. Suggested next task

and states the gate results faithfully: what passed, what failed with output, and what
was not run or not verifiable.
