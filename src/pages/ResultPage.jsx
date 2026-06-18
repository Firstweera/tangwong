// ResultPage.jsx — match result, role reveal, celebration
import { useState, useEffect } from 'react';
import { Icon, Avatar, QuestTrack, Confetti } from '../components/ui';
import { BottomBar } from '../components/layout';
import { PLAYERS, ROLES, ROLE_OF } from '../data';

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

  useEffect(() => {
    const id = setInterval(() => setRevealAt(v => (v < players.length ? v + 1 : v)), 160);
    return () => clearInterval(id);
  }, [players.length]);

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
        <div className="col center pad-x" style={{ paddingTop: 86, textAlign: 'center' }}>
          <div className="pop" style={{ fontSize: 74, lineHeight: 1, filter: 'drop-shadow(0 10px 24px rgba(0,0,0,0.4))' }}>{good ? '🛡️' : '🗡️'}</div>
          <span className="eyebrow rise" style={{ color: accent, marginTop: 14 }}>{reason === 'assassin' ? 'การลอบสังหารสำเร็จ' : 'จบเกม · game over'}</span>
          <h1 className="th display rise" style={{ fontSize: 42, marginTop: 6, color: accent }}>{good ? 'ฝ่ายดีชนะ!' : 'ฝ่ายชั่วชนะ!'}</h1>
          <p className="th body rise" style={{ marginTop: 8, fontSize: 14.5 }}>{reasonText}</p>
        </div>

        {/* quest recap */}
        <div className="row center" style={{ marginTop: 22 }}>
          <QuestTrack results={results} current={-1} />
        </div>

        {/* MVP */}
        <div className="pad-x" style={{ marginTop: 26 }}>
          <div className="card" style={{ padding: 16, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'var(--grad-soft)', opacity: 0.6 }} />
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
          <h2 className="th h2" style={{ fontSize: 18, marginBottom: 12 }}>เปิดบทบาททั้งหมด</h2>
          <div className="col gap8">
            {players.map((p, i) => {
              const role = ROLES[roleOf[p.id]] ?? ROLES.servant;
              const isGood = role.side === 'good';
              const shown = i < revealAt;
              return (
                <div key={p.id} className="card-solid row between" style={{ padding: '10px 14px', borderLeft: `3px solid ${isGood ? 'var(--good)' : 'var(--evil)'}`,
                     opacity: shown ? 1 : 0, transform: shown ? 'none' : 'translateX(-8px)', transition: 'all 0.3s' }}>
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
          <button className="btn btn-glass btn-lg" style={{ flex: '0 0 auto', width: 64 }} onClick={() => go('home')}><Icon name="home" size={22} /></button>
          <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={() => go('lobby')}>
            <span className="sheen" />
            <Icon name="dice" size={20} /> <span className="th" style={{ fontWeight: 800 }}>เล่นอีกครั้ง</span>
          </button>
        </div>
      </BottomBar>
    </div>
  );
}
