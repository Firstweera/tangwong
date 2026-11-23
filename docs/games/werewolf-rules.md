# Werewolf — Engine Rules Spec (Game #2)

Canonical mechanics for our Werewolf-inspired social-deduction game, written as
an **engine spec** so the implementation (Epic 6.5 Phase B) stays accurate and
testable. These are the public-domain "Werewolf / Mafia" folk-game mechanics,
**adapted** to TangWong's generic game engine. We do **not** copy any commercial
product's proprietary role names, artwork, or rulebook text (per AGENTS.md §2.5); use
our own Thai/English names and descriptions.

Status: reference for B1 (engine) / B3 (UI). Update this doc first if a rule
changes, then the engine — the doc is the source of truth for play behaviour.

Mechanics references (folk-game rules, **adapted** — names/text are our own):
online-station.net/entertainment/690636 (Thai community ruleset) and common
Werewolf/Mafia rules. TangWong uses a **plurality with tie = no elimination**
variant so public vote counts stay decisive without adding a runoff phase.

---

## 1. Teams & objective

Two teams (MVP). Hidden roles; a player knows only their own role (and what their
role is allowed to see).

| Team | Thai | Wins when… |
|------|------|------------|
| **Village** (good) | ฝ่ายชาวบ้าน | every Werewolf is eliminated |
| **Werewolves** (evil) | ฝ่ายหมาป่า | Werewolves ≥ remaining Villagers (parity) — they can no longer be out-voted |

Win is checked **after every elimination** (after dawn resolve and after a lynch).
If both conditions could read true on the same tick, evil parity is the tie-break
to evaluate last (a lynch that kills the last werewolf = village win even if it
also reaches parity).

---

## 2. Phase cycle (state machine)

```
setup → roleReveal → night → dawn → dayDiscuss → dayVote → resolve
                        ▲                                      │
                        └──────────────  (no winner)  ─────────┘
                                                              │ (winner)
                                                            → end
```

| Phase | Who acts | What happens | Advance when |
|-------|----------|--------------|--------------|
| `roleReveal` | host | each player privately views their role + night abilities | host `CONTINUE` |
| `night` | role-holders (private, simultaneous) | each Werewolf casts one private pack vote; Seer inspects; Doctor protects; … | all required night actions submitted (or timer) |
| `dawn` | host / auto | resolve night: apply kill unless protected; announce death(s) + reveal the dead player's role; deliver Seer result privately | host `CONTINUE` (or auto after a short reveal) |
| `dayDiscuss` | living players | open chat to deduce; no game action | timer expires → `dayVote` |
| `dayVote` | living players | each living player casts one lynch vote (or abstain) | every living player voted (or timer) |
| `resolve` | host / auto | lynch the plurality target; reveal role; check win | host `CONTINUE` → back to `night`, or `end` |

Notes
- **First night**: same as any night. (No special "no-kill first night" rule in
  MVP; can be added as a config flag later.)
- **Dead players** never act, never vote, and are skipped by all "all-voted" /
  "all-acted" completion checks. Dead players may still read public state (and a
  ghost/spectator chat later).
- Phases are declared with `PhaseConfig` + `PhaseTransition` (`when:'condition'`
  for the night→…→resolve→night loop), exactly like Avalon. No engine-core change.

---

## 3. Roles (MVP set)

Keep the MVP small and provably balanced, then expand. Each role has: team, an
optional **night action**, and what it **sees** at setup.

| Role | Team | Night action | Sees at setup |
|------|------|--------------|---------------|
| **Werewolf** | evil | cast one vote for the night victim; see the pack-only live tally | the other Werewolves |
| **Villager** | good | — | nothing |
| **Seer** | good | inspect one player → learn `evil` / `not-evil` | nothing (learns over time) |
| **Doctor** (Guardian) | good | protect one player from the night kill | nothing |

"Doctor" is also commonly called **Bodyguard / Guardian** — same ability.

Future roles (not in MVP, design later), confirmed by the community ruleset:

- **Hunter** — when eliminated (lynched or killed), immediately takes one other
  living player down with them.
- **Witch** — has two one-time potions for the whole game: one **save** (negate a
  night kill) and one **kill** (eliminate a player at night).
- plus later: Drunk/Minion variants and neutral roles (Jester, Tanner) with their
  own win conditions.

Add each as a new `ActionDef` + setup vision; the framework already supports it.
Note: Hunter needs a **death-triggered action** (an elimination that opens a
follow-up choice) — design that hook when Hunter lands, not in the MVP.

### Role abilities — exact behaviour

- **Werewolf victim**: every living Werewolf casts **one** vote per night. The
  live tally (target + vote count, never voter identity) is visible only to living
  Werewolves. The target with the most votes is attacked; a tie for the lead means
  the pack fails to choose and nobody is attacked. Wolves may target any living
  player except themselves; bots never target a known fellow Werewolf.
- **Seer**: inspects exactly one **living** player per night; privately learns
  whether that player is on the evil team (`evil`) or not (`not-evil`). The Seer
  reads the **pre-kill** state of that night. Result is stored in the Seer's
  private data (history of inspections), never public.
