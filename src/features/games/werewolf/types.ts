// Werewolf — game-specific type definitions.
export type WerewolfRole = 'werewolf' | 'villager' | 'seer' | 'doctor' | 'cupid' | 'spellcaster';
export type WerewolfTeam = 'good' | 'evil';

export type WerewolfPhase =
  | 'roleReveal'
  | 'night'
  | 'dawn'
  | 'dayDiscuss'
  | 'dayVote'
  | 'resolve'
  | 'end';

export interface DeathRecord {
  playerId: string;
  role: WerewolfRole;
  cause: 'killed' | 'lynched' | 'heartbreak';
}

/** State visible to all players. */
export interface WerewolfPublic {
  /** All players in seating order (alive + dead). */
  playerOrder: string[];
  /** Dead player IDs — use engine's alivePlayers / isAlive helpers. */
  eliminatedPlayers: string[];
  /** Current day/night cycle number (starts at 1). */
  dayCount: number;

  // Night tracking
  /** Player IDs who have submitted their night action this cycle. */
  nightActors: string[];
  /** True once resolveNight has run — triggers night→dawn auto-advance. */
  nightResolved: boolean;

  // Day vote
  /** voterId → targetId (null = abstain). */
  votes: Record<string, string | null>;
  /** True once the final LYNCH_VOTE resolves — triggers dayVote→resolve auto-advance. */
  voteResolved: boolean;

  // Announcements (visible in dawn / resolve phases; cleared at start of next cycle)
  lastDeaths: DeathRecord[];
  /** Permanently public role reveals (dead players). */
  revealedRoles: Record<string, WerewolfRole>;

  /** Cupid's chosen lovers — set on night 1 and permanent for the rest of the game. */
  lovers: readonly [string, string] | null;
  /** Player silenced for the current day (cleared at start of next night). */
  silenced: string | null;
}

/** Per-player private state (owner-only RLS on the server). */
export interface SeerInspection {
  playerId: string;
  result: 'evil' | 'not-evil';
  dayCount: number;
}

export interface WerewolfPrivate {
  role: WerewolfRole;
  team: WerewolfTeam;
  /** Fellow wolf IDs for werewolves; [] for all others. */
  sees: string[];

  // Current-night action targets (cleared after night resolves)
  wolfTarget: string | null;
  /** Pack-only target tally, copied into every living wolf's private slice. */
  wolfVoteTally: Record<string, number>;
  seerTarget: string | null;
  doctorTarget: string | null;
  /** Spellcaster's chosen silence target for current night (cleared after night resolves). */
  silenceTarget: string | null;

  // Persistent state
  /** Last player the doctor protected (cannot repeat two nights in a row). */
  doctorLastProtected: string | null;
  /** All Seer inspections accumulated across the game. */
  seerHistory: SeerInspection[];
  /** ID of this player's lover (set by Cupid on night 1; null otherwise). */
  loverOf: string | null;
}
