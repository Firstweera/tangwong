// screen-game.jsx — Avalon multiplayer game screen (the ตั้งวง circle)

const EVIL_SET = ['p3', 'p5', 'p7'];          // Morgana, Assassin, Mordred
const MERLIN_SEES = ['p3', 'p5'];              // Merlin sees evil EXCEPT Mordred

function GameScreen({ go, showToast }) {
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
        <div className="row center gap8" style={{ marginBottom: 8 }}>
          <CardFan count={Math.max(quest.size, 2)} w={30} h={42} spread={18} rise={5} />
        </div>
        <span className="eyebrow" style={{ color: 'var(--brass-1)' }}>ภารกิจที่ {current + 1}</span>
        <span className="th" style={{ fontSize: 32, fontWeight: 800, lineHeight: 1, margin: '2px 0', color: '#fff' }}>{team.length}<span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 20 }}>/{quest.size}</span></span>
        <span className="tiny nameplate" style={{ fontWeight: 700, textAlign: 'center' }}>{meLeads ? 'เลือกทีมของคุณ' : leader.name + ' กำลังจัดทีม'}</span>
      </div>
    );
    if (phase === 'vote') return (
      <div className="ring-center col center" style={{ width: 160 }}>
        <div className="row center" style={{ marginBottom: 10 }}>
          <Token kind="good" size={42} style={{ transform: 'rotate(-12deg) translateX(8px)' }} />
          <Token kind="evil" size={42} style={{ transform: 'rotate(12deg) translateX(-8px)' }} />
        </div>
        <span className="th" style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>โหวตทีมนี้?</span>
        <div className="row" style={{ marginTop: 6 }}><AvatarStack people={team.map(id => players.find(p => p.id === id))} size={28} max={4} /></div>
      </div>
    );
    if (phase === 'voteResult') {
      const yes = votes ? Object.values(votes).filter(Boolean).length : 0;
      return (
        <div className="ring-center col center pop" style={{ width: 150 }}>
          <span className="th" style={{ fontSize: 18, fontWeight: 800, color: voteOk ? '#5FD08A' : '#FF7A88' }}>{voteOk ? 'ทีมผ่าน!' : 'ทีมถูกปฏิเสธ'}</span>
          <div className="row gap10" style={{ marginTop: 8 }}>
            <Token kind="good" size={38}>{yes}</Token>
            <Token kind="evil" size={38}>{n - yes}</Token>
          </div>
        </div>
      );
    }
    if (phase === 'mission') return (
      <div className="ring-center col center" style={{ width: 150 }}>
        <div className="row center gap6 chip-bob">
          <Die face={4} size={34} />
          <Die face={6} size={34} />
        </div>
        <span className="th tiny nameplate" style={{ fontWeight: 700, marginTop: 8 }}>กำลังทำภารกิจ...</span>
      </div>
    );
    if (phase === 'questResult') return (
      <div className="ring-center col center pop" style={{ width: 160 }}>
        <span style={{ fontSize: 40 }}>{questOutcome === 'success' ? '🛡️' : '💥'}</span>
        <span className="th" style={{ fontSize: 19, fontWeight: 800, color: questOutcome === 'success' ? '#5FA8FF' : '#FF7A88' }}>{questOutcome === 'success' ? 'ภารกิจสำเร็จ' : 'ภารกิจล้มเหลว'}</span>
        <span className="tiny nameplate" style={{ fontWeight: 700, marginTop: 4 }}>{missionFails} ใบทรยศ</span>
      </div>
    );
  };

  /* ─── seat badge per phase: voting chips ─── */
  const seatBadge = (p) => {
    if (phase === 'voteResult' && votes) return <div className="seat-token" style={{ padding: 0, border: 'none', background: 'none', top: -8, right: -8 }}><Token kind={votes[p.id] ? 'good' : 'evil'} size={22} /></div>;
    if (team.includes(p.id)) return <span className="seat-token" style={{ background: 'var(--brass-1)', color: '#4a2f08', borderColor: 'var(--felt-2)' }}><Icon name="check" size={11} stroke={3.5} /></span>;
    return null;
  };

  return (
    <div className="screen screen-anim" style={{ overflow: 'hidden' }}>
      {celebrate && <Confetti />}
      {/* top bar */}
      <div className="row between pad-x pad-top" style={{ paddingBottom: 6 }}>
        <button className="row center" style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)' }} onClick={() => go('result', { winner: 'good', reason: 'quests', results })}>
          <Icon name="exit" size={18} />
        </button>
        <div className="chip" style={{ background: 'var(--surface)', borderColor: 'var(--border-2)' }}>
          <Icon name="clock" size={14} style={{ color: timer <= 10 ? 'var(--evil)' : 'var(--accent)' }} />
          <span className="mono" style={{ fontWeight: 700, color: timer <= 10 ? 'var(--evil)' : 'var(--text)' }}>0:{String(timer).padStart(2, '0')}</span>
        </div>
        <button className="row center" style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)', position: 'relative' }} onClick={() => setChatOpen(true)}>
          <Icon name="chat" size={18} />
          <span style={{ position: 'absolute', top: 8, right: 9, width: 7, height: 7, borderRadius: 4, background: 'var(--secondary)' }} />
        </button>
      </div>

      {/* quest track — mission board */}
      <div className="row center" style={{ gap: 10, padding: '8px 0 12px' }}>
        <Token kind="good" size={26}>{successCount}</Token>
        <QuestTrack results={results} current={current} />
        <Token kind="evil" size={26}>{failCount}</Token>
      </div>

      {/* round felt table */}
      <div className="ring-stage" style={{ flex: 1, minHeight: 0 }}>
        {/* brass rim + felt surface */}
        <div className="brass-rim" style={{ position: 'absolute', top: '50%', left: '50%', width: '88%', paddingBottom: '88%', transform: 'translate(-50%,-50%)', borderRadius: '50%' }} />
        <div className="felt" style={{ position: 'absolute', top: '50%', left: '50%', width: '80%', paddingBottom: '80%', transform: 'translate(-50%,-50%)', borderRadius: '50%',
             boxShadow: 'inset 0 0 50px rgba(0,0,0,0.5), inset 0 0 0 2px rgba(255,215,138,0.25)' }}>
          <div style={{ position: 'absolute', inset: '13%', borderRadius: '50%', border: '2px dashed rgba(255,215,138,0.3)' }} />
        </div>
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
              <span className="ring-name th nameplate" style={{ marginTop: 2, color: p.id === 'me' ? 'var(--brass-1)' : '#fff', borderColor: p.id === 'me' ? 'rgba(255,215,138,0.5)' : 'rgba(255,255,255,0.12)' }}>{p.id === 'me' ? 'คุณ' : p.name}</span>
            </div>
          );
        })}
      </div>

      {/* role card — flippable playing card */}
      <div className="pad-x" style={{ marginBottom: 8 }}>
        <div className={'flip' + (roleOpen ? ' open' : '')} style={{ height: roleOpen ? 'auto' : 66 }} onClick={() => !roleOpen && setRoleOpen(true)}>
          {!roleOpen ? (
            <button className="role-card row between tap" style={{ width: '100%', padding: 12, background: 'var(--surface)', backdropFilter: 'blur(18px)' }}>
              <div className="row gap12" style={{ alignItems: 'center' }}>
                <CardBack w={36} h={50} />
                <div className="col" style={{ gap: 1, textAlign: 'left' }}>
                  <span className="th h3">บทบาทลับของคุณ</span>
                  <span className="tiny">แตะการ์ดเพื่อเปิด (เห็นคนเดียว)</span>
                </div>
              </div>
              <Icon name="lock" size={18} style={{ color: 'var(--muted)' }} />
            </button>
          ) : (
            <div className="card rise" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="row between" style={{ padding: 14, background: 'linear-gradient(135deg, rgba(76,141,255,0.28), rgba(0,212,255,0.12))' }}>
                <div className="row gap12" style={{ alignItems: 'center' }}>
                  <div className="pcard" style={{ width: 44, height: 60, background: 'var(--good)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>{ROLES.merlin.em}</div>
                  <div className="col" style={{ gap: 2, textAlign: 'left' }}>
                    <span className="th h3" style={{ fontSize: 17 }}>เมอร์ลิน</span>
                    <span className="row gap6" style={{ alignItems: 'center' }}><Token kind="good" size={16} /><span className="th tiny" style={{ fontWeight: 800, color: 'var(--good)' }}>ฝ่ายดี · GOOD</span></span>
                  </div>
                </div>
                <button className="row center tap" style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(0,0,0,0.2)' }} onClick={(e) => { e.stopPropagation(); setRoleOpen(false); }}><Icon name="x" size={15} /></button>
              </div>
              <div style={{ padding: 14 }}>
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
            </div>
          )}
        </div>
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
          <div className="col center gap8">
            <span className="tiny th" style={{ fontWeight: 700, opacity: 0.7 }}>วางโทเคนของคุณ · cast your token</span>
            <div className="row center gap20">
              <button className="tap col center gap6" onClick={() => castVote(false)}>
                <Token kind="evil" size={66} />
                <span className="th" style={{ fontSize: 13, fontWeight: 800, color: 'var(--evil)' }}>ปฏิเสธ</span>
              </button>
              <button className="tap col center gap6" onClick={() => castVote(true)}>
                <Token kind="good" size={66} />
                <span className="th" style={{ fontSize: 13, fontWeight: 800, color: 'var(--good)' }}>เห็นชอบ</span>
              </button>
            </div>
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

/* slide-up chat */
function ChatSheet({ onClose }) {
  const [msgs, setMsgs] = useState([
    { who: 'p4', text: 'ทีมนี้ไว้ใจได้ปะ 🤔', t: 'now' },
    { who: 'p3', text: 'ได้ๆ โหวตผ่านเลย', t: 'now' },
    { who: 'p6', text: 'เอ๊ะ ทำไมรีบจัง...', t: 'now' },
  ]);
  const [text, setText] = useState('');
  const send = () => { if (!text.trim()) return; setMsgs(m => [...m, { who: 'me', text, t: 'now' }]); setText(''); };
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 70, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={onClose} />
      <div className="card-solid rise" style={{ position: 'relative', borderRadius: '26px 26px 0 0', maxHeight: '64%', display: 'flex', flexDirection: 'column', paddingBottom: 30 }}>
        <div className="row between" style={{ padding: '14px 18px 8px' }}>
          <div style={{ width: 40 }} />
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--border-2)' }} />
          <button className="row center" style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--surface-2)' }} onClick={onClose}><Icon name="x" size={16} /></button>
        </div>
        <div className="col gap10" style={{ flex: 1, overflowY: 'auto', padding: '8px 16px' }}>
          {msgs.map((m, i) => {
            const p = PLAYERS.find(x => x.id === m.who);
            if (m.who === 'me') return <div key={i} className="bubble bubble-me">{m.text}</div>;
            return (
              <div key={i} className="row gap8" style={{ alignItems: 'flex-end' }}>
                <Avatar who={p} size={28} />
                <div className="col gap6"><span className="tiny" style={{ fontWeight: 700, marginLeft: 4 }}>{p.name}</span><div className="bubble bubble-them">{m.text}</div></div>
              </div>
            );
          })}
        </div>
        <div className="row gap8 pad-x" style={{ paddingTop: 8 }}>
          <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
                 placeholder="พิมพ์ข้อความ..." className="th" style={{ flex: 1, height: 46, borderRadius: 14, padding: '0 16px', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', outline: 'none', fontSize: 14 }} />
          <button className="row center" style={{ width: 46, height: 46, borderRadius: 14, background: 'var(--grad)', color: '#fff' }} onClick={send}><Icon name="send" size={19} /></button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { GameScreen });
