// TangWong — shared domain types
// All game-agnostic types that cross feature boundaries live here.

// ─── Mascots ───────────────────────────────────────────────────────────────

export type MascotKey =
  | 'fox' | 'owl' | 'cat' | 'raccoon' | 'panda' | 'rabbit'
  | 'bear' | 'tiger' | 'frog' | 'koala' | 'wolf' | 'lion'
  | 'deer' | 'hamster';

export interface Mascot {
  em: string;
  g: [string, string];
}

// ─── Players / Friends ─────────────────────────────────────────────────────

export interface Player {
  id: string;
  name: string;
  en: string;
  mascot: MascotKey;
  online: boolean;
  /** True for filler bots added to a room (always ready, auto-played). */
  bot?: boolean;
}

export type FriendStatus = 'in-room' | 'playing' | 'online' | 'away';

export interface Friend extends Player {
  status: FriendStatus;
}

export interface FriendStatusInfo {
  label: string;
  color: string;
}

// ─── Games catalog ─────────────────────────────────────────────────────────

export type GameHeat = 'HOT' | 'NEW' | '';

export interface Game {
  id: string;
  name: string;
  th: string;
  tag: string;
  th_tag: string;
  emoji: string;
  /** Display range, e.g. "5–10". Keep in sync with min/maxPlayers. */
  players: string;
  /** Fewest players this game supports. */
  minPlayers: number;
  /** Most players this game supports — caps room size on create. */
  maxPlayers: number;
  mins: string;
  heat: GameHeat;
  g: [string, string];
  accent: string;
  desc: string;
  /** Whether the game has a working engine and is playable. Games without one
   *  are shown disabled ("เร็วๆ นี้") until their engine lands. */
  available: boolean;
}

// ─── Avalon types ──────────────────────────────────────────────────────────

export type RoleSide = 'good' | 'evil';

export interface Role {
  name: string;
  th: string;
  side: RoleSide;
  em: string;
  desc: string;
}

export type RoleKey = 'merlin' | 'percival' | 'servant' | 'morgana' | 'assassin' | 'mordred' | 'minion';

export interface Quest {
  size: number;
  fails: number;
}

// ─── Chat ─────────────────────────────────────────────────────────────────

export type ChatMessageKind = 'user' | 'system';

export interface ChatReaction {
  emoji: string;
  /** playerIds who reacted with this emoji. */
  by: string[];
}

export interface ChatMessage {
  id: string;
  kind: ChatMessageKind;
  /** Sender playerId; empty string for system messages. */
  who: string;
  text: string;
  /** Epoch milliseconds. */
  ts: number;
  reactions: ChatReaction[];
}

// ─── Navigation ────────────────────────────────────────────────────────────

export type Screen =
  | 'home' | 'lobby' | 'game' | 'result'
  | 'games' | 'friends' | 'profile' | 'ds';

/** Navigate to a named screen */
export type GoFn = (screen: Screen, payload?: unknown) => void;

/** Show a toast notification */
export type ShowToastFn = (message: string, emoji?: string) => void;

// ─── Room ───────────────────────────────────────────────────────────────────

export type RoomStatus = 'waiting' | 'starting' | 'in-game' | 'ended';

export interface RoomSettings {
  name: string;
  maxPlayers: number;
  isPublic: boolean;
  gameId: string;
}

export interface Room {
  id: string;
  code: string;
  name: string;
  maxPlayers: number;
  isPublic: boolean;
  gameId: string;
  hostId: string;
  players: Player[];
  status: RoomStatus;
  inviteLink: string;
  createdAt: number;
}
