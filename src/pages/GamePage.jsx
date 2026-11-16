// GamePage.jsx — routes a room to its game UI via the client game registry.
// Online: GameClient over SupabaseTransport. Offline: GameClient over an
// in-memory LocalTransport, with the roster padded with bots so a solo player
// can run a full match. Adding a new game = register it in
// src/features/games/registry.ts; no changes here.
import { useEffect, useMemo, useRef } from 'react';
import { getGameEntry } from '../features/games/registry';
import { playerToGamePlayer, gamePlayerToPlayer } from '../features/games/engine';
import { useOnlineGameClient } from '../features/games/useOnlineGameClient';
import { useLocalGameClient } from '../features/games/useLocalGameClient';
import { SeatSwitcher, isSeatSwitcherEnabled } from '../devtools/SeatSwitcher';
import { useSupabaseTransport } from '../services/supabase';
import { ME } from '../data';

// Bots used to fill a short roster during solo play / dev.
const BOT_DEFS = [
  { name: 'บอทมิ้น', mascot: 'cat' }, { name: 'บอทแบงค์', mascot: 'raccoon' },
  { name: 'บอทแพรว', mascot: 'owl' }, { name: 'บอทต้น', mascot: 'panda' },
  { name: 'บอทไนน์', mascot: 'rabbit' }, { name: 'บอทกัน', mascot: 'bear' },
  { name: 'บอทฟ้า', mascot: 'deer' }, { name: 'บอทโอ๊ต', mascot: 'koala' },
  { name: 'บอทมาย', mascot: 'tiger' },
];

function buildRoomState(room, human, minPlayers) {
  const hostId = room?.hostId ?? human.id;
  const baseUI = room?.players?.length ? room.players : [human];
  const gamePlayers = baseUI.map(p => playerToGamePlayer(p, hostId, { isConnected: true, isReady: true }));

  // Pad to a playable count when testing solo (lobby start-gate enforces this in real play).
  const target = gamePlayers.length >= minPlayers ? gamePlayers.length : Math.max(minPlayers, 5);
  for (let i = 0; gamePlayers.length < target && i < BOT_DEFS.length; i++) {
    const b = BOT_DEFS[i];
    gamePlayers.push({ id: `bot_${i + 1}`, nickname: b.name, mascot: b.mascot, isHost: false, isConnected: true, isReady: true });
  }

  return {
    roomId: room?.id ?? 'solo',
    roomCode: room?.code ?? 'SOLO',
    gameId: room?.gameId ?? 'avalon',
    hostId,
    players: gamePlayers,
    maxPlayers: room?.maxPlayers ?? gamePlayers.length,
    isPublic: room?.isPublic ?? false,
    status: 'in-game',
    createdAt: room?.createdAt ?? 0,
  };
}

