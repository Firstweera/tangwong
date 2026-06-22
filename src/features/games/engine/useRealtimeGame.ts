import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ensureSession } from '@/services/supabase/auth';
import { useSupabaseTransport } from '@/services/supabase/client';
import * as gameService from '@/services/supabase/game';
import type { SyncedRoom } from '@/services/realtime';
import type { GameState } from './types';
import type { AvalonPrivate, AvalonPublic } from '../avalon/types';

type S = GameState<AvalonPublic, AvalonPrivate>;

export interface UseRealtimeGameReturn {
  enabled: boolean;
  room: SyncedRoom | null;
  state: S | null;
  meId: string | null;
  loading: boolean;
  busy: boolean;
  error: string | null;
  refresh: () => Promise<gameService.RealtimeGameSnapshot | null>;
  start: () => Promise<void>;
  submitAction: (type: string, payload: unknown) => Promise<void>;
}

export function useRealtimeGame(roomCode?: string | null, fallbackMeId?: string | null): UseRealtimeGameReturn {
  const [room, setRoom] = useState<SyncedRoom | null>(null);
  const [state, setState] = useState<S | null>(null);
  const [meId, setMeId] = useState<string | null>(fallbackMeId ?? null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (!useSupabaseTransport) {
      setMeId(fallbackMeId ?? null);
      return;
    }

    let cancelled = false;
    ensureSession().then(user => {
      if (!cancelled && mounted.current) setMeId(user?.id ?? fallbackMeId ?? null);
    });
    return () => { cancelled = true; };
  }, [fallbackMeId]);

  const refresh = useCallback(async () => {
    if (!useSupabaseTransport || !roomCode) return null;
    setLoading(true);
    setError(null);
    try {
      const snapshot = await gameService.fetchGame(roomCode);
      if (mounted.current) {
        setRoom(snapshot.room);
        setState(snapshot.state);
      }
      return snapshot;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load game';
      if (mounted.current) setError(message);
      return null;
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [roomCode]);

  useEffect(() => {
    setRoom(null);
    setState(null);
    if (useSupabaseTransport && roomCode && meId) void refresh();
  }, [roomCode, meId, refresh]);

  const roomId = room?.id ?? state?.room.roomId ?? null;
  useEffect(() => {
    if (!useSupabaseTransport || !roomId) return undefined;
    return gameService.subscribeGame(roomId, () => { void refresh(); });
  }, [roomId, refresh]);

  const start = useCallback(async () => {
    if (!useSupabaseTransport || !roomCode) return;
    setBusy(true);
    setError(null);
    try {
      await gameService.startGame(roomCode);
      await refresh();
    } catch (err) {
      if (mounted.current) setError(err instanceof Error ? err.message : 'Unable to start game');
    } finally {
      if (mounted.current) setBusy(false);
    }
  }, [roomCode, refresh]);

  const submitAction = useCallback(async (type: string, payload: unknown) => {
    if (!useSupabaseTransport || !roomCode) return;
    setBusy(true);
    setError(null);
    try {
      await gameService.submitAction(roomCode, type, payload);
      await refresh();
    } catch (err) {
      if (mounted.current) setError(err instanceof Error ? err.message : 'Unable to submit action');
    } finally {
      if (mounted.current) setBusy(false);
    }
  }, [roomCode, refresh]);

  return useMemo(() => ({
    enabled: useSupabaseTransport,
    room,
    state,
    meId,
    loading,
    busy,
    error,
    refresh,
    start,
    submitAction,
  }), [room, state, meId, loading, busy, error, refresh, start, submitAction]);
}
