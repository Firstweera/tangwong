# CLAUDE.md

<!--
Maintainer note (stripped from Claude's context): shared rules for every agent are in
AGENTS.md, imported below. This file adds only Claude Code specifics. Keep it short;
anything every agent needs goes in AGENTS.md, anything path-specific goes in
.claude/rules/, anything procedural goes in a skill.
-->

@AGENTS.md

---

# Claude Code Specifics

## Path-Scoped Rules

`.claude/rules/*.md` load automatically the first time you read or edit a matching file.
They hold the short invariants for that area and point to the owner `.ai/` sections; they
do not replace reading those sections.

| rule file                       | loads for                                                                               |
| ------------------------------- | --------------------------------------------------------------------------------------- |
| `.claude/rules/game-engine.md`  | `src/features/games/**`, `src/types/**`, `scripts/verify-*.mjs`, `scripts/e2e-*.mjs`    |
| `.claude/rules/supabase.md`     | `supabase/**`, `src/services/supabase/**`, `.github/workflows/**`                       |
| `.claude/rules/ui.md`           | game UIs, `src/pages/**`, `src/components/**`, `src/styles/**`, `src/design-system/**`  |

## Skills and Agents

| name                    | use when                                                                                      |
| ----------------------- | --------------------------------------------------------------------------------------------- |
| `new-game`              | adding a game: engine files, six registries, rules doc, verify script                         |
| `game-action`           | adding or changing an action, phase or bot behaviour in an existing game                      |
| `verify`                | before reporting work as done: runs the gate and writes the report                            |
| `ship`                  | user-invoked only (`/ship`): commit, push, prepare the PR                                     |
| agent `code-reviewer`   | after a change: reviews the diff against `.ai/` (read-only)                                   |
| agent `privacy-auditor` | a diff touching private state, redaction, RLS, Edge Functions, transports or auth (read-only) |

Design skills (`impeccable`, `web-design-guidelines`, `tailwind-design-system`, `shadcn`)
are general tools, installed per machine. Where they
disagree with `.ai/coding-standards.md` or DESIGN.md, this repo wins. Agents and skills
defer to AGENTS.md and `.ai/`.

## Enforced, Not Just Asked

`.claude/settings.json` turns some rules into hard stops. Don't route around them; if one
blocks something you believe is needed, stop and ask.

- `push-guard` hook + deny rules: no push to `main`, no force push.
- `migration-guard` hook: committed files in `supabase/migrations/` are never edited; add
  a new numbered migration instead ([supabase §5](.ai/supabase.md)).
- `ask`: `git push`, `verify:live-game` (writes production), `supabase functions deploy`.
- `deny`: reading `.env`, `.env.local`, `.env.*.local`.

## Save context

- Before reading a whole file, grep first and only read the parts you need.
- To understand the whole project, send a subagent to look and bring back only the summary.
- Show me the diff, not the whole file.
- Don't restate anything we've already decided in this session.
- When we switch tasks, suggest /compact or a new session.
- Keep answers short by default.
