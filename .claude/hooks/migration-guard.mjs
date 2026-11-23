#!/usr/bin/env node
// PreToolUse hook (Edit | Write | MultiEdit): never change a committed migration.
//
// Rule owner: .ai/supabase.md §5. Applied migrations must keep their meaning; a schema
// change is a NEW numbered file. A migration that is not yet committed may still be
// edited freely. Exit 2 blocks the tool call and shows stderr to Claude.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';

let input;
try {
  input = JSON.parse(readFileSync(0, 'utf8'));
} catch {
  process.exit(0); // not our business if the payload is unreadable
}

const projectDir = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
const filePath = input?.tool_input?.file_path;
if (typeof filePath !== 'string' || filePath === '') process.exit(0);

const abs = isAbsolute(filePath) ? filePath : resolve(projectDir, filePath);
const rel = relative(projectDir, abs).split('\\').join('/');
if (!rel.startsWith('supabase/migrations/')) process.exit(0);

let tracked = false;
try {
  execFileSync('git', ['ls-files', '--error-unmatch', rel], { cwd: projectDir, stdio: 'ignore' });
  tracked = true;
} catch {
  tracked = false; // new or untracked migration: allowed
}

if (tracked) {
  process.stderr.write(
    `Blocked by migration-guard: ${rel} is a committed migration and may already be applied.\n` +
      'Do not edit it. Add a new numbered migration (supabase/migrations/NNNN_<name>.sql) instead ' +
      '(.ai/supabase.md §5). If this edit is truly needed, stop and ask the user.\n',
  );
  process.exit(2);
}
process.exit(0);
