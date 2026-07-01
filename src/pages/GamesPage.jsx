// GamesPage.jsx — game catalog tab
import { useState } from 'react';
import { GameCard } from '../components/ui';
import { RulesSheet } from '../features/games/ui';
import { getGameRules } from '../features/games';
import { GAMES } from '../data';

export function GamesPage({ go, openCreateRoom }) {
  const cats = [['ทั้งหมด', true], ['จับโกหก', false], ['บลัฟ', false], ['เล่าเรื่อง', false]];
  const [rulesGame, setRulesGame] = useState(null);

  return (
    <div className="scroll screen-anim" style={{ paddingBottom: 112 }}>
      <div className="page-head">
        <div className="page-title-row">
          <div>
            <h1 className="th page-title">เลือกเกม</h1>
            <p className="th page-subtitle">เกมปาร์ตี้สำหรับห้องเพื่อน พร้อมสถานะว่าตัวไหนเล่นได้ตอนนี้</p>
          </div>
          <span className="chip" style={{ marginTop: 2 }}>{GAMES.filter(g => g.available).length}/{GAMES.length} live</span>
        </div>
      </div>
      <div className="row gap8" style={{ overflowX: 'auto', padding: '12px 20px', scrollbarWidth: 'none' }}>
        {cats.map(([c, on]) => (
          <span key={c} className="chip th" data-active={on ? 'true' : undefined} style={{ flexShrink: 0 }}>{c}</span>
        ))}
      </div>
      <div className="pad-x col gap12">
        {GAMES.map(g => (
          <GameCard
            key={g.id}
            game={g}
            height={164}
            disabled={!g.available}
            onClick={() => g.available && openCreateRoom?.(g.id)}
            onRules={getGameRules(g.id) ? () => setRulesGame(g) : undefined}
          />
        ))}
      </div>

      {rulesGame && (
        <RulesSheet
          game={rulesGame}
          onClose={() => setRulesGame(null)}
          onPlay={() => { setRulesGame(null); openCreateRoom?.(rulesGame?.id); }}
        />
      )}
    </div>
  );
}
