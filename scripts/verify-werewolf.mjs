/**
 * Verify Werewolf engine — static source checks.
 * Run with: npm run verify:werewolf
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) { console.log(`  ✅  ${msg}`); passed++; }
  else       { console.error(`  ❌  FAIL: ${msg}`); failed++; process.exitCode = 1; }
}

function src(rel) {
  const p = resolve(root, rel);
  if (!existsSync(p)) return null;
  return readFileSync(p, 'utf8');
}

function check(rel, label, ...patterns) {
  const code = src(rel);
  assert(code !== null, `${label} — file exists`);
  if (!code) return;
  for (const [pat, desc] of patterns) {
    assert(typeof pat === 'string' ? code.includes(pat) : pat.test(code), `${label} — ${desc}`);
  }
}

// ── types.ts ──────────────────────────────────────────────────────────────────
check(
  'src/features/games/werewolf/types.ts',
  'types',
  ["WerewolfRole",                 "defines WerewolfRole union"],
  ["WerewolfTeam",                 "defines WerewolfTeam"],
  ["WerewolfPublic",               "defines WerewolfPublic interface"],
  ["WerewolfPrivate",              "defines WerewolfPrivate interface"],
  ["eliminatedPlayers",            "WerewolfPublic has eliminatedPlayers"],
  ["nightResolved",                "WerewolfPublic has nightResolved flag"],
  ["voteResolved",                 "WerewolfPublic has voteResolved flag"],
  ["seerHistory",                  "WerewolfPrivate has seerHistory"],
  ["doctorLastProtected",          "WerewolfPrivate has doctorLastProtected"],
  ["DeathRecord",                  "defines DeathRecord"],
  ["SeerInspection",               "defines SeerInspection"],
);

// ── setup.ts ──────────────────────────────────────────────────────────────────
check(
  'src/features/games/werewolf/setup.ts',
  'setup',
  ["COMPOSITION",                  "has composition table"],
  ["compositionFor",               "exports compositionFor"],
  ["buildPublicState",             "exports buildPublicState"],
  ["buildPrivateState",            "exports buildPrivateState"],
  ["werewolves: 1",                "5p → 1 wolf"],
  ["werewolves: 2",                "6-8p → 2 wolves"],
  ["werewolves: 3",                "9-10p → 3 wolves"],
  ["shuffle",                      "shuffles roles"],
  ["wolfIds",                      "assigns wolf vision"],
  ["sees:",                        "sets sees field"],
  ["seerHistory: []",              "initialises seerHistory"],
  ["doctorLastProtected: null",    "initialises doctorLastProtected"],
);

// ── phases.ts ─────────────────────────────────────────────────────────────────
check(
  'src/features/games/werewolf/phases.ts',
  'phases',
  ["WEREWOLF_PHASES",              "exports WEREWOLF_PHASES"],
  ["roleReveal",                   "has roleReveal phase"],
  ["night",                        "has night phase"],
  ["dawn",                         "has dawn phase"],
  ["dayDiscuss",                   "has dayDiscuss phase"],
  ["dayVote",                      "has dayVote phase"],
  ["resolve",                      "has resolve phase"],
  ["WEREWOLF_KILL",                "night allows WEREWOLF_KILL"],
  ["SEER_PEEK",                    "night allows SEER_PEEK"],
  ["DOCTOR_SAVE",                  "night allows DOCTOR_SAVE"],
  ["LYNCH_VOTE",                   "dayVote allows LYNCH_VOTE"],
  ["nightResolved",                "night→dawn condition checks nightResolved"],
  ["voteResolved",                 "dayVote→resolve condition checks voteResolved"],
);

// ── actions.ts ────────────────────────────────────────────────────────────────
check(
  'src/features/games/werewolf/actions.ts',
  'actions',
  ["WEREWOLF_ACTIONS",             "exports WEREWOLF_ACTIONS"],
  ["WEREWOLF_KILL",                "defines WEREWOLF_KILL"],
  ["SEER_PEEK",                    "defines SEER_PEEK"],
  ["DOCTOR_SAVE",                  "defines DOCTOR_SAVE"],
  ["LYNCH_VOTE",                   "defines LYNCH_VOTE"],
  ["CONTINUE",                     "defines CONTINUE"],
  ["resolveNight",                 "has resolveNight function"],
  ["allNightActed",                "has allNightActed check"],
  ["strict majority",              "lynch applies strict majority"],
  ["doctorLastProtected",          "cannot repeat protection"],
  ["same player two nights",       "no-repeat protection error message"],
  ["Wolves must agree",            "wolves must agree on same target"],
  ["nightResolved: true",          "resolveNight sets nightResolved=true"],
  ["voteResolved: true",           "LYNCH_VOTE sets voteResolved=true"],
  ["eliminate(",                   "uses eliminate helper"],
  ["alivePlayers(",                "uses alivePlayers helper"],
  ["dayCount: P(s).dayCount + 1",  "CONTINUE increments dayCount"],
);

// ── winConditions.ts ──────────────────────────────────────────────────────────
check(
  'src/features/games/werewolf/winConditions.ts',
  'winConditions',
  ["WEREWOLF_WIN_CONDITIONS",      "exports WEREWOLF_WIN_CONDITIONS"],
  ["village-wins",                 "village-wins condition"],
  ["wolves-parity",                "wolves-parity condition"],
  ["winnerTeam: 'good'",           "village win sets winnerTeam good"],
  ["winnerTeam: 'evil'",           "wolf win sets winnerTeam evil"],
  ["villageWins",                  "villageWins listed FIRST (tie-break)"],
  // village-wins must appear before wolves-parity in the export array
  [/villageWins[\s\S]*wolvesWin/,  "villageWins ordered before wolvesWin"],
);

// ── bot.ts ────────────────────────────────────────────────────────────────────
check(
  'src/features/games/werewolf/bot.ts',
  'bot',
  ["nextBotAction",                "exports nextBotAction"],
  ["nextAutoActor",                "exports nextAutoActor"],
  ["WEREWOLF_KILL",                "bot dispatches WEREWOLF_KILL"],
  ["SEER_PEEK",                    "bot dispatches SEER_PEEK"],
  ["DOCTOR_SAVE",                  "bot dispatches DOCTOR_SAVE"],
  ["LYNCH_VOTE",                   "bot dispatches LYNCH_VOTE"],
  ["seerHistory",                  "seer bot uses inspection history"],
  ["doctorLastProtected",          "doctor bot avoids repeat protection"],
);

// ── config.ts ─────────────────────────────────────────────────────────────────
check(
  'src/features/games/werewolf/config.ts',
  'config',
  ["werewolfConfig",               "exports werewolfConfig"],
  ["id: 'werewolf'",               "game id is werewolf"],
  ["minPlayers: 5",                "minPlayers is 5"],
  ["maxPlayers: 10",               "maxPlayers is 10"],
  ["autoAdvancePhase: true",       "autoAdvancePhase enabled"],
);

// ── index.ts ──────────────────────────────────────────────────────────────────
check(
  'src/features/games/werewolf/index.ts',
  'index barrel',
  ["werewolfConfig",               "re-exports werewolfConfig"],
  ["nextBotAction",                "re-exports nextBotAction"],
  ["WerewolfPublic",               "re-exports WerewolfPublic type"],
  ["WerewolfPrivate",              "re-exports WerewolfPrivate type"],
  ["DeathRecord",                  "re-exports DeathRecord"],
  ["SeerInspection",               "re-exports SeerInspection"],
);

// ── registry.ts fix ───────────────────────────────────────────────────────────
check(
  'src/features/games/registry.ts',
  'client registry (type fix)',
  ["GameEngineConfig<any, any>",   "config field uses any generics to accept all games"],
);

// ── summary ───────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(48)}`);
console.log(`Werewolf: ${passed} passed, ${failed} failed`);
