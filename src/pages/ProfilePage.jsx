// ProfilePage.jsx — user profile tab
import { useState } from 'react';
import { Icon, Avatar, GameCard } from '../components/ui';
import { RulesSheet } from '../features/games/ui';
import { getGameRules } from '../features/games';
import { GAMES, MASCOTS } from '../data';

export function ProfilePage({ go, showToast, guest, player, openEditProfile }) {
  const stats = [['142', 'เกมที่เล่น'], ['68%', 'อัตราชนะ'], ['#3', 'อันดับเพื่อน']];
  const favs = [GAMES[0], GAMES[1], GAMES[2]];
  const [rulesGame, setRulesGame] = useState(null);
  const ach = [['🏆', 'ราชาแห่งวง', true], ['🕵️', 'เมอร์ลินไร้เงา', true], ['🔥', 'ชนะ 5 ติด', true], ['🎭', 'นักบลัฟ', false], ['👑', 'หัวห้องตัวยง', false]];

  const mascotEmoji = guest ? MASCOTS[guest.mascot]?.em : '🦊';
  const displayName = player?.name ?? 'ผู้เล่น';
  const handleId = player?.id?.replace('guest_', '') ?? 'guest';

  return (
    <div className="scroll screen-anim" style={{ paddingBottom: 112 }}>
      <div className="page-head">
        <div className="page-title-row">
          <div>
            <h1 className="th page-title">โปรไฟล์</h1>
            <p className="th page-subtitle">ตัวตนที่เพื่อนเห็นในห้องและระหว่างเล่น</p>
          </div>
          <button className="icon-action" onClick={() => openEditProfile?.()}><Icon name="settings" size={19} /></button>
        </div>
      </div>
      <div className="pad-x">
        <div className="command-card" style={{ padding: 16 }}>
          <div className="row between" style={{ alignItems: 'center' }}>
            <div className="row gap14" style={{ alignItems: 'center' }}>
              <Avatar who={player} size={78} onClick={() => openEditProfile?.()} />
              <div className="col" style={{ gap: 3 }}>
                <h1 className="th h1" style={{ fontSize: 24 }}>{displayName}</h1>
                <span className="mono tiny" style={{ color: 'var(--muted)', fontWeight: 700 }}>@{handleId}</span>
              </div>
            </div>
            <button className="btn btn-glass" style={{ height: 42, borderRadius: 13 }} onClick={() => openEditProfile?.()}>แก้ไข</button>
          </div>
          <button className="th row gap8" style={{ alignItems: 'center', width: '100%', marginTop: 14, padding: '10px 12px', borderRadius: 14, background: 'var(--surface-2)', textAlign: 'left' }} onClick={() => openEditProfile?.()}>
            <span style={{ fontSize: 17 }}>{mascotEmoji}</span>
            <span style={{ color: 'var(--accent)', fontWeight: 750 }}>บัญชีผู้เยี่ยมชม — แตะเพื่อผูกบัญชี</span>
          </button>
        </div>
        {/* stats */}
        <div className="card-solid row" style={{ marginTop: 14, padding: '14px 0' }}>
          {stats.map(([v, l], i) => (
            <div key={l} className="col center" style={{ flex: 1, gap: 2, borderLeft: i ? '1px solid var(--border)' : 'none' }}>
              <span className="th" style={{ fontSize: 22, fontWeight: 800 }}>{v}</span>
              <span className="tiny" style={{ fontWeight: 600 }}>{l}</span>
            </div>
          ))}
        </div>
        {/* favorites */}
        <div className="section-head" style={{ marginTop: 22 }}><h2 className="th section-title">เกมโปรด</h2></div>
        <div className="row gap10" style={{ overflowX: 'auto', scrollbarWidth: 'none', margin: '0 -20px', padding: '0 20px' }}>
          {favs.map(g => <div key={g.id} style={{ width: 150, flexShrink: 0 }}><GameCard game={g} height={150} disabled={!g.available} onClick={() => go('lobby')} {...(getGameRules(g.id) ? { onRules: () => setRulesGame(g) } : {})} /></div>)}
        </div>
        {/* achievements */}
        <div className="section-head" style={{ marginTop: 22 }}><h2 className="th section-title">ความสำเร็จ</h2><span className="section-note">กำลังสะสม</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8 }}>
          {ach.map(([em, name, on], i) => (
            <div key={i} className="col center gap6" title={name}>
              <div className="row center" style={{ width: '100%', aspectRatio: '1', borderRadius: 16, background: on ? 'var(--surface-3)' : 'var(--surface-2)', border: '1px solid var(--border)', fontSize: 24, filter: on ? 'none' : 'grayscale(1)', opacity: on ? 1 : 0.4 }}>{em}</div>
            </div>
          ))}
        </div>
      </div>

      {rulesGame && (
        <RulesSheet
          game={rulesGame}
          onClose={() => setRulesGame(null)}
          onPlay={() => { setRulesGame(null); go('lobby'); }}
        />
      )}
    </div>
  );
}
