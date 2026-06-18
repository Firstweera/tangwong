// GamePage.jsx — routes a room to its game UI. Builds the engine RoomState from
// the room roster, padding with bots so a solo player can run a full match
// (Phase A). Currently only Avalon is implemented.
import { useMemo } from 'react';
import { AvalonGame } from '../features/games/avalon/ui';
import { avalonConfig } from '../features/games/avalon';
import { playerToGamePlayer, gamePlayerToPlayer } from '../features/games/engine';
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
  const meId = human.id;

  const roomState = useMemo(() => buildRoomState(currentRoom, human), [currentRoom, human]);
  const players = useMemo(() => roomState.players.map(gamePlayerToPlayer), [roomState]);

  const handleEnd = (state) => {
    const w = state.winner;
    const reason = w.conditionId === 'assassin' ? 'assassin' : w.conditionId === 'evil-hammer' ? 'reject' : 'quests';
    const roles = {};
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

  return (
    <AvalonGame
      roomState={roomState}
      players={players}
      meId={meId}
      onExit={() => go(currentRoom ? 'lobby' : 'home')}
      onEnd={handleEnd}
      showToast={showToast}
    />
  );
}
