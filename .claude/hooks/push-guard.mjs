// PreToolUse hook (Bash): refuse a `git push` that would land on `main`, or any force push.
//
// Why: `main` is what Vercel deploys and what a human merges into (workflow §2). Claude
// pushes feature branches only. This makes that a fact rather than a promise; the
// settings.json `deny` list is the second layer for the plain spellings.
//
// Blocks: destination `main`/`master` (explicit refspec, `HEAD:main`, `HEAD` or no refspec
// while on main), `-f` / `--force*` / `+refspec`, `--all`, `--mirror`, `--delete main`.
// The command is tokenised like a shell: quotes respected, `&& || ; | &` split commands,
// heredoc bodies dropped. So `git commit -m "… git push origin main …"` is text, while
// `bash -c "git push origin main"` is read as the push it is. `$(…)` is not expanded.
//
// Exit 2 blocks and shows stderr to Claude; exit 0 allows. Unreadable input that mentions
// `push` fails closed. It never runs the command it inspects (only `git branch --show-current`).
import { execFileSync } from 'node:child_process';

const PROTECTED = new Set(['main', 'master']);
const OPERATORS = ['&&', '||', ';', '|', '&', '\n'];
const SHELLS = new Set(['bash', 'sh', 'zsh', 'dash']);
const PREFIXES = new Set(['sudo', 'env', 'command', 'nohup', 'time', 'exec']);
const GIT_VALUE_OPTS = new Set(['-C', '-c', '--git-dir', '--work-tree', '--namespace']);
const PUSH_VALUE_OPTS = new Set(['-o', '--push-option', '--repo', '--receive-pack', '--exec']);

const block = (reason) => {
  console.error(
    `push-guard: blocked — ${reason}.\n` +
      'Claude pushes feature branches only, without force (.ai/workflow.md §2). ' +
      'Branch first; pushing to main is for a person to do.',
  );
  process.exit(2);
};

const dropHeredocBodies = (text) =>
  text.replace(/(<<-?\s*['"]?(\w+)['"]?[^\n]*)\n[\s\S]*?\n\s*\2(?=\s|$)/g, '$1');

/** Split into commands (arrays of words), honouring quotes and backslashes. */
function tokenize(text) {
  const commands = [[]];
  let word = null;
  let quote = null;
  const endWord = () => {
    if (word !== null) commands.at(-1).push(word);
    word = null;
  };
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quote) {
      if (ch === quote) quote = null;
      else if (ch === '\\' && quote === '"' && i + 1 < text.length) word += text[(i += 1)];
      else word += ch;
      continue;
    }
    const op = OPERATORS.find((o) => text.startsWith(o, i));
    if (op) {
      endWord();
      commands.push([]);
      i += op.length - 1;
      continue;
    }
    if (ch === '"' || ch === "'") { quote = ch; word ??= ''; continue; }
    if (ch === '\\' && i + 1 < text.length) { word = (word ?? '') + text[(i += 1)]; continue; }
    if (/\s/.test(ch)) { endWord(); continue; }
    word = (word ?? '') + ch;
  }
  endWord();
  return commands.filter((c) => c.length > 0);
}

let currentBranch;
const onProtectedBranch = () => {
  if (currentBranch === undefined) {
    try {
      currentBranch = execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim();
    } catch {
      currentBranch = '';
    }
  }
  return PROTECTED.has(currentBranch);
};

const destinationOf = (refspec) => {
  const spec = refspec.startsWith('+') ? refspec.slice(1) : refspec;
  const dest = spec.includes(':') ? spec.split(':').pop() : spec;
  return dest.replace(/^refs\/heads\//, '');
};

function checkPush(args) {
  const positional = [];
  let deleting = false;
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (PUSH_VALUE_OPTS.has(a)) { i += 1; continue; }
    if (a === '-f' || a.startsWith('--force')) block('force push');
    if (a === '--all' || a === '--mirror') block(`push ${a}`);
    if (a === '-d' || a === '--delete') { deleting = true; continue; }
    if (a.startsWith('-')) continue;
    positional.push(a);
  }
  const refspecs = positional.slice(1); // first positional is the remote
  if (refspecs.length === 0) {
    if (onProtectedBranch()) block(`push from ${currentBranch} with no refspec`);
    return;
  }
  for (const spec of refspecs) {
    if (spec.startsWith('+')) block('force refspec');
    const dest = destinationOf(spec);
    if (PROTECTED.has(dest)) block(`${deleting ? 'delete' : 'push to'} ${dest}`);
    if (dest === 'HEAD' && onProtectedBranch()) block(`push HEAD while on ${currentBranch}`);
  }
}

function inspect(text, depth = 0) {
  if (depth > 3) return;
  for (let words of tokenize(dropHeredocBodies(text))) {
    while (words.length && (PREFIXES.has(words[0]) || /^\w+=/.test(words[0]))) words = words.slice(1);
    if (!words.length) continue;
    const exe = words[0].split('/').pop();
    if (SHELLS.has(exe)) {
      const c = words.indexOf('-c');
      if (c !== -1 && words[c + 1]) inspect(words[c + 1], depth + 1);
      continue;
    }
    if (exe !== 'git') continue;
    let i = 1;
    while (i < words.length && words[i].startsWith('-')) i += GIT_VALUE_OPTS.has(words[i]) ? 2 : 1;
    if (words[i] === 'push') checkPush(words.slice(i + 1));
  }
}

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { raw += chunk; });
process.stdin.on('end', () => {
  let command;
  try {
    command = JSON.parse(raw)?.tool_input?.command;
  } catch {
    if (/\bpush\b/.test(raw)) block('could not parse hook input');
    process.exit(0);
  }
  if (typeof command === 'string' && /\bpush\b/.test(command)) inspect(command);
  process.exit(0);
});
