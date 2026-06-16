// GamePage.jsx — Avalon multiplayer game screen (the ตั้งวง circle)
import { useState, useEffect } from 'react';
import { Icon, Avatar, AvatarStack, QuestTrack, Confetti } from '../components/ui';
import { IconButton } from '../components/layout';
import { ChatSheet } from '../features/room/components/ChatSheet.jsx';
import { PLAYERS, QUESTS, ROLES } from '../data';

const EVIL_SET = ['p3', 'p5', 'p7'];          // Morgana, Assassin, Mordred
const MERLIN_SEES = ['p3', 'p5'];              // Merlin sees evil EXCEPT Mordred

export default function GamePage({ go, showToast }) {
  const players = PLAYERS;
  const n = players.length;

  const [results, setResults] = useState(['success', null, null, null, null]); // Q1 already won by good
  const [current, setCurrent] = useState(1);
  const [leaderIdx, setLeaderIdx] = useState(0);     // you start as leader
  const [team, setTeam] = useState([]);
  const [phase, setPhase] = useState('proposal');    // proposal|vote|voteResult|mission|questResult
  const [votes, setVotes] = useState(null);          // {id:true/false}
  const [voteOk, setVoteOk] = useState(null);
  const [missionFails, setMissionFails] = useState(0);
  const [questOutcome, setQuestOutcome] = useState(null);
  const [rejects, setRejects] = useState(0);
  const [roleOpen, setRoleOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [timer, setTimer] = useState(45);

  const quest = QUESTS[current];
  const leader = players[leaderIdx];
  const meLeads = leader.id === 'me';
  const meOnTeam = team.includes('me');
  const successCount = results.filter(r => r === 'success').length;
  const failCount = results.filter(r => r === 'fail').length;

  // countdown during proposal/vote
  useEffect(() => {
    if (phase !== 'proposal' && phase !== 'vote') return;
    setTimer(phase === 'proposal' ? 45 : 20);
    const id = setInterval(() => setTimer(t => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [phase, current, leaderIdx]);

  const toggleSeat = (id) => {
    if (phase !== 'proposal' || !meLeads) return;
    setTeam(t => t.includes(id) ? t.filter(x => x !== id) : t.length < quest.size ? [...t, id] : t);
  };

  const proposeTeam = () => {
    showToast('เสนอทีมแล้ว — รอโหวต', '🗳️');
    setPhase('vote');
  };

  const castVote = (approve) => {
    // simulate everyone: evil tends to approve teams with evil on them; good approves clean teams
    const evilOnTeam = team.some(id => EVIL_SET.includes(id));
    const v = {};
    players.forEach(p => {
      if (p.id === 'me') { v[p.id] = approve; return; }
      if (EVIL_SET.includes(p.id)) v[p.id] = evilOnTeam ? true : Math.random() > 0.55;
      else v[p.id] = !evilOnTeam ? true : Math.random() > 0.5;
    });
    const yes = Object.values(v).filter(Boolean).length;
    setVotes(v);
    setVoteOk(yes > n / 2);
    setPhase('voteResult');
  };

  // resolve vote
  useEffect(() => {
    if (phase !== 'voteResult') return;
    const t = setTimeout(() => {
      if (voteOk) {
        setPhase('mission');
      } else {
        const r = rejects + 1;
        setRejects(r);
        showToast(`ทีมถูกปฏิเสธ (${r}/5)`, '👎');
        if (r >= 5) { go('result', { winner: 'evil', reason: 'reject', results }); return; }
        setLeaderIdx((leaderIdx + 1) % n);
        setTeam([]); setVotes(null); setPhase('proposal');
      }
    }, 2400);
    return () => clearTimeout(t);
  }, [phase]);

  const runMission = (mySabotage) => {
    // evil on team fail; you (good) cannot. mySabotage only matters if you were evil.
    const fails = team.filter(id => EVIL_SET.includes(id)).length + (mySabotage ? 1 : 0);
    setMissionFails(fails);
    const ok = fails < quest.fails;
    setQuestOutcome(ok ? 'success' : 'fail');
    setPhase('questResult');
    if (ok) { setCelebrate(true); setTimeout(() => setCelebrate(false), 2600); }
  };

  // if I'm not on team, auto-run mission
  useEffect(() => {
    if (phase !== 'mission' || meOnTeam) return;
    const t = setTimeout(() => runMission(false), 2200);
    return () => clearTimeout(t);
  }, [phase]);

  const nextQuest = () => {
    const nr = results.slice(); nr[current] = questOutcome; setResults(nr);
    const succ = nr.filter(r => r === 'success').length;
    const fail = nr.filter(r => r === 'fail').length;
    if (succ >= 3) { go('result', { winner: 'good', reason: 'quests', results: nr }); return; }
    if (fail >= 3) { go('result', { winner: 'evil', reason: 'quests', results: nr }); return; }
    setCurrent(current + 1);
    setLeaderIdx((leaderIdx + 1) % n);
    setTeam([]); setVotes(null); setVoteOk(null); setQuestOutcome(null); setPhase('proposal');
  };

  /* ─── center content per phase ─── */
  const Center = () => {
    if (phase === 'proposal') return (
      <div className="ring-center col center" style={{ width: 150 }}>
        <span className="eyebrow" style={{ color: 'var(--accent)' }}>ภารกิจที่ {current + 1}</span>
        <span className="th" style={{ fontSize: 34, fontWeight: 800, lineHeight: 1, margin: '4px 0' }}>{team.length}<span style={{ color: 'var(--muted)', fontSize: 22 }}>/{quest.size}</span></span>
        <span className="tiny" style={{ fontWeight: 700, textAlign: 'center' }}>{meLeads ? 'เลือกทีมของคุณ' : leader.name + ' กำลังจัดทีม'}</span>
      </div>
    );
    if (phase === 'vote') return (
      <div className="ring-center col center" style={{ width: 150 }}>
        <span className="th" style={{ fontSize: 17, fontWeight: 800 }}>โหวตทีมนี้?</span>
        <div className="row" style={{ marginTop: 8 }}><AvatarStack people={team.map(id => players.find(p => p.id === id))} size={32} max={4} /></div>
      </div>
    );
    if (phase === 'voteResult') {
      const yes = votes ? Object.values(votes).filter(Boolean).length : 0;
      return (
        <div className="ring-center col center pop" style={{ width: 150 }}>
          <span className="th" style={{ fontSize: 18, fontWeight: 800, color: voteOk ? '#34D17E' : 'var(--evil)' }}>{voteOk ? 'ทีมผ่าน!' : 'ทีมถูกปฏิเสธ'}</span>
          <div className="row gap14" style={{ marginTop: 8, fontWeight: 800 }}>
            <span style={{ color: '#34D17E' }}>👍 {yes}</span>
            <span style={{ color: 'var(--evil)' }}>👎 {n - yes}</span>
          </div>
        </div>
      );
    }
    if (phase === 'mission') return (
      <div className="ring-center col center" style={{ width: 150 }}>
        <div className="spin-slow" style={{ fontSize: 34 }}>⚔️</div>
        <span className="th tiny" style={{ fontWeight: 700, marginTop: 6 }}>กำลังทำภารกิจ...</span>
      </div>
    );
    if (phase === 'questResult') return (
      <div className="ring-center col center pop" style={{ width: 160 }}>
        <span style={{ fontSize: 40 }}>{questOutcome === 'success' ? '🛡️' : '💥'}</span>
        <span className="th" style={{ fontSize: 19, fontWeight: 800, color: questOutcome === 'success' ? 'var(--good)' : 'var(--evil)' }}>{questOutcome === 'success' ? 'ภารกิจสำเร็จ' : 'ภารกิจล้มเหลว'}</span>
        <span className="tiny" style={{ fontWeight: 700 }}>{missionFails} ใบทรยศ</span>
      </div>
    );
    return null;
  };

  /* ─── seat badge per phase ─── */
  const seatBadge = (p) => {
    if (phase === 'voteResult' && votes) return <span className="seat-token" style={{ background: votes[p.id] ? '#34D17E' : 'var(--evil)', fontSize: 10 }}>{votes[p.id] ? '👍' : '👎'}</span>;
    if (team.includes(p.id)) return <span className="seat-token" style={{ background: 'var(--accent)', color: '#3a2406' }}><Icon name="check" size={11} stroke={3.5} /></span>;
    return null;
  };

  return (
    <div className="screen screen-anim" style={{ overflow: 'hidden' }}>
      {celebrate && <Confetti />}
      {/* top bar */}
      <div className="row between pad-x pad-top" style={{ paddingBottom: 6 }}>
        <IconButton onClick={() => go('result', { winner: 'good', reason: 'quests', results })} style={{ width: 40, height: 40, borderRadius: 12 }}>
          <Icon name="exit" size={18} />
        </IconButton>
        <div className="chip" style={{ background: 'var(--surface)', borderColor: 'var(--border-2)' }}>
          <Icon name="clock" size={14} style={{ color: timer <= 10 ? 'var(--evil)' : 'var(--accent)' }} />
          <span className="mono" style={{ fontWeight: 700, color: timer <= 10 ? 'var(--evil)' : 'var(--text)' }}>0:{String(timer).padStart(2, '0')}</span>
        </div>
        <IconButton onClick={() => setChatOpen(true)} style={{ width: 40, height: 40, borderRadius: 12, position: 'relative' }}>
          <Icon name="chat" size={18} />
          <span style={{ position: 'absolute', top: 8, right: 9, width: 7, height: 7, borderRadius: 4, background: 'var(--secondary)' }} />
        </IconButton>
      </div>

      {/* quest track */}
      <div className="row center" style={{ gap: 8, padding: '10px 0 14px' }}>
        <span className="th tiny" style={{ fontWeight: 800, color: 'var(--good)' }}>{successCount}</span>
        <QuestTrack results={results} current={current} />
        <span className="th tiny" style={{ fontWeight: 800, color: 'var(--evil)' }}>{failCount}</span>
      </div>

      {/* circle */}
      <div className="ring-stage" style={{ flex: 1, minHeight: 0 }}>
        {/* connecting glow ring */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', width: '74%', paddingBottom: '74%', transform: 'translate(-50%,-50%)',
             borderRadius: '50%', border: '1.5px dashed var(--border-2)' }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', width: 150, height: 150, transform: 'translate(-50%,-50%)',
             borderRadius: '50%', background: 'var(--grad-soft)', filter: 'blur(8px)' }} />
        <Center />
        {players.map((p, i) => {
          const ang = (-90 + i * 360 / n) * Math.PI / 180;
          const x = 50 + 38 * Math.cos(ang);
          const y = 50 + 39 * Math.sin(ang);
          const sel = team.includes(p.id);
          const isLeader = p.id === leader.id;
          const canTap = phase === 'proposal' && meLeads;
          return (
            <div key={p.id} className="ring-seat" style={{ left: x + '%', top: y + '%', opacity: (phase === 'mission' && !sel) ? 0.45 : 1 }}>
              <div style={{ position: 'relative' }} onClick={() => toggleSeat(p.id)}>
                <Avatar who={p} size={p.id === 'me' ? 58 : 52} crown={isLeader}
                        ring={sel ? 'var(--accent)' : false}
                        style={{ cursor: canTap ? 'pointer' : 'default', transition: 'transform 0.2s', transform: sel ? 'scale(1.06)' : 'none' }} />
                {seatBadge(p)}
              </div>
              <span className="ring-name th" style={{ color: p.id === 'me' ? 'var(--primary)' : 'var(--text)', fontWeight: p.id === 'me' ? 800 : 700 }}>{p.id === 'me' ? 'คุณ' : p.name}</span>
            </div>
          );
        })}
      </div>

      {/* role strip */}
      <div className="pad-x" style={{ marginBottom: 8 }}>
        <button className="role-card row between" style={{ width: '100%', padding: 12,
                 background: roleOpen ? 'linear-gradient(135deg, rgba(109,94,249,0.28), rgba(0,212,255,0.12))' : 'var(--surface)',
                 backdropFilter: 'blur(18px)' }} onClick={() => setRoleOpen(o => !o)}>
          <div className="row gap12">
            <div className="row center" style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--good)', fontSize: 20 }}>{roleOpen ? ROLES.merlin.em : '🎴'}</div>
            <div className="col" style={{ gap: 1, textAlign: 'left' }}>
              <span className="th h3">{roleOpen ? <>เมอร์ลิน · <span style={{ color: 'var(--good)' }}>ฝ่ายดี</span></> : 'บทบาทของคุณ'}</span>
              <span className="tiny">{roleOpen ? 'แตะเพื่อซ่อน' : 'แตะเพื่อดู (เป็นความลับ)'}</span>
            </div>
          </div>
          <Icon name={roleOpen ? 'eye' : 'lock'} size={18} style={{ color: 'var(--muted)' }} />
        </button>
        {roleOpen && (
          <div className="card rise" style={{ padding: 14, marginTop: 8 }}>
            <p className="th body" style={{ fontSize: 13, color: 'var(--text)' }}>{ROLES.merlin.desc}</p>
            <div className="divider" style={{ margin: '12px 0' }} />
            <span className="eyebrow">คุณเห็นว่าเป็นฝ่ายชั่ว 👁️</span>
            <div className="row gap14" style={{ marginTop: 10 }}>
              {MERLIN_SEES.map(id => {
                const p = players.find(x => x.id === id);
                return (
                  <div key={id} className="col center gap6">
                    <Avatar who={p} size={44} ring="var(--evil)" />
                    <span className="th tiny" style={{ fontWeight: 700 }}>{p.name}</span>
                  </div>
                );
              })}
              <div className="col" style={{ justifyContent: 'center', marginLeft: 4 }}>
                <span className="tiny" style={{ color: 'var(--evil)', fontWeight: 700, maxWidth: 130 }}>⚠️ ระวัง! มอร์เดร็ดซ่อนตัวอยู่ — คุณมองไม่เห็นเขา</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* action bar */}
      <div className="pad-x" style={{ paddingBottom: 24 }}>
        {phase === 'proposal' && (
          <button className="btn btn-accent btn-lg btn-block" disabled={!meLeads || team.length !== quest.size} onClick={proposeTeam}>
            <span className="sheen" />
            {meLeads ? <><Icon name="flag" size={20} /> <span className="th">เสนอทีม ({team.length}/{quest.size})</span></> : <span className="th">{leader.name} กำลังเลือกทีม...</span>}
          </button>
        )}
        {phase === 'vote' && (
          <div className="row gap10">
            <button className="btn btn-evil btn-lg" style={{ flex: 1 }} onClick={() => castVote(false)}><Icon name="x" size={20} stroke={3} /> <span className="th">ปฏิเสธ</span></button>
            <button className="btn btn-good btn-lg" style={{ flex: 1 }} onClick={() => castVote(true)}><Icon name="check" size={20} stroke={3} /> <span className="th">เห็นชอบ</span></button>
          </div>
        )}
        {phase === 'voteResult' && (
          <button className="btn btn-glass btn-lg btn-block" disabled><span className="th">กำลังนับคะแนน...</span></button>
        )}
        {phase === 'mission' && (meOnTeam ? (
          <div className="col gap8">
            <span className="tiny center row" style={{ justifyContent: 'center', fontWeight: 700 }}>คุณอยู่ในภารกิจ — เลือกผลลัพธ์</span>
            <div className="row gap10">
              <button className="btn btn-glass btn-lg" style={{ flex: 1, opacity: 0.5 }} disabled><Icon name="lock" size={16} /> <span className="th">ทรยศ</span></button>
              <button className="btn btn-good btn-lg" style={{ flex: 1.4 }} onClick={() => runMission(false)}><Icon name="shield" size={19} /> <span className="th">ทำภารกิจสำเร็จ</span></button>
            </div>
            <span className="tiny center row" style={{ justifyContent: 'center', opacity: 0.65 }}>ฝ่ายดีต้องทำภารกิจให้สำเร็จเสมอ</span>
          </div>
        ) : (
          <button className="btn btn-glass btn-lg btn-block" disabled><span className="th">รอผลภารกิจ...</span></button>
        ))}
        {phase === 'questResult' && (
          <button className="btn btn-primary btn-lg btn-block" onClick={nextQuest}>
            <span className="sheen" />
            <span className="th">{successCount + (questOutcome === 'success' ? 1 : 0) >= 3 || failCount + (questOutcome === 'fail' ? 1 : 0) >= 3 ? 'ดูผลการเล่น' : 'ภารกิจต่อไป'}</span>
            <Icon name="arrowR" size={20} stroke={2.6} />
          </button>
        )}
      </div>

      {/* chat sheet */}
      {chatOpen && <ChatSheet onClose={() => setChatOpen(false)} />}
    </div>
  );
}

// ChatSheet is now in src/features/room/components/ChatSheet.jsx
