---
name: verify
description: Run TangWong's local merge gate (typecheck, build, all verify scripts) and report results faithfully, including what could not be verified. Use before saying work is done, before committing, or when asked to check the project.
---

# Verify

The gate is defined in `.ai/workflow.md` §4. There is no CI, so this is the only check.

## 1. Run

Run each command separately, so one failure doesn't hide the others:

```bash
npx tsc --noEmit -p .
npm run build
npm run verify:game-client
npm run verify:supabase-transport
npm run verify:werewolf
npm run verify:checkpoint
npm run verify:game-action
npm run verify:game-timeout
npm run verify:realtime-game
```

Also run any `verify:<id>` script added since this list was written (`grep verify: package.json`).

**Never** run `npm run verify:live-game` as part of the gate. It writes to the real Supabase
project. Run it only when the user asks.

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
  - Edge Function redeploy needed                   ← whenever src/features/games/** or supabase/functions/** changed
```

State failures as failures, with output. Don't call work done while the gate is red.
