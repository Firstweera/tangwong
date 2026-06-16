// LobbyPage.jsx — room lobby, composed from reusable lobby + game components.
import { useState } from 'react';
import { Icon } from '../components/ui';
import { PlayerAvatarGroup } from '../components/game';
import {
  LobbyHeader, RoomCodeDisplay, GameSelector,
  PlayerList, PlayerGrid, PlayerCircle, LobbyFooter,
} from '../features/lobby';
import { RoomSettingsSheet } from '../features/room/components/RoomSettingsSheet.tsx';
import { PLAYERS, GAMES } from '../data';

// Default room for dev jump-to shortcuts (TweaksPanel "Lobby" button)
const DEMO_ROOM = {
  id: 'demo',
  code: '4F2K9',
  name: 'ห้องของแพรวา',
  maxPlayers: 7,
  isPublic: true,
  gameId: 'avalon',
  hostId: 'p4',
  players: PLAYERS,
  status: 'waiting',
  inviteLink: 'https://tangwong.app/join/4F2K9',
  createdAt: 0,
};

export default function LobbyPage({ go, layout, showToast, room, onLeave, onUpdateSettings }) {
  const activeRoom = room ?? DEMO_ROOM;
  const currentGame = GAMES.find(g => g.id === activeRoom.gameId) ?? GAMES[0];

  const [ready, setReady] = useState({ p2: true, p3: true, p4: false, p5: true, p6: false, p7: true });
  const [settingsOpen, setSettingsOpen] = useState(false);

  const meReady = ready.me || false;
  const players = PLAYERS;
  const readyCount = players.filter(p => p.id === 'me' ? meReady : ready[p.id]).length;
  const allReady = readyCount === players.length;

  const toggleMe = () => setReady(r => ({ ...r, me: !r.me }));
  const isReady = (p) => p.id === 'me' ? meReady : ready[p.id];

  const handleBack = () => {
    if (onLeave) {
      onLeave();
    } else {
      go('home');
    }
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(activeRoom.code).catch(() => {});
    showToast('คัดลอกรหัสห้องแล้ว', '📋');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: activeRoom.name, text: `เข้าร่วมห้อง ${activeRoom.name}`, url: activeRoom.inviteLink }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(activeRoom.inviteLink).catch(() => {});
      showToast('คัดลอกลิงก์เชิญแล้ว', '🔗');
    }
  };

  const handleSaveSettings = (settings) => {
    if (onUpdateSettings) onUpdateSettings(settings);
  };

  return (
    <div className="screen screen-anim">
      <div className="scroll" style={{ paddingBottom: 96 }}>
        <LobbyHeader
          title={activeRoom.name}
          subtitle={`${players.length} คน · ${activeRoom.isPublic ? 'ห้องสาธารณะ' : 'ห้องส่วนตัว'}`}
          onBack={handleBack}
          onSettings={() => setSettingsOpen(true)}
        />

        {/* room code */}
        <div className="pad-x" style={{ marginTop: 12 }}>
          <RoomCodeDisplay code={activeRoom.code} onCopy={handleCopy} onShare={handleShare} />
        </div>

        {/* voice channel indicator */}
        <div className="pad-x" style={{ marginTop: 10 }}>
          <div className="card row between" style={{ padding: '10px 14px' }}>
            <div className="row gap10">
              <div className="row center" style={{ width: 34, height: 34, borderRadius: 11, background: 'rgba(52,209,126,0.16)', color: '#34D17E' }}><Icon name="mic" size={17} /></div>
              <div className="col" style={{ gap: 1 }}>
                <span className="th" style={{ fontSize: 13.5, fontWeight: 700 }}>ห้องเสียง · Voice</span>
                <span className="tiny" style={{ color: '#34D17E', fontWeight: 700 }}>● 4 คนกำลังคุย</span>
              </div>
            </div>
            <PlayerAvatarGroup players={[PLAYERS[3], PLAYERS[2], PLAYERS[1], PLAYERS[4]]} size={28} max={4} />
          </div>
        </div>

        {/* selected game */}
        <div className="pad-x" style={{ marginTop: 18 }}>
          <GameSelector game={currentGame} onChange={() => setSettingsOpen(true)} onSelect={() => {}} />
        </div>

        {/* players */}
        <div className="pad-x" style={{ marginTop: 20 }}>
          <div className="row between" style={{ marginBottom: 12 }}>
            <h2 className="th h2" style={{ fontSize: 18 }}>ผู้เล่น <span style={{ color: 'var(--muted)', fontWeight: 600 }}>{players.length}/{activeRoom.maxPlayers}</span></h2>
            <span className="chip" style={{ background: 'rgba(52,209,126,0.14)', color: '#34D17E', border: 'none' }}>{readyCount}/{players.length} พร้อม</span>
          </div>
          {layout === 'list'   ? <PlayerList   players={players} isReady={isReady} /> :
           layout === 'circle' ? <PlayerCircle players={players} isReady={isReady} readyCount={readyCount} /> :
                                 <PlayerGrid   players={players} isReady={isReady} />}
        </div>
      </div>

      <LobbyFooter meReady={meReady} onToggleReady={toggleMe} onStart={() => go('game')} allReady={allReady} />

      {/* Room settings sheet */}
      <RoomSettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        room={activeRoom}
        onSave={handleSaveSettings}
      />
    </div>
  );
}
