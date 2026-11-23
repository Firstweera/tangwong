---
name: verify
description: Run TangWong's local merge gate (typecheck, build, all verify scripts) and report results faithfully, including what could not be verified. Use before saying work is done, before committing, or when asked to check the project.
allowed-tools:
  - Bash(npx tsc --noEmit -p .)
  - Bash(npm run build)
  - Bash(npm run verify:registry-parity)
  - Bash(npm run verify:game-client)
  - Bash(npm run verify:supabase-transport)
  - Bash(npm run verify:werewolf)
  - Bash(npm run verify:checkpoint)
  - Bash(npm run verify:game-action)
  - Bash(npm run verify:game-timeout)
  - Bash(npm run verify:realtime-game)
  - Bash(pnpm exec tsc --noEmit -p .)
  - Bash(pnpm run build)
  - Bash(pnpm run verify:registry-parity)
  - Bash(pnpm run verify:game-client)
  - Bash(pnpm run verify:supabase-transport)
  - Bash(pnpm run verify:werewolf)
  - Bash(pnpm run verify:checkpoint)
  - Bash(pnpm run verify:game-action)
  - Bash(pnpm run verify:game-timeout)
  - Bash(pnpm run verify:realtime-game)
  - Bash(grep verify: package.json)
---

# Verify

The gate is defined in `.ai/workflow.md` §4. CI runs the same list on GitHub, but run it
here first: CI only reports after you push.

## 1. Run

Run each command separately, so one failure doesn't hide the others:

```bash
npx tsc --noEmit -p .
npm run build
npm run verify:registry-parity
npm run verify:game-client
npm run verify:supabase-transport
npm run verify:werewolf
npm run verify:checkpoint
npm run verify:game-action
npm run verify:game-timeout
npm run verify:realtime-game
```

Also run any `verify:<id>` script added since this list was written (`grep verify: package.json`).

To run them in one Bash call, use this loop. The shell is **zsh**, which does not
word-split `$c`; without `eval` every command fails with `command not found`. It keeps
going after a failure and prints output only for failures:

```bash
for c in "npx tsc --noEmit -p ." "npm run build" "npm run verify:registry-parity" \
  "npm run verify:game-client" "npm run verify:supabase-transport" "npm run verify:werewolf" \
  "npm run verify:checkpoint" "npm run verify:game-action" "npm run verify:game-timeout" \
  "npm run verify:realtime-game"; do
  out=$(eval "$c" 2>&1); code=$?
  echo "$c => exit $code"; [ $code -ne 0 ] && echo "$out" | tail -30
done; true
```

The loop is one compound command, so the per-command `allowed-tools` entries don't match
it and it may ask for permission once. Separate calls are pre-approved.

`allowed-tools` lists each gate script by name (no `verify:*` wildcard), so a script
added later must be added there too.

**Never** run `npm run verify:live-game` as part of the gate. It writes to the real
Supabase project. Run it only when the user asks.

## 2. When something fails

- Read the failing output. Fix the cause, not the check.
- Never delete or weaken an assertion, or skip a script, to get green.
- A pre-existing failure unrelated to the change: report it as such, and don't fix it silently.

## 3. Report

```
Gate:
  tsc ............ pass | FAIL (n errors)
  build .......... pass | FAIL
  verify:* ....... pass | FAIL <script>: <first error line>
Not verified here:
  - browser UI (layout, touch, light + dark)        ← whenever UI changed
  - two-browser online play on deployed Supabase    ← whenever online flow changed
  - Edge Function deploy runs after merge (CI)      ← whenever src/features/games/**, src/types/** or supabase/functions/** changed
```

State failures as failures, with output. Don't call work done while the gate is red.