- **Doctor**: protects one **living** player per night. If the wolves' victim is
  the protected player, **no one dies** that night. MVP constraints (configurable):
  may **not** protect the same player two nights in a row; **may** self-protect
  (toggle later if it proves too strong).

### Night resolution order (deterministic)

1. Collect all night submissions (wolf target, doctor protect, seer inspect).
2. **Protection** applies first.
3. **Kill** applies: victim dies unless protected.
4. **Seer** result is computed from the pre-kill snapshot (so inspecting the
   victim still returns their true team even if they die this night).
5. Mark deaths, reveal dead roles publicly, check win.

---

## 4. Voting / lynch rules (dayVote → resolve)

- Each **living** player casts at most one vote for a living target, or abstains.
- The living target with the most votes is lynched (**plurality**).
- A tie for the highest count means **no one is lynched** that day.
- A lynched player's role is **revealed** publicly.
- Abstaining is allowed; if everyone abstains, no lynch.
- Votes are **public** as they are cast (Werewolf-style open voting) so the
  village can reason about behaviour — mirror Avalon's vote-reveal treatment.

---

## 5. Composition (roles per player count)

Werewolves scale roughly 1 per ~3–4 players; the rest are Village, with the Seer
and Doctor present once the table is large enough. Tune during playtesting.

| Players | Werewolves | Seer | Doctor | Villagers |
|--------:|:----------:|:----:|:------:|:---------:|
| 5 | 1 | 1 | 1 | 2 |
| 6 | 2 | 1 | 1 | 2 |
| 7 | 2 | 1 | 1 | 3 |
| 8 | 2 | 1 | 1 | 4 |
| 9 | 3 | 1 | 1 | 4 |
| 10 | 3 | 1 | 1 | 5 |

(MVP target is 5–10 players, same band as Avalon. These numbers are a starting
table to balance, not final.)

---

## 6. Hidden-information model (maps to our RLS + redaction)

- **Role** lives in each player's private slice (`game_private`, owner-only RLS) —
  same boundary verified for Avalon.
- **Werewolves see each other**: baked into each wolf's private `sees` at deal
  time (the Avalon vision pattern), so no extra channel is needed.
- **Seer results** accumulate in the Seer's private data only.
- **Night targets** (the pack tally, who each wolf picked, who the doctor
  protected) stay hidden until resolved. The pack tally is duplicated only into
  living Werewolves' private slices; it never enters public game state. Only the
  **outcome** becomes public at dawn. Action logs must redact night targets like
  Avalon redacts mission cards.
- `redactStateFor` stays generic (drops other players' private slices); the
  game-specific redaction (hide live night targets in the public action log) lives
  in the Werewolf action handlers / the server's public-payload mapper.

---

## 7. Mapping to the TangWong engine (build checklist for B1)

- **Public data (`WerewolfPublic`)**: `playerOrder`, `alive: Record<id,bool>` (or
  `eliminated: string[]`), `dayCount`, current `votes`, last night's `deaths`
  (+ revealed roles), lynch result, per-phase timers.
- **Private data (`WerewolfPrivate`)**: `role`, `team`, `sees` (fellow wolves),
  `seerHistory` (inspected → result).
- **Alive/eliminated**: use the generic player-lifecycle helpers from Epic 6.5 A3
  (`isAlive` / `alivePlayers` / `eliminate`); all completion + win checks count
  only the living.
- **Actions** (`ActionDef`s): `WEREWOLF_KILL`, `SEER_PEEK`, `DOCTOR_SAVE`
  (night, simultaneous — reuse the A5 night-action helper), `LYNCH_VOTE` (day),
  `CONTINUE` (host phase advance), plus future role actions.
- **Phases**: `PhaseConfig` graph from §2 with `when:'condition'` transitions for
  the loop and `all-voted`/timer for night + dayVote.
- **Win conditions** (`WinCondition[]`): `all-werewolves-dead` (village),
  `werewolves-reach-parity` (evil) — checked after each elimination.
- **Bots** (`nextBotAction`): wolves join the pack's leading night target (or use
  a shared deterministic target before any vote); Seer inspects an unchecked
  living player; Doctor protects a likely target (not self twice). During the day,
  bots converge on a shared suspicion candidate instead of scattering every vote;
  Seer knowledge overrides that heuristic and wolves coordinate on a non-wolf.
- **Registry**: one entry each in the client + server game registries (A1/A2).

---

## 8. Open questions to settle during B1 (defaults in **bold**)

- Reveal a lynched/killed player's role? **Yes** (classic, easier to follow).
- Doctor self-save? **Allowed**, but not the same target two nights running.
- First-night kill? **Yes** (no protected first night in MVP).
- Lynch threshold? **Plurality**; a tie for the lead → **no elimination**.
- Wolf target selection with multiple wolves? **One vote per living Werewolf**;
  pack-only live tally, plurality target is attacked, tie → no attack.
