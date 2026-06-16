// LobbyPage.jsx — room lobby, composed from reusable lobby + game components.
import { useState } from 'react';
import { Icon } from '../components/ui';
import { PlayerAvatarGroup } from '../components/game';
import {
  LobbyHeader, RoomCodeDisplay, GameSelector,
  PlayerList, PlayerGrid, PlayerCircle, LobbyFooter,
} from '../features/lobby';
import { PLAYERS, GAMES } from '../data';

export default function LobbyPage({ go, layout, showToast }) {
  const ROOM = '4F2K9';
  const [ready, setReady] = useState({ p2: true, p3: true, p4: false, p5: true, p6: false, p7: true });
  const meReady = ready.me || false;
  const players = PLAYERS;
  const readyCount = players.filter(p => p.id === 'me' ? meReady : ready[p.id]).length;
  const allReady = readyCount === players.length;

  const toggleMe = () => setReady(r => ({ ...r, me: !r.me }));
  const isReady = (p) => p.id === 'me' ? meReady : ready[p.id];
  const copyCode = () => showToast('คัดลอกรหัสห้องแล้ว', '📋');

  return (
    <div className="screen screen-anim">
      <div className="scroll" style={{ paddingBottom: 96 }}>
        <LobbyHeader
          title="ห้องของแพรวา"
          subtitle={`${players.length} คน · กำลังจัดทีม`}
          onBack={() => go('home')}
          onSettings={() => showToast('ตั้งค่าห้อง', '⚙️')}
        />

        {/* room code */}
        <div className="pad-x" style={{ marginTop: 12 }}>
          <RoomCodeDisplay code={ROOM} onCopy={copyCode} onShare={() => showToast('แชร์ลิงก์ห้องแล้ว', '🔗')} />
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
          <GameSelector game={GAMES[0]} onChange={() => showToast('เลือกเกมอื่น', '🎲')} onSelect={() => {}} />
        </div>

        {/* players */}
        <div className="pad-x" style={{ marginTop: 20 }}>
          <div className="row between" style={{ marginBottom: 12 }}>
            <h2 className="th h2" style={{ fontSize: 18 }}>ผู้เล่น <span style={{ color: 'var(--muted)', fontWeight: 600 }}>{players.length}/{GAMES[0].players.split('–')[1]}</span></h2>
            <span className="chip" style={{ background: 'rgba(52,209,126,0.14)', color: '#34D17E', border: 'none' }}>{readyCount}/{players.length} พร้อม</span>
          </div>
          {layout === 'list'   ? <PlayerList   players={players} isReady={isReady} /> :
           layout === 'circle' ? <PlayerCircle players={players} isReady={isReady} readyCount={readyCount} /> :
                                 <PlayerGrid   players={players} isReady={isReady} />}
        </div>
      </div>

      <LobbyFooter meReady={meReady} onToggleReady={toggleMe} onStart={() => go('game')} allReady={allReady} />
    </div>
  );
}
