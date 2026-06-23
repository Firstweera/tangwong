// GamePage.jsx — routes a room to its game UI. Builds the engine RoomState from
// the room roster, padding with bots so a solo player can run a full match
// (Phase A). Currently only Avalon is implemented.
import { useEffect, useMemo, useRef } from 'react';
import { AvalonGame } from '../features/games/avalon/ui';
import { avalonConfig } from '../features/games/avalon';
import { playerToGamePlayer, gamePlayerToPlayer, useRealtimeGame } from '../features/games/engine';
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

function buildRoomState(room, human) {
  const hostId = room?.hostId ?? human.id;
  const baseUI = room?.players?.length ? room.players : [human];
  const gamePlayers = baseUI.map(p => playerToGamePlayer(p, hostId, { isConnected: true, isReady: true }));

  // Pad to a playable count when testing solo (lobby start-gate enforces this in real play).
  const target = gamePlayers.length >= avalonConfig.minPlayers ? gamePlayers.length : 7;
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

export default function GamePage({ go, showToast, currentRoom, player }) {
  const human = player ?? ME;
  const onlineMode = Boolean(useSupabaseTransport && currentRoom?.code && currentRoom?.id !== 'solo');
  const realtime = useRealtimeGame(currentRoom?.code, human.id);
  const meId = onlineMode ? (realtime.meId ?? human.id) : human.id;
  const startRequested = useRef(false);

  useEffect(() => { startRequested.current = false; }, [currentRoom?.code]);

  useEffect(() => {
    if (!onlineMode || startRequested.current) return;
    if (realtime.loading || realtime.busy || realtime.state || !realtime.room || !realtime.meId) return;
    if (realtime.room.gameId !== 'avalon' || realtime.room.hostId !== realtime.meId) return;

    startRequested.current = true;
    void realtime.start();
  }, [onlineMode, realtime.loading, realtime.busy, realtime.state, realtime.room, realtime.meId, realtime.start]);

  const roomState = useMemo(
    () => (onlineMode && realtime.state?.room ? realtime.state.room : buildRoomState(currentRoom, human)),
    [onlineMode, realtime.state?.room, currentRoom, human],
  );
  const players = useMemo(() => roomState.players.map(gamePlayerToPlayer), [roomState]);

  const handleEnd = (state) => {
    const w = state.winner;
    const reason = w.conditionId === 'assassin' ? 'assassin' : w.conditionId === 'evil-hammer' ? 'reject' : 'quests';
    const reveal = state.public.data.reveal ?? {};
    const roles = { ...reveal };
    Object.values(state.private).forEach(pp => { roles[pp.playerId] = pp.data.role; });
    go('result', {
      winner: w.winnerTeam,
      reason,
      results: state.public.data.results,
      players,
      roles,
      you: meId,
    });
  };

  if (roomState.gameId !== 'avalon') {
    return (
      <div className="screen col center" style={{ gap: 10 }}>
        <span style={{ fontSize: 40 }}>✨</span>
        <span className="th h2">เกมนี้กำลังจะมา</span>
        <button className="btn btn-glass btn-lg" onClick={() => go('lobby')}>กลับห้อง</button>
      </div>
    );
  }

  if (onlineMode && !realtime.state) {
    const isHost = realtime.room?.hostId && realtime.meId && realtime.room.hostId === realtime.meId;
    return (
      <div className="screen col center" style={{ gap: 12, padding: 24, textAlign: 'center' }}>
        <span style={{ fontSize: 42 }}>{realtime.error ? '⚠️' : '⌛'}</span>
        <span className="th h2">{realtime.error ? 'เริ่มเกมออนไลน์ไม่สำเร็จ' : 'กำลังเตรียมเกมออนไลน์'}</span>
        <span className="th tiny" style={{ maxWidth: 280, color: 'var(--muted)', fontWeight: 700 }}>
          {realtime.error
            ? realtime.error
            : isHost
              ? 'กำลังเรียก game-start เพื่อสร้างสถานะเกมและบทบาทลับ'
              : 'รอหัวห้องเริ่มเกม แล้วสถานะจะซิงก์มาที่เครื่องนี้อัตโนมัติ'}
        </span>
        {isHost && (
          <button className="btn btn-primary btn-lg" disabled={realtime.busy} onClick={() => realtime.start()}>
            <span className="sheen" />
            <span className="th">{realtime.busy ? 'กำลังเริ่ม...' : 'เริ่มเกมอีกครั้ง'}</span>
          </button>
        )}
        <button className="btn btn-glass btn-lg" onClick={() => go('lobby')}>กลับห้อง</button>
      </div>
    );
  }

  return (
    <AvalonGame
      roomState={roomState}
      players={players}
      meId={meId}
      onExit={() => go(currentRoom ? 'lobby' : 'home')}
      onEnd={handleEnd}
      externalState={onlineMode ? realtime.state : null}
      onSubmitAction={onlineMode ? realtime.submitAction : undefined}
      onStartGame={onlineMode ? realtime.start : undefined}
      onTimeout={onlineMode ? realtime.timeout : undefined}
      onlineMode={onlineMode}
      loading={realtime.loading || realtime.busy}
      busy={onlineMode ? realtime.busy : false}
      error={onlineMode ? realtime.error : null}
      showToast={showToast}
    />
  );
}
