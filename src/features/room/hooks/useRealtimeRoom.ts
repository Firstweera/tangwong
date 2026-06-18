import { useState, useEffect, useCallback, useRef } from 'react';
import type { Player, Room, RoomSettings } from '@/types';
import { createChannel } from '@/services/realtime';
import type { CrossTabChannel, SyncedRoom, RealtimeRoomMessage } from '@/services/realtime';
import { useSupabaseTransport, roomService, supabase } from '@/services/supabase';
import { BOT_POOL } from '@/data';
import * as store from '../stores/roomRealtime';

const HEARTBEAT_MS = 3_000;
const OFFLINE_MS = 10_000;

export interface UseRealtimeRoomReturn {
  room: SyncedRoom;
  players: Player[];
  /** The current player's identity as stored server-side (auth.uid() over Supabase,
   *  local id over cross-tab). Use this for host/ready/self checks — NOT player.id,
   *  which differs from the DB identity under the Supabase transport. */
  meId: string;
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

/** Pick a bot identity not already seated, like the cross-tab store does. */
function makeBot(seated: Player[]): Player {
  const used = new Set(seated.map(p => p.mascot));
  const def = BOT_POOL.find(b => !used.has(b.mascot)) ?? BOT_POOL[seated.length % BOT_POOL.length];
  const id = `bot_${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
  return { id, name: def.name, en: 'Bot', mascot: def.mascot, online: true, bot: true };
}

/**
 * useRealtimeRoom — joins the shared room for `seed.code`, keeps it synced, and
 * exposes room mutations. Transport is selected by `useSupabaseTransport`:
 * Supabase (server-authoritative, cross-device) or cross-tab (BroadcastChannel +
 * localStorage). Both satisfy the same surface, so callers never change.
 */
export function useRealtimeRoom(seed: Room, player: Player, options: UseRealtimeRoomOptions = {}): UseRealtimeRoomReturn {
  // The transport flag is a build-time constant, so the branch taken never
  // changes across renders — this conditional hook call is rules-of-hooks safe.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useSupabaseTransport ? useSupabaseRoom(seed, player, options) : useCrossTabRoom(seed, player, options);
}

// ─── Supabase transport (Phase 4.5.2) ───────────────────────────────────────

function useSupabaseRoom(seed: Room, player: Player, options: UseRealtimeRoomOptions): UseRealtimeRoomReturn {
  const code = seed.code;
  // player.id is a local UUID until the Supabase session resolves. The DB stores
  // auth.uid() as player_id, so we must resolve the real uid before joining — otherwise
  // kick detection compares the wrong IDs and immediately ejects the player.
  const [authUid, setAuthUid] = useState<string | null>(null);
  const meId = authUid ?? player.id;
  // Optimistic seed until the first fetch resolves (keeps `room` non-null).
  const [room, setRoom] = useState<SyncedRoom>(() => ({ ...seed, ready: {}, presence: {} }));
  const removedFiredRef = useRef(false);
  const leftRef = useRef(false);
  const onRemovedRef = useRef(options.onRemoved);
  onRemovedRef.current = options.onRemoved;
  // Refs so the async refresh reads current values without a stale closure.
  const syncedRef = useRef(false);
  const meIdRef = useRef(meId);
  meIdRef.current = meId;

  // Fire onRemoved exactly once (never on a voluntary leave).
  const fireRemoved = useCallback(() => {
    if (leftRef.current || removedFiredRef.current) return;
    removedFiredRef.current = true;
    onRemovedRef.current?.();
  }, []);

  // Resolve auth.uid() from the Supabase session. This may be set slightly after
  // the component mounts (anonymous sign-in is async). Once resolved, triggers join.
  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id) setAuthUid(session.user.id);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user?.id) setAuthUid(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, []);

  const refresh = useCallback(async () => {
    const next = await roomService.fetchRoom(code);
    if (next) {
      setRoom(next);
      // After the first sync, if I'm no longer in the roster I've been kicked.
      // (Once kicked, RLS hides room_players from me, so a public room reads back
      //  with an empty roster — not "everyone but me".)
      if (syncedRef.current && !next.players.some(p => p.id === meIdRef.current)) fireRemoved();
    } else if (syncedRef.current) {
      // The room is no longer readable: kicked from a private room (RLS now hides
      // the row), or the room was deleted. Either way I'm out.
      fireRemoved();
    }
    return next;
  }, [code, fireRemoved]);

  useEffect(() => {
    if (!authUid) return; // Wait for a real session before joining.
    let unsub = () => {};
    let beat = 0;
    let active = true;

    (async () => {
      const joined = await roomService.joinRoom(code, player, seed);
      if (!active) return;
      if (joined) { setRoom(joined); syncedRef.current = true; }
      const roomId = joined?.id ?? room.id;
      unsub = roomService.subscribeRoom(roomId, () => { void refresh(); });
      // Heartbeat: keep last_seen fresh AND re-fetch as a safety net so a kick is
      // detected within one tick even if the realtime delete event isn't delivered
      // to the (now non-member) client.
      beat = window.setInterval(() => {
        void roomService.touchPresence(code);
        void refresh();
      }, HEARTBEAT_MS);
    })();

    return () => {
      active = false;
      unsub();
      if (beat) window.clearInterval(beat);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, authUid]);

  const setReady = useCallback((ready: boolean) => {
    void roomService.setReady(code, ready).then(refresh);
  }, [code, refresh]);
  const updateSettings = useCallback((settings: Partial<RoomSettings>) => {
    void roomService.updateSettings(code, settings).then(refresh);
  }, [code, refresh]);
  const addBot = useCallback(() => {
    void roomService.addBot(code, makeBot(room.players)).then(refresh);
  }, [code, room.players, refresh]);
  const kick = useCallback((playerId: string) => {
    if (playerId === meId) return;
    void roomService.kickPlayer(code, playerId).then(refresh);
  }, [code, meId, refresh]);
  const transferHost = useCallback((playerId: string) => {
    void roomService.transferHost(code, playerId).then(refresh);
  }, [code, refresh]);
  const leave = useCallback(() => {
    leftRef.current = true;
    void roomService.leaveRoom(code);
  }, [code]);

  const now = Date.now();
  const readyCount = room.players.filter(p => room.ready[p.id]).length;

  return {
    room,
    players: room.players,
    meId,
    isReady: (p) => !!room.ready[p.id],
    readyCount,
    isOnline: (p) => !!p.bot || (room.presence[p.id] ?? 0) >= now - OFFLINE_MS,
    setReady, updateSettings, addBot, kick, transferHost, leave,
  };
}

// ─── Cross-tab transport (BroadcastChannel + localStorage) ───────────────────

function useCrossTabRoom(seed: Room, player: Player, options: UseRealtimeRoomOptions): UseRealtimeRoomReturn {
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
    const next = store.addBot(code, makeBot(room.players));
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
    meId,
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
