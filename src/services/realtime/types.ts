// Realtime domain types — the transport-agnostic contract for room sync.
//
// The current implementation is cross-tab (BroadcastChannel + localStorage).
// A production Socket.io adapter implements the same `RealtimeService` shape,
// so feature code (hooks, components) never imports a transport directly.
import type { Player, Room, RoomSettings } from '@/types';

/**
 * SyncedRoom — the shared, authoritative room snapshot every client converges
 * on. Extends the UI `Room` with realtime-only fields.
 */
export interface SyncedRoom extends Room {
  /** playerId → ready flag. */
  ready: Record<string, boolean>;
  /** playerId → last-seen epoch ms (presence heartbeat). */
  presence: Record<string, number>;
}

export type RealtimeRoomMessage =
  | { type: 'room:update' }   // the shared room snapshot changed — reload it
  | { type: 'room:closed' };  // the room was torn down

export type RealtimeChatMessage = { type: 'chat:update' };

/**
 * RealtimeService — the seam a Socket.io transport drops into. Not yet consumed
 * directly (the cross-tab hooks implement this behaviour inline), but documents
 * the contract the production transport must satisfy.
 */
export interface RealtimeService {
  joinRoom(code: string, player: Player, seed: Room): SyncedRoom;
  leaveRoom(code: string, playerId: string): void;
  setReady(code: string, playerId: string, ready: boolean): SyncedRoom | null;
  updateSettings(code: string, settings: Partial<RoomSettings>): SyncedRoom | null;
  onRoomChange(code: string, handler: () => void): () => void;
}
