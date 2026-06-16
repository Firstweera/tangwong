// GamesPage.jsx — game catalog tab
import { Icon, GameCard } from '../components/ui';
import { GAMES } from '../data';

export function GamesPage({ go, showToast }) {
  const cats = [['ทั้งหมด', true], ['จับโกหก', false], ['บลัฟ', false], ['เล่าเรื่อง', false]];
  return (
    <div className="scroll screen-anim" style={{ paddingBottom: 112 }}>
      <div className="pad-x pad-top" style={{ paddingBottom: 6 }}>
        <h1 className="th h1" style={{ fontSize: 28 }}>เลือกเกม</h1>
        <p className="body" style={{ marginTop: 4 }}>{GAMES.length} เกมปาร์ตี้ พร้อมเล่นทันที</p>
      </div>
      <div className="row gap8" style={{ overflowX: 'auto', padding: '12px 20px', scrollbarWidth: 'none' }}>
        {cats.map(([c, on]) => (
          <span key={c} className="chip th" style={{ flexShrink: 0, background: on ? 'var(--grad)' : 'var(--surface-2)', color: on ? '#fff' : 'var(--text)', border: on ? 'none' : '1px solid var(--border)' }}>{c}</span>
        ))}
      </div>
      <div className="pad-x col gap12">
        {GAMES.map(g => <GameCard key={g.id} game={g} height={164} onClick={() => go('lobby')} />)}
      </div>
    </div>
  );
}
