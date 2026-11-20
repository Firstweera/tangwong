---
name: ship
description: Commit TangWong work and open a pull request the project's way: branch off main, conventional commit with scope and Co-Authored-By trailer, gate first, PR body with behaviour changes and unverified items. Use when the user asks to commit, open a PR, or ship.
---

# Ship

Owner: `.ai/workflow.md` §2–5. Act only when the user asked to commit or open a PR.

## 1. Preconditions

1. `git branch --show-current`: if on `main`, create `feat/|fix/|chore/|refactor/|docs/<area>` first.
2. `git status --short`: only files from this task. Ask about anything unexpected;
   never sweep unrelated changes in.
3. Run the `verify` skill. If the gate is red, stop and report.
4. The roadmap and owner `.ai/` docs are updated (workflow §1, §6).

## 2. Commit

```
<type>(<scope>): <imperative subject, lower case, no period>

<what changed and why, wrapped ~72>

Co-Authored-By: Claude <model> <noreply@anthropic.com>
```

- types `feat fix refactor docs chore style test`; scope = game id, feature or area.
- Use the attribution line from the session's system reminder.
- Prefer one topic per commit. Stage paths explicitly. Don't use `git add -A` across the repo.

## 3. Push

`git push -u origin <branch>`. Never to `main`, never force (the `push-guard` hook enforces this).

## 4. Pull request

```bash
gh pr create --base main --head <branch> --title "<commit-format title>" --body-file <file>
```

Body:

```markdown
## Summary
<one paragraph: what and why>

## Changes
- <grouped by area>

## Behaviour changes
- <anything a player or developer will notice; "None" if none>

## Testing
Automated (passing): <gate commands>
Not yet done: <browser check / two-browser online / Edge Function redeploy>

## Follow-up
- <items also recorded in the roadmap>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

If `gh` fails with `Could not resolve to a Repository`, the login lacks repo access
(workflow §5). In that case, save the body to the scratchpad and give the user
`https://github.com/Firstweera/tangwong/pull/new/<branch>` plus the file path. Don't
switch `gh` accounts yourself.

## 5. Never

Merge the PR, push to `main`, force-push, amend a pushed commit, or skip the gate.
