// createGameClient — framework-agnostic game client (boardgame.io-style API).
//
//   const client = createGameClient<AvalonPublic, AvalonPrivate, AvalonMoves>({
//     playerId: meId,
//     transport: localMaster.transport,
//   });
//   client.start();
//   client.subscribe(() => render(client.getState()));
//   await client.moves.VOTE_TEAM({ approve: true });
//
// The client never runs game rules itself — it forwards intents to the
// transport and mirrors the redacted snapshots it receives.
import type {
  ClientSnapshot,
  GameClient,
  GameTransport,
  MoveMap,
  MoveResult,
  Moves,
} from './types.ts';
import type { RoomState } from '../types.ts';

export interface CreateGameClientOptions<TPublic, TPrivate> {
  playerId: string;
  transport: GameTransport<TPublic, TPrivate>;
  /** Connect immediately (default true). */
  autoStart?: boolean;
}

export function createGameClient<TPublic = unknown, TPrivate = unknown, TMoves extends MoveMap = MoveMap>(
  options: CreateGameClientOptions<TPublic, TPrivate>,
): GameClient<TPublic, TPrivate, TMoves> {
  const { playerId, transport } = options;
  const listeners = new Set<() => void>();
  let disconnect: (() => void) | null = null;
  let pending = 0;
  /** True while `snapshot.error` came from the transport (sync) rather than a move. */
  let syncError = false;

  // Snapshot object identity only changes when something changed, so it is
  // safe to hand straight to React's useSyncExternalStore.
  let snapshot: ClientSnapshot<TPublic, TPrivate> = {
    status: 'idle',
    match: null,
    state: null,
    version: -1,
    busy: false,
    error: null,
  };

  const set = (patch: Partial<ClientSnapshot<TPublic, TPrivate>>) => {
    snapshot = { ...snapshot, ...patch };
    listeners.forEach(l => l());
  };

  const run = async (op: () => Promise<MoveResult>): Promise<MoveResult> => {
    pending += 1;
    set({ busy: true });
    let result: MoveResult;
    try {
      result = await op();
    } catch (err) {
      result = { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
    pending -= 1;
    syncError = false;
    set({ busy: pending > 0, error: result.ok ? null : result.error });
    return result;
  };

  const submit = (type: string, payload: unknown) =>
    run(() => transport.submit({ type, playerId, payload: payload ?? null }));

  // Proxy so every action type is callable without a hand-written list;
  // the TMoves generic keeps call sites typed.
  const moves = new Proxy({} as Moves<TMoves>, {
    get: (_target, key) =>
      typeof key === 'string' ? (payload: unknown) => submit(key, payload) : undefined,
  });

  const client: GameClient<TPublic, TPrivate, TMoves> = {
    playerId,
    moves,
    getState: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    submit,
    startGame: (opts?: { room?: RoomState; restart?: boolean }) =>
      run(() => transport.start(playerId, opts)),
    timeout: () => run(() => transport.timeout(playerId)),
    start() {
      if (disconnect) return;
      set({ status: 'connecting' });
      disconnect = transport.connect(playerId, next => {
        if ('error' in next) {
          syncError = true;
          set({ status: snapshot.state ? snapshot.status : 'error', error: next.error });
          return;
        }
        // Ignore stale/out-of-order snapshots.
        if (next.version < snapshot.version) return;
        // A good snapshot clears a sync error, but not a rejected-move error.
        const error = syncError ? null : snapshot.error;
        syncError = false;
        set({ status: 'ready', match: next.match, state: next.state, version: next.version, error });
      });
      // A transport may deliver synchronously; otherwise we stay "connecting".
    },
    stop() {
      disconnect?.();
      disconnect = null;
      set({ status: 'idle' });
    },
  };

  if (options.autoStart !== false) client.start();
  return client;
}
