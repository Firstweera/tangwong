import { useState, useEffect, useCallback, useRef } from 'react';
import type { Player, Room, RoomSettings } from '@/types';
import { createChannel } from '@/services/realtime';
import type { CrossTabChannel, SyncedRoom, RealtimeRoomMessage } from '@/services/realtime';
import { BOT_POOL } from '@/data';
import * as store from '../stores/roomRealtime';

const HEARTBEAT_MS = 3_000;

export interface UseRealtimeRoomReturn {
  room: SyncedRoom;
  players: Player[];
  /** Whether a player has marked ready. */
  isReady: (player: Player) => boolean;
  readyCount: number;
  /** Whether a player's heartbeat is recent. */
  isOnline: (player: Player) => boolean;
  setReady: (ready: boolean) => void;
  updateSettings: (settings: Partial<RoomSettings>) => void;
  /** Host action: add a filler bot (no-op when the room is full). */
  addBot: () => void;
  /** Host action: remove another player from the room. */
  kick: (playerId: string) => void;
  /** Host action: hand the host role to another player. */
  transferHost: (playerId: string) => void;
  /** Explicitly leave the room (removes self + notifies others). */
  leave: () => void;
}

export interface UseRealtimeRoomOptions {
  /** Fired once when the current player is removed by someone else (kicked). */
  onRemoved?: () => void;
}

/**
 * useRealtimeRoom — joins the shared room for `seed.code`, keeps it synced across
 * tabs (BroadcastChannel + a presence heartbeat), and exposes room mutations.
 * Transport is swappable: the same surface is satisfied by a Socket.io adapter.
 */
export function useRealtimeRoom(seed: Room, player: Player, options: UseRealtimeRoomOptions = {}): UseRealtimeRoomReturn {
  const code = seed.code;
  const meId = player.id;

  // Join (or create) once on mount, before first paint.
  const [room, setRoom] = useState<SyncedRoom>(() => store.joinRoom(code, player, seed, Date.now()));
  const channelRef = useRef<CrossTabChannel<RealtimeRoomMessage> | null>(null);
  // Track removal so we fire onRemoved at most once and never on voluntary leave.
  const leftRef = useRef(false);
  const removedFiredRef = useRef(false);
  const onRemovedRef = useRef(options.onRemoved);
  onRemovedRef.current = options.onRemoved;

  const reload = useCallback(() => {
    const next = store.loadRoom(code);
    if (next) setRoom(next);
  }, [code]);

  const broadcast = useCallback(() => {
    channelRef.current?.post({ type: 'room:update' });
  }, []);

  useEffect(() => {
    // Re-join when the room or identity changes (covers navigation + nickname edits).
    setRoom(store.joinRoom(code, player, seed, Date.now()));
    broadcast();

    const channel = createChannel<RealtimeRoomMessage>(`tw_room:${code}`);
    channelRef.current = channel;
    const unsub = channel.subscribe(reload);

    // localStorage fallback when BroadcastChannel is unavailable.
    const onStorage = (e: StorageEvent) => { if (e.key === `tw_room_${code}`) reload(); };
    window.addEventListener('storage', onStorage);

    // Presence heartbeat: refresh own last-seen and prune stale members locally.
    const beat = window.setInterval(() => {
      const next = store.touchPresence(code, meId, Date.now());
      if (next) setRoom(next);
    }, HEARTBEAT_MS);

    return () => {
      unsub();
      channel.close();
      channelRef.current = null;
      window.removeEventListener('storage', onStorage);
      window.clearInterval(beat);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, meId]);

  const setReady = useCallback((ready: boolean) => {
    const next = store.setReady(code, meId, ready);
    if (next) { setRoom(next); broadcast(); }
  }, [code, meId, broadcast]);

  const updateSettings = useCallback((settings: Partial<RoomSettings>) => {
    const next = store.updateSettings(code, settings);
    if (next) { setRoom(next); broadcast(); }
  }, [code, broadcast]);

  const addBot = useCallback(() => {
    const used = new Set(room.players.map(p => p.mascot));
    const def = BOT_POOL.find(b => !used.has(b.mascot)) ?? BOT_POOL[room.players.length % BOT_POOL.length];
    const id = `bot_${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
    const bot: Player = { id, name: def.name, en: 'Bot', mascot: def.mascot, online: true, bot: true };
    const next = store.addBot(code, bot);
    if (next) { setRoom(next); broadcast(); }
  }, [code, room.players, broadcast]);

  const kick = useCallback((playerId: string) => {
    if (playerId === meId) return;
    store.leaveRoom(code, playerId);
    reload();
    broadcast();
  }, [code, meId, reload, broadcast]);

  const transferHost = useCallback((playerId: string) => {
    const next = store.transferHost(code, playerId);
    if (next) { setRoom(next); broadcast(); }
  }, [code, broadcast]);

  const leave = useCallback(() => {
    leftRef.current = true;
    store.leaveRoom(code, meId);
    broadcast();
  }, [code, meId, broadcast]);

  // Detect being removed by someone else (kicked) and notify once.
  useEffect(() => {
    if (leftRef.current || removedFiredRef.current) return;
    if (!room.players.some(p => p.id === meId)) {
      removedFiredRef.current = true;
      onRemovedRef.current?.();
    }
  }, [room, meId]);

  const now = Date.now();
  const readyCount = room.players.filter(p => room.ready[p.id]).length;

  return {
    room,
    players: room.players,
    isReady: (p) => !!room.ready[p.id],
    readyCount,
    isOnline: (p) => store.isOnline(room, p.id, now),
    setReady,
    updateSettings,
    addBot,
    kick,
    transferHost,
    leave,
  };
}