export default function GamePage({ go, showToast, currentRoom, player, leaveRoom }) {
  const human = player ?? ME;
  const onlineMode = Boolean(useSupabaseTransport && currentRoom?.code && currentRoom?.id !== 'solo');
  // Online play goes through a GameClient over SupabaseTransport (Epic 5.1).
  // `online` is the client's snapshot: { status, match, state, busy, error }.
  const { client, snapshot: online, meId: onlineMeId } = useOnlineGameClient(currentRoom?.code, onlineMode, human.id);
  const meId = onlineMode ? (onlineMeId ?? human.id) : human.id;
  const onlineLoading = onlineMode && (online.status === 'idle' || online.status === 'connecting');
  const startRequested = useRef(false);

  // Prefer the authoritative server room once loaded (non-host joins via code,
  // so currentRoom.gameId may be stale until the realtime room syncs).
  const gameId = (onlineMode && online.match?.gameId) || currentRoom?.gameId || 'avalon';
  const entry = getGameEntry(gameId);
  const minPlayers = entry?.config.minPlayers ?? 5;

  useEffect(() => { startRequested.current = false; }, [currentRoom?.code]);

  useEffect(() => {
    if (!onlineMode || !client || startRequested.current) return;
    if (online.status !== 'ready' || online.busy || online.state || !online.match) return;
    if (online.match.hostId !== client.playerId) return;

    startRequested.current = true;
    void client.startGame();
  }, [onlineMode, client, online.status, online.busy, online.state, online.match]);

  const roomState = useMemo(
    () => (onlineMode && online.state?.room ? online.state.room : buildRoomState(currentRoom, human, minPlayers)),
    [onlineMode, online.state?.room, currentRoom, human, minPlayers],
  );
  const players = useMemo(() => roomState.players.map(gamePlayerToPlayer), [roomState]);

  // Offline play runs the same GameClient API over an in-memory LocalTransport;
  // every other seat is bot-played. Game UIs only ever see one client shape.
  const local = useLocalGameClient(gameId, roomState, meId, !onlineMode && Boolean(entry));
  const game = onlineMode
    ? { client, snapshot: online, loading: onlineLoading || online.busy, timeout: async () => { await client?.timeout(); } }
    : { client: local.client, snapshot: local.snapshot, loading: !local.snapshot.state, timeout: local.timeout };
  // Seat the UI renders. Offline devtools can switch it; results still credit `meId`.
  const viewId = onlineMode ? meId : local.viewSeat;
  const showSeatSwitcher = !onlineMode && isSeatSwitcherEnabled();

  // TODO(A4/GameShell): move into a per-game buildResultProps on the registry entry.
  const handleEnd = (state) => {
    const w = state.winner;
    const shared = {
      players,
      you: meId,
      code: onlineMode ? currentRoom?.code : null,
      roomId: onlineMode ? roomState.roomId : null,
      isHost: roomState.hostId === meId,
    };

    if (gameId === 'werewolf') {
      // Server writes reveal:{playerId:{role,team}} into public_data on game end.
      // Covers ALL players online and offline (LocalTransport mirrors the server).
      const reveal = state.public.data.reveal ?? {};
      const winnerIds = new Set(w.winners ?? []);
      const roles = {};
      for (const [pid, r] of Object.entries(reveal)) {
        roles[pid] = { role: r.role, team: r.team };
      }
      // Own private state always available (and authoritative for self)
      Object.values(state.private).forEach(pp => {
        if (pp.data?.role) roles[pp.playerId] = { role: pp.data.role, team: pp.data.team };
      });
      // Fallback inference for offline / any remaining gap
      players.forEach(p => {
        if (!roles[p.id]) {
          const isWolf = w.winnerTeam === 'evil' && winnerIds.has(p.id);
          roles[p.id] = { role: isWolf ? 'werewolf' : 'villager', team: isWolf ? 'evil' : 'good' };
        }
      });
      go('result', { gameId: 'werewolf', winner: w.winnerTeam, conditionId: w.conditionId, winners: w.winners ?? [], reasonTh: w.reasonTh ?? w.reason, roles, ...shared });
      return;
    }

    if (gameId === 'checkpoint') {
      go('result', {
        gameId: 'checkpoint',
        winners: w.winners ?? [],
        scores: w.scores ?? state.public.data.wealth,
        cash: state.public.data.cash,
        delivered: state.public.data.delivered,
        reasonTh: w.reasonTh ?? w.reason,
        ...shared,
      });
      return;
    }

    // Avalon result
    const reason = w.conditionId === 'assassin' ? 'assassin' : w.conditionId === 'evil-hammer' ? 'reject' : 'quests';
    // reveal is { playerId: { role, side } } from the server (all players);
    // extract the role key for ResultPage. LocalTransport publishes the same
    // reveal offline; own private state overlays it.
    const reveal = state.public.data.reveal ?? {};
    const roles = {};
    for (const [pid, r] of Object.entries(reveal)) roles[pid] = r?.role ?? r;
    Object.values(state.private).forEach(pp => { roles[pp.playerId] = pp.data.role; });
    go('result', { winner: w.winnerTeam, reason, results: state.public.data.results, roles, ...shared });
  };

  if (!entry) {
    return (
      <div className="screen col center" style={{ gap: 10 }}>
        <span style={{ fontSize: 40 }}>✨</span>
        <span className="th h2">เกมนี้กำลังจะมา</span>
        <button className="btn btn-glass btn-lg" onClick={() => go('lobby')}>กลับห้อง</button>
      </div>
    );
  }

  if (onlineMode && !online.state) {
    const isHost = Boolean(client && online.match?.hostId === client.playerId);
    return (
      <div className="screen col center" style={{ gap: 12, padding: 24, textAlign: 'center' }}>
        <span style={{ fontSize: 42 }}>{online.error ? '⚠️' : '⌛'}</span>
        <span className="th h2">{online.error ? 'เริ่มเกมออนไลน์ไม่สำเร็จ' : 'กำลังเตรียมเกมออนไลน์'}</span>
        <span className="th tiny" style={{ maxWidth: 280, color: 'var(--muted)', fontWeight: 700 }}>
          {online.error
            ? online.error
            : isHost
              ? 'กำลังเรียก game-start เพื่อสร้างสถานะเกมและบทบาทลับ'
              : 'รอหัวห้องเริ่มเกม แล้วสถานะจะซิงก์มาที่เครื่องนี้อัตโนมัติ'}
        </span>
        {isHost && (
          <button className="btn btn-primary btn-lg" disabled={online.busy} onClick={() => void client?.startGame()}>
            <span className="sheen" />
            <span className="th">{online.busy ? 'กำลังเริ่ม...' : 'เริ่มเกมอีกครั้ง'}</span>
          </button>
        )}
        <button className="btn btn-glass btn-lg" onClick={() => go('lobby')}>กลับห้อง</button>
      </div>
    );
  }

  const GameUI = entry.ui;
  return (
    <>
    <GameUI
      // Remount per seat so per-seat UI state (selections, timers) never leaks.
      key={viewId}
      roomState={roomState}
      players={players}
      meId={viewId}
      onExit={() => leaveRoom ? leaveRoom() : go('home')}
      onEnd={handleEnd}
      externalState={game.snapshot.state}
      onSubmitAction={game.client ? async (type, payload) => { await game.client.submit(type, payload); } : undefined}
      onStartGame={onlineMode && client ? async () => { await client.startGame(); } : undefined}
      onTimeout={game.client ? game.timeout : undefined}
      onlineMode={onlineMode}
      loading={game.loading}
      busy={game.snapshot.busy}
      error={game.snapshot.error}
      autoPlay={onlineMode ? undefined : local.autoPlay}
      onToggleAutoPlay={onlineMode ? undefined : local.toggleAutoPlay}
      showToast={showToast}
    />
    {showSeatSwitcher && (
      <SeatSwitcher seats={local.seats} players={players} homeSeatId={meId} onSelect={local.setViewSeat} />
    )}
    </>
  );
}
