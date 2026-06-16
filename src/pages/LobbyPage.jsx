// LobbyPage.jsx — room lobby with layout variations (grid / list / circle)
import { useState } from 'react';
import { Icon, Avatar, AvatarStack, GameCard } from '../components/ui';
import { Header, IconButton, BottomBar } from '../components/layout';
import { PlayerGrid } from '../features/lobby/components/PlayerGrid.jsx';
import { PlayerList } from '../features/lobby/components/PlayerList.jsx';
import { PlayerCircle } from '../features/lobby/components/PlayerCircle.jsx';
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
        <Header
          left={<IconButton onClick={() => go('home')}><Icon name="chevL" size={20} /></IconButton>}
          title="ห้องของแพรวา"
          subtitle={`${players.length} คน · กำลังจัดทีม`}
          right={<IconButton onClick={() => showToast('ตั้งค่าห้อง', '⚙️')}><Icon name="settings" size={19} /></IconButton>}
        />

        {/* room code */}
        <div className="pad-x" style={{ marginTop: 12 }}>
          <div className="card row between" style={{ padding: '14px 16px' }}>
            <div className="col" style={{ gap: 3 }}>
              <span className="eyebrow">รหัสห้อง · room code</span>
              <span className="mono" style={{ fontSize: 30, fontWeight: 700, letterSpacing: '0.16em', lineHeight: 1 }}>{ROOM}</span>
            </div>
            <div className="row gap8">
              <button className="row center" style={{ width: 44, height: 44, borderRadius: 13, background: 'var(--surface-3)' }} onClick={copyCode}><Icon name="copy" size={19} /></button>
              <button className="row center" style={{ width: 44, height: 44, borderRadius: 13, background: 'var(--grad)', color: '#fff', boxShadow: '0 8px 18px -8px rgba(109,94,249,0.8)' }} onClick={() => showToast('แชร์ลิงก์ห้องแล้ว', '🔗')}><Icon name="share" size={18} /></button>
            </div>
          </div>
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
            <div className="row"><AvatarStack people={[PLAYERS[3], PLAYERS[2], PLAYERS[1], PLAYERS[4]]} size={28} max={4} /></div>
          </div>
        </div>

        {/* selected game */}
        <div className="pad-x" style={{ marginTop: 18 }}>
          <div className="row between" style={{ marginBottom: 10 }}>
            <h2 className="th h2" style={{ fontSize: 18 }}>เกมที่เลือก</h2>
            <button className="chip" onClick={() => showToast('เลือกเกมอื่น', '🎲')}><Icon name="dice" size={14} /> เปลี่ยนเกม</button>
          </div>
          <GameCard game={GAMES[0]} height={150} onClick={() => {}} />
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

      <BottomBar>
        <div className="row gap10">
          <button className={'btn ' + (meReady ? 'btn-glass' : 'btn-accent')} style={{ flex: '0 0 auto', width: 120 }} onClick={toggleMe}>
            {meReady ? <><Icon name="check" size={18} stroke={3} /> พร้อม</> : 'กดพร้อม'}
          </button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => go('game')}>
            <span className="sheen" />
            <span className="th" style={{ fontWeight: 800 }}>เริ่มเกม</span>
            <Icon name="arrowR" size={20} stroke={2.6} />
          </button>
        </div>
        <div className="tiny center row" style={{ marginTop: 8, opacity: 0.7 }}>
          {allReady ? 'ทุกคนพร้อมแล้ว — เริ่มได้เลย!' : 'คุณคือหัวห้อง · เริ่มเกมได้ทุกเมื่อ'}
        </div>
      </BottomBar>
    </div>
  );
}
