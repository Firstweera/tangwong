// ResultPage.jsx — match result, role reveal, celebration
import { useState, useEffect } from 'react';
import { Icon, Avatar, QuestTrack, Confetti } from '../components/ui';
import { BottomBar } from '../components/layout';
import { PLAYERS, ROLES, ROLE_OF } from '../data';
import { useSupabaseTransport, gameService } from '../services/supabase';

const WW_ROLES = {
  werewolf:    { th: 'หมาป่า',         em: '🐺',  team: 'evil' },
  seer:        { th: 'ผู้พยากรณ์',    em: '👁️', team: 'good' },
  doctor:      { th: 'หมอ',            em: '💊',  team: 'good' },
  villager:    { th: 'ชาวบ้าน',        em: '🏡',  team: 'good' },
  cupid:       { th: 'กามเทพ',         em: '💘',  team: 'good' },
  spellcaster: { th: 'ผู้ร่ายคำสาปใบ้', em: '🤫', team: 'good' },
};

export default function ResultPage({ go, payload, showToast, player }) {
  const {
    winner = 'good', reason = 'quests',
    results = ['success', 'success', 'fail', 'success', null],
  } = payload || {};
  const good = winner === 'good';
  // Real game data when present; fall back to the demo roster for dev jumps.
  const players = payload?.players ?? PLAYERS;
  const roleOf = payload?.roles ?? ROLE_OF;
  const youId = payload?.you ?? 'me';
  const myRole = ROLES[roleOf[youId]] ?? ROLES.servant;
  const [revealAt, setRevealAt] = useState(0);

  // ─── Rematch (online) ────────────────────────────────────────────────────────
  const online = useSupabaseTransport && !!payload?.code && !!payload?.roomId;
  const isHost = !!payload?.isHost;
  const [rematching, setRematching] = useState(false);

  // Everyone on the result screen watches for a fresh game: when the host starts
  // a rematch, game-start writes a new in-game snapshot → navigate into it.
  useEffect(() => {
    if (!online) return;
    const unsub = gameService.subscribeGame(payload.roomId, async () => {
      const status = await gameService.fetchGameStatus(payload.roomId);
      if (status === 'in-game') go('game');
    });
    return unsub;
  }, [online, payload?.roomId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRematch = async () => {
    if (!online) { go('lobby'); return; }   // offline/local: back to the lobby
    if (!isHost || rematching) return;       // non-host waits for the host
    setRematching(true);
    try {
      await gameService.startGame(payload.code, true); // re-deal; subscription navigates everyone
    } catch {
      setRematching(false);
      showToast?.('เริ่มเกมใหม่ไม่สำเร็จ ลองอีกครั้ง', '⚠️');
    }
  };

  useEffect(() => {
    const id = setInterval(() => setRevealAt(v => (v < players.length ? v + 1 : v)), 160);
    return () => clearInterval(id);
  }, [players.length]);

  // ── Checkpoint result ────────────────────────────────────────────────────────
  if (payload?.gameId === 'checkpoint') {
    const scores = payload?.scores ?? {};
    const cash = payload?.cash ?? {};
    const winnerIds = new Set(payload?.winners ?? []);
    const ranking = [...players].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0));
    const iWon = winnerIds.has(youId);
    return (
      <div className="screen screen-anim" style={{ position: 'relative' }}>
        {iWon && <Confetti count={64} />}
        <div className="scroll" style={{ paddingBottom: 120 }}>
          <div className="col center pad-x" style={{ paddingTop: 68, textAlign: 'center' }}>
            <div className="pop" style={{ fontSize: 68, lineHeight: 1 }}>{iWon ? '🏆' : '🛂'}</div>
            <span className="chip rise" style={{ color: 'var(--accent)', marginTop: 14 }}>ผู้ตรวจการ · จบเกม</span>
            <h1 className="th page-title rise" style={{ fontSize: 34, marginTop: 10 }}>
              {iWon ? 'คุณรวยที่สุดในตลาด' : `${ranking[0]?.name ?? 'ผู้เล่น'} ชนะ`}
            </h1>
            <p className="th page-subtitle rise" style={{ marginTop: 7, maxWidth: 320 }}>
              ทุกคนเป็นผู้คุ้มด่านครบ 2 ครั้งแล้ว
            </p>
          </div>

          <div className="pad-x" style={{ marginTop: 28 }}>
            <div className="section-head">
              <h2 className="th section-title">อันดับความมั่งคั่ง</h2>
              <span className="section-note">เงินสด + สินค้า</span>
            </div>
            <div className="col gap8">
              {ranking.map((p, index) => {
                const shown = index < revealAt;
                const goodsScore = (scores[p.id] ?? 0) - (cash[p.id] ?? 0);
                return (
                  <div key={p.id} className="status-card row between" style={{
                    opacity: shown ? 1 : 0,
                    transform: shown ? 'none' : 'translateY(6px)',
                    transition: 'all 0.25s',
                    borderColor: winnerIds.has(p.id) ? 'color-mix(in srgb, var(--accent) 52%, var(--border))' : undefined,
                  }}>
                    <div className="row gap12" style={{ minWidth: 0 }}>
                      <strong style={{ width: 20, color: index === 0 ? 'var(--accent)' : 'var(--muted)', textAlign: 'center' }}>{index + 1}</strong>
                      <Avatar who={p} size={42} ring={winnerIds.has(p.id) ? 'var(--accent)' : undefined} />
                      <div className="col" style={{ gap: 1, minWidth: 0 }}>
                        <span className="th h3" style={{ fontSize: 14.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.name}{p.id === youId && <span style={{ color: 'var(--primary)', fontSize: 11 }}> · คุณ</span>}
                        </span>
                        <span className="th tiny">เงิน {cash[p.id] ?? 0} · สินค้า {goodsScore}</span>
                      </div>
                    </div>
                    <strong style={{ color: winnerIds.has(p.id) ? 'var(--accent)' : 'var(--text)', fontSize: 18 }}>{scores[p.id] ?? 0}฿</strong>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <BottomBar paddingBottom={26}>
          <div className="row gap10">
            <button className="btn btn-glass btn-lg" aria-label="กลับหน้าหลัก" style={{ width: 64 }} onClick={() => go('home')}><Icon name="home" size={22} /></button>
            {online && !isHost ? (
              <button className="btn btn-glass btn-lg" style={{ flex: 1 }} disabled><span className="th">รอหัวห้องเริ่มใหม่...</span></button>
            ) : (
              <button className="btn btn-primary btn-lg" style={{ flex: 1 }} disabled={rematching} onClick={handleRematch}><Icon name="dice" size={20} /><span className="th">{rematching ? 'กำลังเริ่ม...' : 'เล่นอีกครั้ง'}</span></button>
            )}
          </div>
        </BottomBar>
      </div>
    );
  }

  // ── Werewolf result ───────────────────────────────────────────────────────────
  if (payload?.gameId === 'werewolf') {
    const wwRoles = payload?.roles ?? {};
    const myWwRole = WW_ROLES[wwRoles[youId]?.role ?? wwRoles[youId]] ?? WW_ROLES.villager;
    const isLoversWin = payload?.conditionId === 'lovers-survive';
    const wwAccent = isLoversWin ? 'var(--primary)' : good ? 'var(--good)' : 'var(--evil)';
    const bannerEm = isLoversWin ? '💘' : good ? '🛡️' : '🐺';
    const heading = isLoversWin ? 'คู่รักชนะ' : good ? 'ชาวบ้านชนะ' : 'หมาป่าชนะ';
    return (
      <div className="screen screen-anim" style={{ position: 'relative' }}>
        {(good || isLoversWin) && <Confetti count={64} />}
        <div style={{
          position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)',
          width: 400, height: 320, pointerEvents: 'none',
          background: `radial-gradient(circle, ${isLoversWin ? 'rgba(100,120,255,0.35)' : good ? 'rgba(76,141,255,0.35)' : 'rgba(255,92,108,0.32)'}, transparent 65%)`,
          filter: 'blur(12px)',
        }} />
        <div className="scroll" style={{ paddingBottom: 120 }}>
          {/* banner */}
          <div className="col center pad-x" style={{ paddingTop: 78, textAlign: 'center' }}>
            <div className="pop" style={{ fontSize: 74, lineHeight: 1, filter: 'drop-shadow(0 10px 24px rgba(0,0,0,0.4))' }}>
              {bannerEm}
            </div>
            <span className="chip rise" style={{ color: wwAccent, marginTop: 14, borderColor: 'color-mix(in srgb, currentColor, transparent 65%)' }}>
              game over
            </span>
            <h1 className="th page-title rise" style={{ fontSize: 39, marginTop: 10, color: wwAccent }}>
              {heading}
            </h1>
            <p className="th page-subtitle rise" style={{ marginTop: 8, maxWidth: 320 }}>
              {payload?.reasonTh ?? (good ? 'หมาป่าทุกตัวถูกกำจัด' : 'หมาป่าเท่ากับชาวบ้าน')}
            </p>
          </div>

          {/* my role card */}
          <div className="pad-x" style={{ marginTop: 26 }}>
            <div className="command-card" style={{ padding: 16 }}>
              <div className="row gap14" style={{ alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <Avatar who={player} size={62} ring={good ? 'var(--good)' : 'var(--evil)'} />
                  <span style={{
                    position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)',
                    fontSize: 13, fontWeight: 800, background: good ? 'var(--good)' : 'var(--evil)',
                    color: '#fff', padding: '1px 8px', borderRadius: 8,
                  }}>
                    {myWwRole.em}
                  </span>
                </div>
                <div className="col" style={{ gap: 3, flex: 1 }}>
                  <span className="th h2" style={{ fontSize: 19 }}>คุณ · {myWwRole.th}</span>
                  <span className="th tiny" style={{ fontWeight: 600 }}>
                    {myWwRole.team === 'evil' ? '🐺 ทีมหมาป่า' : '🛡️ ทีมชาวบ้าน'}
                  </span>
                </div>
                <div className="col center" style={{ gap: 0 }}>
                  <span className="th" style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>+128</span>
                  <span className="tiny" style={{ fontWeight: 700 }}>XP</span>
                </div>
              </div>
            </div>
          </div>

          {/* role reveal */}
          <div className="pad-x" style={{ marginTop: 24 }}>
            <div className="section-head">
              <h2 className="th section-title">เปิดบทบาททั้งหมด</h2>
              <span className="section-note">{players.length} seats</span>
            </div>
            <div className="col gap8">
              {players.map((p, i) => {
                const rd = WW_ROLES[wwRoles[p.id]?.role ?? wwRoles[p.id]] ?? WW_ROLES.villager;
                const isGood = rd.team === 'good';
                const winnerSet = new Set(payload?.winners ?? []);
                const isWinner = winnerSet.size > 0
                  ? winnerSet.has(p.id)
                  : (good && isGood) || (!good && !isGood);
                const shown = i < revealAt;
                return (
                  <div key={p.id} className="status-card row between" style={{
                    opacity: shown ? 1 : 0, transform: shown ? 'none' : 'translateX(-8px)', transition: 'all 0.3s',
                    boxShadow: `inset 0 0 0 1px ${isGood ? 'rgba(76,141,255,0.15)' : 'rgba(255,92,108,0.15)'}`,
                  }}>
                    <div className="row gap12">
                      <div style={{ position: 'relative' }}>
                        <Avatar who={p} size={42} />
                        {!isWinner && (
                          <span style={{
                            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: 18, background: 'rgba(0,0,0,0.48)',
                            borderRadius: '50%',
                          }}>💀</span>
                        )}
                      </div>
                      <div className="col" style={{ gap: 1 }}>
                        <span className="th h3" style={{ fontSize: 14.5 }}>
                          {p.name}
                          {p.id === youId && <span style={{ color: 'var(--primary)', fontSize: 11, fontWeight: 800 }}> · คุณ</span>}
                        </span>
                        <span className="th tiny" style={{ fontWeight: 600 }}>{rd.th}</span>
                      </div>
                    </div>
                    <div className="row gap8" style={{ alignItems: 'center' }}>
                      <span style={{ fontSize: 20 }}>{rd.em}</span>
                      <span className="th" style={{
                        fontSize: 10.5, fontWeight: 800, padding: '3px 9px', borderRadius: 8,
                        background: isGood ? 'rgba(76,141,255,0.16)' : 'rgba(255,92,108,0.16)',
                        color: isGood ? 'var(--good)' : 'var(--evil)',
                      }}>
                        {isGood ? 'ฝ่ายดี' : 'ฝ่ายชั่ว'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <BottomBar paddingBottom={26}>
          <div className="row gap10">
            <button className="btn btn-glass btn-lg" aria-label="กลับหน้าหลัก" style={{ flex: '0 0 auto', width: 64 }} onClick={() => go('home')}>
              <Icon name="home" size={22} />
            </button>
            {online && !isHost ? (
              <button className="btn btn-glass btn-lg" style={{ flex: 1 }} disabled>
                <span className="th" style={{ fontWeight: 800 }}>รอหัวห้องเริ่มใหม่...</span>
              </button>
            ) : (
              <button className="btn btn-primary btn-lg" style={{ flex: 1 }} disabled={rematching} onClick={handleRematch}>
                <span className="sheen" />
                <Icon name="dice" size={20} />
                <span className="th" style={{ fontWeight: 800 }}>{rematching ? 'กำลังเริ่ม...' : '🐺 เล่นอีกครั้ง'}</span>
              </button>
            )}
          </div>
        </BottomBar>
      </div>
    );
  }

  // ── Avalon result ─────────────────────────────────────────────────────────────
  const reasonText = {
    quests: good ? 'ฝ่ายดีทำภารกิจสำเร็จ 3 ครั้ง' : 'ฝ่ายชั่วทำลายภารกิจ 3 ครั้ง',
    reject: 'ทีมถูกปฏิเสธ 5 ครั้งติด — ฝ่ายชั่วชนะ',
    assassin: good ? 'นักลอบสังหารพลาด — เมอร์ลินรอดชีวิต!' : 'นักลอบสังหารพบเมอร์ลิน',
  }[reason];

  const accent = good ? 'var(--good)' : 'var(--evil)';

  return (
    <div className="screen screen-anim" style={{ position: 'relative' }}>
      {good && <Confetti count={64} />}
      {/* glow */}
      <div style={{ position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)', width: 380, height: 300,
           background: `radial-gradient(circle, ${good ? 'rgba(76,141,255,0.35)' : 'rgba(255,92,108,0.32)'}, transparent 65%)`, filter: 'blur(10px)' }} />
      <div className="scroll" style={{ paddingBottom: 120 }}>
        {/* banner */}
        <div className="col center pad-x" style={{ paddingTop: 78, textAlign: 'center' }}>
          <div className="pop" style={{ fontSize: 74, lineHeight: 1, filter: 'drop-shadow(0 10px 24px rgba(0,0,0,0.4))' }}>{good ? '🛡️' : '🗡️'}</div>
          <span className="chip rise" style={{ color: accent, marginTop: 14, borderColor: 'color-mix(in srgb, currentColor, transparent 65%)' }}>{reason === 'assassin' ? 'การลอบสังหาร' : 'game over'}</span>
          <h1 className="th page-title rise" style={{ fontSize: 39, marginTop: 10, color: accent }}>{good ? 'ฝ่ายดีชนะ' : 'ฝ่ายชั่วชนะ'}</h1>
          <p className="th page-subtitle rise" style={{ marginTop: 8, maxWidth: 320 }}>{reasonText}</p>
        </div>

        {/* quest recap */}
        <div className="row center" style={{ marginTop: 22 }}>
          <QuestTrack results={results} current={-1} />
        </div>

        {/* MVP */}
        <div className="pad-x" style={{ marginTop: 26 }}>
          <div className="command-card" style={{ padding: 16 }}>
            <div className="row gap14" style={{ position: 'relative', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <Avatar who={player} size={62} ring="var(--accent)" />
                <span style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', fontSize: 13, fontWeight: 800, background: 'var(--accent)', color: '#3a2406', padding: '1px 8px', borderRadius: 8 }}>MVP</span>
              </div>
              <div className="col" style={{ gap: 3, flex: 1 }}>
                <span className="th h2" style={{ fontSize: 19 }}>คุณ · {myRole.th} {myRole.em}</span>
                <span className="th tiny" style={{ fontWeight: 600 }}>{myRole.side === 'good' ? 'ฝ่ายดี · อัศวินโต๊ะกลม' : 'ฝ่ายชั่ว · สมุนของมอร์เดร็ด'}</span>
              </div>
              <div className="col center" style={{ gap: 0 }}>
                <span className="th" style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>+128</span>
                <span className="tiny" style={{ fontWeight: 700 }}>XP</span>
              </div>
            </div>
          </div>
        </div>

        {/* role reveal */}
        <div className="pad-x" style={{ marginTop: 24 }}>
          <div className="section-head"><h2 className="th section-title">เปิดบทบาททั้งหมด</h2><span className="section-note">{players.length} seats</span></div>
          <div className="col gap8">
            {players.map((p, i) => {
              const role = ROLES[roleOf[p.id]] ?? ROLES.servant;
              const isGood = role.side === 'good';
              const shown = i < revealAt;
              return (
                <div key={p.id} className="status-card row between" style={{
                     opacity: shown ? 1 : 0, transform: shown ? 'none' : 'translateX(-8px)', transition: 'all 0.3s',
                     boxShadow: `inset 0 0 0 1px ${isGood ? 'rgba(76,141,255,0.15)' : 'rgba(255,92,108,0.15)'}`,
                  }}>
                  <div className="row gap12">
                    <Avatar who={p} size={42} />
                    <div className="col" style={{ gap: 1 }}>
                      <span className="th h3" style={{ fontSize: 14.5 }}>{p.name} {p.id === youId && <span style={{ color: 'var(--primary)', fontSize: 11, fontWeight: 800 }}>· คุณ</span>}</span>
                      <span className="th tiny" style={{ fontWeight: 600 }}>{role.th}</span>
                    </div>
                  </div>
                  <div className="row gap8" style={{ alignItems: 'center' }}>
                    <span style={{ fontSize: 20 }}>{role.em}</span>
                    <span className="th" style={{ fontSize: 10.5, fontWeight: 800, padding: '3px 9px', borderRadius: 8,
                          background: isGood ? 'rgba(76,141,255,0.16)' : 'rgba(255,92,108,0.16)', color: isGood ? 'var(--good)' : 'var(--evil)' }}>
                      {isGood ? 'ฝ่ายดี' : 'ฝ่ายชั่ว'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <BottomBar paddingBottom={26}>
        <div className="row gap10">
          <button className="btn btn-glass btn-lg" aria-label="กลับหน้าหลัก" style={{ flex: '0 0 auto', width: 64 }} onClick={() => go('home')}><Icon name="home" size={22} /></button>
          {online && !isHost ? (
            <button className="btn btn-glass btn-lg" style={{ flex: 1 }} disabled>
              <span className="th" style={{ fontWeight: 800 }}>รอหัวห้องเริ่มใหม่...</span>
            </button>
          ) : (
            <button className="btn btn-primary btn-lg" style={{ flex: 1 }} disabled={rematching} onClick={handleRematch}>
              <span className="sheen" />
              <Icon name="dice" size={20} /> <span className="th" style={{ fontWeight: 800 }}>{rematching ? 'กำลังเริ่ม...' : 'เล่นอีกครั้ง'}</span>
            </button>
          )}
        </div>
      </BottomBar>
    </div>
  );
}
