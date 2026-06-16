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
  players: string;
  mins: string;
  heat: GameHeat;
  g: [string, string];
  accent: string;
  desc: string;
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

export interface ChatMessage {
  who: string;
  text: string;
  t: string;
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

export type RoomStatus = 'waiting' | 'starting' | 'in-game';

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
