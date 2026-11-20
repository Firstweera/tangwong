// Offline GameClient — runs a match in-memory through LocalTransport.
//
// The seat being viewed is played by hand; every other seat is auto-played by
// the game's bot policy (other humans in an offline room included, as before).
// The "🤖 ออโต้" toggle hands the viewed seat to the bot too.
//
// Devtools seat switching: `setViewSeat(id)` re-points the UI at another seat
// of the SAME match (boardgame.io Debug-panel style). Each seat gets its own
// GameClient, so the UI only ever receives that seat's redacted view.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createGameClient, createLocalMaster, useGameClient } from './engine';
import type { ClientSnapshot, GameClient, RoomState } from './engine';
import { getGameRuntime } from './runtime';

export interface LocalSeat {
  id: string;
  /** This seat is the one the UI renders and the player controls. */
  viewing: boolean;
  /** Played by the bot policy (any non-viewed seat, or the viewed seat with autoplay on). */
  auto: boolean;
  /** The seat has a legal move to make right now (god view — devtools only). */
  needsAction: boolean;
}

export interface LocalGameClient {
  client: GameClient | null;
  snapshot: ClientSnapshot<unknown, unknown>;
  /** Seat the UI is rendering (defaults to the local player). */
  viewSeat: string;
  setViewSeat: (playerId: string) => void;
  seats: LocalSeat[];
  autoPlay: boolean;
  toggleAutoPlay: () => void;
  /** Phase timer expired: play the viewed seat's default move (if it has one). */
  timeout: () => Promise<void>;
}

export function useLocalGameClient(
  gameId: string,
  roomState: RoomState,
  meId: string,
  enabled: boolean,
): LocalGameClient {
  // The match is created once per (game, room); later roster object identity
  // changes and seat switches must not restart it.
  const roomRef = useRef(roomState);
  roomRef.current = roomState;
  const [viewSeat, setViewSeatState] = useState(meId);
  const viewSeatRef = useRef(viewSeat);
  viewSeatRef.current = viewSeat;
  const [autoPlay, setAutoPlay] = useState(false);

  const session = useMemo(() => {
    const runtime = enabled ? getGameRuntime(gameId) : null;
    if (!runtime) return null;
    const master = createLocalMaster({
      config: runtime.config,
      firstPhase: runtime.firstPhase,
      nextBotAction: runtime.nextBotAction,
      revealForPublic: runtime.revealForPublic,
      botDelayMs: runtime.botDelayMs,
      // Read through the ref so a seat switch changes who the bots skip.
      isBot: id => id !== viewSeatRef.current,
      hostOnly: false,
      room: roomRef.current,
    });
    const clients = new Map<string, GameClient>();
    const clientFor = (seat: string) => {
      let c = clients.get(seat);
      if (!c) {
        c = createGameClient({ playerId: seat, transport: master.transport, autoStart: false });
        clients.set(seat, c);
      }
      return c;
    };
    return { master, runtime, clientFor };
  }, [enabled, gameId, roomState.roomId]);

  // New match → back to the local player's own seat, autoplay off.
  useEffect(() => {
    setViewSeatState(meId);
    viewSeatRef.current = meId;
    setAutoPlay(false);
  }, [session, meId]);

  const client = session ? session.clientFor(viewSeat) : null;

  useEffect(() => {
    if (!session || !client) return undefined;
    client.start();
    // StrictMode re-runs this effect; only the first run starts the match.
    if (!session.master.getFullState()) void client.startGame();
    return () => client.stop();
  }, [session, client]);

  const setViewSeat = useCallback((playerId: string) => {
    if (!session || playerId === viewSeatRef.current) return;
    viewSeatRef.current = playerId;
    setViewSeatState(playerId);
    setAutoPlay(session.master.isAutoPlay(playerId));
  }, [session]);

  const toggleAutoPlay = useCallback(() => {
    if (!session) return;
    const seat = viewSeatRef.current;
    const next = !session.master.isAutoPlay(seat);
    session.master.setAutoPlay(seat, next);
    setAutoPlay(next);
  }, [session]);

  const timeout = useCallback(async () => {
    const full = session?.master.getFullState();
    if (!session || !full || !client) return;
    // Act only for the viewed seat — auto seats move on their own, and an idle
    // seat has nothing to time out (no error toast offline).
    const action = session.runtime.nextBotAction(full, client.playerId);
    if (action) await client.submit(action.type, action.payload);
  }, [session, client]);

  const snapshot = useGameClient(client);

  // Re-derived on every delivered snapshot (version bump).
  const seats = useMemo<LocalSeat[]>(() => {
    const full = session?.master.getFullState();
    if (!session || !full) return [];
    return full.room.players.map(p => ({
      id: p.id,
      viewing: p.id === viewSeat,
      auto: p.id !== viewSeat || session.master.isAutoPlay(p.id),
      needsAction: !full.winner && session.runtime.nextBotAction(full, p.id) !== null,
    }));
  }, [session, viewSeat, snapshot.version, autoPlay]); // eslint-disable-line react-hooks/exhaustive-deps

  return { client, snapshot, viewSeat, setViewSeat, seats, autoPlay, toggleAutoPlay, timeout };
}
