// Online GameClient for a room — resolves the Supabase auth identity, then
// builds a GameClient over SupabaseTransport. Replaces useRealtimeGame.
//
// Lives outside engine/ because it depends on services/supabase; the engine
// and engine/client stay framework- and backend-free.
import { useEffect, useMemo, useState } from 'react';
import { createGameClient, useGameClient } from './engine';
import type { ClientSnapshot, GameClient } from './engine';
import { createSupabaseTransport, ensureSession } from '@/services/supabase';

export interface OnlineGameClient {
  /** null until auth resolves (or when disabled). */
  client: GameClient | null;
  snapshot: ClientSnapshot<unknown, unknown>;
  /** Auth user id once resolved; null before. */
  meId: string | null;
}

export function useOnlineGameClient(
  roomCode: string | null | undefined,
  enabled: boolean,
  fallbackMeId?: string | null,
): OnlineGameClient {
  const [meId, setMeId] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) { setMeId(null); return undefined; }
    let cancelled = false;
    ensureSession().then(user => {
      if (!cancelled) setMeId(user?.id ?? fallbackMeId ?? null);
    });
    return () => { cancelled = true; };
  }, [enabled, fallbackMeId]);

  // One client per (room, identity). Not connected until the effect below runs.
  const client = useMemo(
    () => (enabled && roomCode && meId
      ? createGameClient({ playerId: meId, transport: createSupabaseTransport({ roomCode }), autoStart: false })
      : null),
    [enabled, roomCode, meId],
  );

  useEffect(() => {
    if (!client) return undefined;
    client.start();
    return () => client.stop();
  }, [client]);

  const snapshot = useGameClient(client);
  return { client, snapshot, meId };
}
