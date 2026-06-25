import { useEffect, useRef, useState } from 'react';
import { Icon, Confetti } from '@/components/ui';
import { IconButton } from '@/components/layout';
import { QuestTrack } from '@/components/ui';
import { ChatPanel } from '@/features/lobby';
import { useChat } from '@/features/chat';
import { useGameEngine } from '../../engine';
import type { GameState, RoomState } from '../../engine';
import type { Player } from '@/types';
import { avalonConfig } from '../config';
import type { AvalonPublic, AvalonPrivate, QuestOutcome } from '../types';
import { nextBotAction, nextAutoActor } from '../bot';
import { AvalonTable } from './AvalonTable';
import { RoleRevealCard } from './RoleRevealCard';

type S = GameState<AvalonPublic, AvalonPrivate>;

const BOT_DELAY = 900;
const PHASE_TIMER: Record<string, number> = { teamProposal: 45, teamVote: 25, mission: 25 };

/** Map a raw engine/network error to a short, friendly Thai message for players. */
function friendlyGameError(raw: string): string {
  const m = raw.toLowerCase();
  if (m.includes('version conflict') || m.includes('retry')) return 'เกมเพิ่งอัปเดต ลองอีกครั้ง';
  if (m.includes('not allowed in phase') || m.includes('invalid') || m.includes('already')) return 'ตานี้ทำรายการนั้นไม่ได้';
  if (m.includes('host only') || m.includes('only the host') || m.includes('leader')) return 'เฉพาะหัวห้องเท่านั้น';
  if (m.includes('not a room member') || m.includes('not authenticated')) return 'เซสชันหมดอายุ ลองเข้าห้องใหม่';
  if (m.includes('not active') || m.includes('not in-game') || m.includes('not started')) return 'เกมไม่พร้อมรับรายการตอนนี้';
  if (m.includes('timer has not expired')) return 'ยังหมดเวลาไม่ถึงเวลา';
  if (m.includes('fetch') || m.includes('network') || m.includes('failed to') || m.includes('unable to')) return 'เชื่อมต่อไม่ได้ ลองอีกครั้ง';
  return 'ทำรายการไม่สำเร็จ ลองอีกครั้ง';
}

export interface AvalonGameProps {
  roomState: RoomState;
  players: Player[];
  meId: string;
  onExit: () => void;
  onEnd: (state: S) => void;
  externalState?: S | null;
  onSubmitAction?: (type: string, payload: unknown) => void | Promise<void>;
  onStartGame?: () => void | Promise<void>;
  onTimeout?: () => void | Promise<void>;
  onlineMode?: boolean;
  loading?: boolean;
  /** An online action is in flight (server round-trip) — disables controls to prevent double-submit. */
  busy?: boolean;
  /** Latest online action/sync error; surfaced to the player as a toast. */
  error?: string | null;
  showToast?: (message: string, emoji?: string) => void;
}

export function AvalonGame({
  roomState,
  players,
  meId,
  onExit,
  onEnd,
  externalState = null,
  onSubmitAction,
  onStartGame,
  onTimeout,
  onlineMode = false,
  loading = false,
  busy = false,
  error = null,
  showToast,
}: AvalonGameProps) {
  const local = useGameEngine<AvalonPublic, AvalonPrivate>(avalonConfig);
  const state = externalState ?? local.state;
  const controlled = onlineMode || externalState !== null;

  const [roleOpen, setRoleOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [autoAll, setAutoAll] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string[]>([]);
  const [assassinTarget, setAssassinTarget] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const timeoutSentRef = useRef<string | null>(null);

  const byId = (id: string) => players.find(p => p.id === id);
  const chat = useChat(roomState.roomId, meId);

  // ─── Start + kick off role reveal ───────────────────────────────────────────
  useEffect(() => {
    if (controlled) return;
    local.start(roomState);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (controlled) return;
    if (state?.public.phase === 'lobby') local.transitionTo('roleReveal');
  }, [state?.public.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Bot autoplay ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (onlineMode) return;
    if (!state || state.winner) return;
    const actor = nextAutoActor(state, meId, autoAll);
    if (!actor) return;
    const action = nextBotAction(state, actor);
    if (!action) return;
    const t = setTimeout(() => local.dispatch(action), BOT_DELAY);
    return () => clearTimeout(t);
  }, [state, autoAll]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Per-phase timer (auto-acts for the human on expiry) ─────────────────────
  const phase = state?.public.phase ?? 'lobby';
  const pub = state?.public.data;
  const leaderIndex = pub?.leaderIndex ?? 0;
  const currentQuest = pub?.currentQuest ?? 0;
  const voteCount = Object.keys(pub?.votes ?? {}).length;
  const missionCount = Object.keys(pub?.missionCards ?? {}).length;
  const teamKey = pub?.proposedTeam?.join('|') ?? '';
  const isHost = roomState.hostId === meId;
  const timerKey = `${phase}:${leaderIndex}:${currentQuest}:${voteCount}:${missionCount}:${teamKey}`;
  useEffect(() => {
    const dur = PHASE_TIMER[phase];
    if (!dur) { setTimeLeft(0); return; }
    timeoutSentRef.current = null;
    setTimeLeft(dur);
    const id = setInterval(() => setTimeLeft(t => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [phase, leaderIndex, currentQuest, voteCount, missionCount, teamKey]);
  useEffect(() => {
    if (timeLeft !== 0 || !PHASE_TIMER[phase] || !state) return;
    if (onlineMode) {
      if (isHost && timeoutSentRef.current !== timerKey) {
        timeoutSentRef.current = timerKey;
        void onTimeout?.();
      }
      return;
    }
    const action = nextBotAction(state, meId); // play my default if I idled out
    if (action) local.dispatch(action);
  }, [timeLeft, onlineMode, isHost, timerKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Toast vote outcomes on phase change ────────────────────────────────────
  const prevPhase = useRef<string>('lobby');
  useEffect(() => {
    if (!state) return;
    const from = prevPhase.current;
    if (from === 'teamVote' && phase === 'mission') showToast?.('ทีมผ่าน — ออกภารกิจ!', '✅');
    if (from === 'teamVote' && phase === 'teamProposal') showToast?.(`ทีมถูกปฏิเสธ (${state.public.data.rejectCount}/5)`, '👎');
    prevPhase.current = phase;
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Surface online action / sync errors ─────────────────────────────────────
  // The realtime hook clears its error to null before each action and sets it on
  // failure, so `error` transitions falsy→message on every fresh failure. Toast
  // once per occurrence (dedupe identical back-to-back messages).
  const lastErrorRef = useRef<string | null>(null);
  useEffect(() => {
    if (!error) { lastErrorRef.current = null; return; }
    if (error === lastErrorRef.current) return;
    lastErrorRef.current = error;
    showToast?.(friendlyGameError(error), '⚠️');
  }, [error]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Reset transient selections ──────────────────────────────────────────────
  useEffect(() => { setSelectedTeam([]); }, [phase, leaderIndex, currentQuest]);

  // ─── End of game ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (state?.winner) {
      const t = setTimeout(() => onEnd(state), 1600);
      return () => clearTimeout(t);
    }
  }, [state?.winner]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!state || !pub) {
    return (
      <div className="screen col center" style={{ gap: 12 }}>
        <span style={{ fontSize: 40 }}>{loading ? '⌛' : '🎴'}</span>
        <span className="th h2">{loading ? 'กำลังโหลดเกม...' : 'รอเริ่มเกม'}</span>
        {onlineMode && onStartGame && (
          <button className="btn btn-primary btn-lg" onClick={() => void onStartGame()}>
            <span className="sheen" />
            <Icon name="check" size={19} stroke={3} />
            <span className="th">เริ่มเกมออนไลน์</span>
          </button>
        )}
        <button className="btn btn-glass btn-lg" onClick={onExit}>กลับห้อง</button>
      </div>
    );
  }

  const myPriv = state.private[meId]?.data;
  const leaderId = pub.playerOrder[leaderIndex];
  const iLead = leaderId === meId;
  const quest = pub.quests[currentQuest];
  const iAmAssassin = myPriv?.role === 'assassin';
  const meOnTeam = pub.proposedTeam.includes(meId);
  const iVoted = meId in pub.votes;
  const iPlayed = meId in pub.missionCards;
  const successCount = pub.results.filter(r => r === 'success').length;
  const failCount = pub.results.filter(r => r === 'fail').length;
  const goodWin = state.winner?.winnerTeam === 'good';

  const act = (type: string, payload: unknown) => {
    if (controlled) {
      void onSubmitAction?.(type, payload);
    } else {
      local.dispatch({ type, playerId: meId, payload });
    }
  };

  const seatTap = (id: string) => {
    if (phase === 'teamProposal' && iLead) {
      setSelectedTeam(t => t.includes(id) ? t.filter(x => x !== id) : t.length < quest.size ? [...t, id] : t);
    } else if (phase === 'assassinate' && iAmAssassin) {
      setAssassinTarget(id);
    }
  };

  // ─── Vote reveal (Avalon votes are public once everyone has voted) ───────────
  const voteYes = Object.values(pub.votes).filter(Boolean).length;
  const voteNo = Object.keys(pub.votes).length - voteYes;
  const allVoted = pub.playerOrder.length > 0 && Object.keys(pub.votes).length === pub.playerOrder.length;
  // Reveal each seat's approve/reject the moment the vote resolves, and keep it
  // visible through the mission so the loyal side can read the table.
  const votesRevealed = allVoted && (phase === 'teamVote' || phase === 'mission');

  // ─── Per-seat badge ──────────────────────────────────────────────────────────
  const badge = (id: string) => {
    if (phase === 'assassinate' && assassinTarget === id) {
      return <span className="seat-token" style={{ background: 'var(--evil)', fontSize: 11 }}>🗡️</span>;
    }
    if (votesRevealed && id in pub.votes) {
      const yes = pub.votes[id];
      return (
        <span className="seat-token" style={{ background: yes ? 'var(--good)' : 'var(--evil)', color: '#fff' }}>
          <Icon name={yes ? 'check' : 'x'} size={11} stroke={3.5} />
        </span>
      );
    }
    if (pub.proposedTeam.includes(id) && (phase === 'teamProposal' || phase === 'teamVote')) {
      return <span className="seat-token" style={{ background: 'var(--accent)', color: '#3a2406' }}><Icon name="check" size={11} stroke={3.5} /></span>;
    }
    if (phase === 'teamVote' && id in pub.votes) {
      return <span className="seat-token" style={{ background: 'var(--surface-3)', fontSize: 10 }}>✓</span>;
    }
    return null;
  };

  const teamSel = phase === 'teamProposal' && iLead ? selectedTeam : pub.proposedTeam;
  const dimIds = phase === 'mission' ? pub.playerOrder.filter(id => !pub.proposedTeam.includes(id)) : [];

  // ─── Centre content ──────────────────────────────────────────────────────────
  const center = (() => {
    if (phase === 'roleReveal') return (
      <div className="col center"><span style={{ fontSize: 34 }}>🎴</span><span className="th tiny" style={{ fontWeight: 700, marginTop: 6, textAlign: 'center' }}>เปิดบทบาทของคุณ</span></div>
    );
    if (phase === 'teamProposal') return (
      <div className="col center">
        <span className="eyebrow" style={{ color: 'var(--accent)' }}>ภารกิจที่ {currentQuest + 1}</span>
        <span className="th" style={{ fontSize: 34, fontWeight: 800, lineHeight: 1, margin: '4px 0' }}>{teamSel.length}<span style={{ color: 'var(--muted)', fontSize: 22 }}>/{quest.size}</span></span>
        <span className="tiny" style={{ fontWeight: 700, textAlign: 'center' }}>{iLead ? 'เลือกทีมของคุณ' : `${byId(leaderId)?.name} กำลังจัดทีม`}</span>
      </div>
    );
    if (phase === 'teamVote') return (
      <div className="col center"><span className="th" style={{ fontSize: 17, fontWeight: 800 }}>โหวตทีมนี้?</span><span className="tiny" style={{ fontWeight: 700, marginTop: 6 }}>{Object.keys(pub.votes).length}/{pub.playerOrder.length} โหวตแล้ว</span></div>
    );
    if (phase === 'mission') return (
      <div className="col center"><div className="spin-slow" style={{ fontSize: 34 }}>⚔️</div><span className="th tiny" style={{ fontWeight: 700, marginTop: 6 }}>{Object.keys(pub.missionCards).length}/{pub.proposedTeam.length} ส่งการ์ดแล้ว</span>
        <span className="tiny" style={{ fontWeight: 700, marginTop: 4, display: 'inline-flex', gap: 8 }}>
          <span style={{ color: 'var(--good)' }}>✓ {voteYes}</span>
          <span style={{ color: 'var(--evil)' }}>✗ {voteNo}</span>
        </span>
      </div>
    );
    if (phase === 'questReveal' && pub.lastQuest) return (
      <div className="col center pop"><span style={{ fontSize: 40 }}>{pub.lastQuest.outcome === 'success' ? '🛡️' : '💥'}</span><span className="th" style={{ fontSize: 18, fontWeight: 800, color: pub.lastQuest.outcome === 'success' ? 'var(--good)' : 'var(--evil)' }}>{pub.lastQuest.outcome === 'success' ? 'ภารกิจสำเร็จ' : 'ภารกิจล้มเหลว'}</span><span className="tiny" style={{ fontWeight: 700 }}>{pub.lastQuest.fails} ใบทรยศ</span></div>
    );
    if (phase === 'assassinate') return (
      <div className="col center"><span style={{ fontSize: 34 }}>🗡️</span><span className="th tiny" style={{ fontWeight: 700, marginTop: 6, textAlign: 'center' }}>นักลอบสังหารเลือกเป้าหมาย</span></div>
    );
    if (phase === 'end') return (
      <div className="col center pop"><span style={{ fontSize: 40 }}>{goodWin ? '🛡️' : '🗡️'}</span><span className="th" style={{ fontWeight: 800, color: goodWin ? 'var(--good)' : 'var(--evil)' }}>{goodWin ? 'ฝ่ายดีชนะ' : 'ฝ่ายชั่วชนะ'}</span></div>
    );
    return null;
  })();

  return (
    <div className="screen screen-anim" style={{ overflow: 'hidden' }}>
      {state.winner && goodWin && <Confetti />}

      {/* top bar */}
      <div className="row between pad-x pad-top" style={{ paddingBottom: 6 }}>
        <IconButton onClick={onExit} aria-label="ออกจากเกม" style={{ width: 40, height: 40, borderRadius: 12 }}><Icon name="exit" size={18} /></IconButton>
        <div className="row gap8">
          {PHASE_TIMER[phase] > 0 && (
            <div className="chip" style={{ background: 'var(--surface)', borderColor: 'var(--border-2)' }}>
              <Icon name="clock" size={14} style={{ color: timeLeft <= 10 ? 'var(--evil)' : 'var(--accent)' }} />
              <span className="mono" style={{ fontWeight: 700, color: timeLeft <= 10 ? 'var(--evil)' : 'var(--text)' }}>0:{String(timeLeft).padStart(2, '0')}</span>
            </div>
          )}
          {onlineMode
            ? <span className="chip" style={{ background: 'var(--surface)', borderColor: 'var(--border-2)', fontWeight: 700 }}>ออนไลน์</span>
            : <button className="chip" onClick={() => setAutoAll(a => !a)} style={{ background: autoAll ? 'var(--grad-soft)' : 'var(--surface)', borderColor: 'var(--border-2)', fontWeight: 700 }}>🤖 {autoAll ? 'ออโต้' : 'แมนนวล'}</button>}
        </div>
        <IconButton onClick={() => setChatOpen(true)} aria-label="เปิดแชต" style={{ width: 40, height: 40, borderRadius: 12 }}><Icon name="chat" size={18} /></IconButton>
      </div>

      {/* quest track */}
      <div className="row center" style={{ gap: 8, padding: '10px 0 14px' }}>
        <span className="th tiny" style={{ fontWeight: 800, color: 'var(--good)' }}>{successCount}</span>
        <QuestTrack results={pub.results} current={currentQuest} />
        <span className="th tiny" style={{ fontWeight: 800, color: 'var(--evil)' }}>{failCount}</span>
      </div>

      {/* table */}
      <AvalonTable players={players} leaderId={leaderId} meId={meId} selectedIds={teamSel} dimIds={dimIds} badge={badge} onSeatTap={seatTap} center={center} />

      {/* role strip */}
      {myPriv && <RoleRevealCard me={myPriv} players={players} open={roleOpen} onToggle={() => setRoleOpen(o => !o)} />}

      {/* action bar */}
      <div className="pad-x" style={{ paddingBottom: 24 }}>
        {phase === 'roleReveal' && (
          isHost
            ? <button className="btn btn-primary btn-lg btn-block" disabled={busy} onClick={() => act('CONTINUE', null)}><span className="sheen" /><Icon name="check" size={19} stroke={3} /> <span className="th">{busy ? 'กำลังเริ่ม...' : 'ฉันพร้อมแล้ว — เริ่มเกม'}</span></button>
            : <button className="btn btn-glass btn-lg btn-block" disabled><span className="th">รอหัวห้องเริ่มเกม...</span></button>
        )}
        {phase === 'teamProposal' && (
          iLead
            ? <button className="btn btn-accent btn-lg btn-block" disabled={busy || selectedTeam.length !== quest.size} onClick={() => act('NOMINATE_TEAM', { team: selectedTeam })}><span className="sheen" /><Icon name="flag" size={20} /> <span className="th">เสนอทีม ({selectedTeam.length}/{quest.size})</span></button>
            : <button className="btn btn-glass btn-lg btn-block" disabled><span className="th">{byId(leaderId)?.name} กำลังเลือกทีม...</span></button>
        )}
        {phase === 'teamVote' && (
          !iVoted
            ? <div className="row gap10"><button className="btn btn-evil btn-lg" style={{ flex: 1 }} disabled={busy} onClick={() => act('VOTE_TEAM', { approve: false })}><Icon name="x" size={20} stroke={3} /> <span className="th">ปฏิเสธ</span></button><button className="btn btn-good btn-lg" style={{ flex: 1 }} disabled={busy} onClick={() => act('VOTE_TEAM', { approve: true })}><Icon name="check" size={20} stroke={3} /> <span className="th">เห็นชอบ</span></button></div>
            : <button className="btn btn-glass btn-lg btn-block" disabled><span className="th">รอผู้เล่นคนอื่นโหวต...</span></button>
        )}
        {phase === 'mission' && (
          meOnTeam && !iPlayed
            ? <div className="col gap8">
                <span className="tiny center row" style={{ justifyContent: 'center', fontWeight: 700 }}>คุณอยู่ในภารกิจ — เลือกการ์ด</span>
                <div className="row gap10">
                  <button className="btn btn-evil btn-lg" style={{ flex: 1, opacity: myPriv?.side === 'good' ? 0.45 : 1 }} disabled={busy || myPriv?.side === 'good'} onClick={() => act('PLAY_MISSION_CARD', { card: 'fail' as QuestOutcome })}><Icon name="x" size={18} stroke={3} /> <span className="th">ทรยศ</span></button>
                  <button className="btn btn-good btn-lg" style={{ flex: 1.3 }} disabled={busy} onClick={() => act('PLAY_MISSION_CARD', { card: 'success' as QuestOutcome })}><Icon name="shield" size={19} /> <span className="th">ทำสำเร็จ</span></button>
                </div>
                {myPriv?.side === 'good' && <span className="tiny center row" style={{ justifyContent: 'center', opacity: 0.65 }}>ฝ่ายดีต้องทำภารกิจให้สำเร็จเสมอ</span>}
              </div>
            : <button className="btn btn-glass btn-lg btn-block" disabled><span className="th">รอผลภารกิจ...</span></button>
        )}
        {phase === 'questReveal' && (
          isHost
            ? <button className="btn btn-primary btn-lg btn-block" disabled={busy} onClick={() => act('CONTINUE', null)}><span className="sheen" /><span className="th">{successCount >= 3 ? 'สู่การลอบสังหาร' : 'ภารกิจต่อไป'}</span> <Icon name="arrowR" size={20} stroke={2.6} /></button>
            : <button className="btn btn-glass btn-lg btn-block" disabled><span className="th">รอหัวห้อง...</span></button>
        )}
        {phase === 'assassinate' && (
          iAmAssassin
            ? <button className="btn btn-evil btn-lg btn-block" disabled={busy || !assassinTarget} onClick={() => act('ASSASSINATE', { targetId: assassinTarget })}><span className="sheen" /><Icon name="sword" size={20} /> <span className="th">ลอบสังหาร{assassinTarget ? ` ${byId(assassinTarget)?.name}` : ''}</span></button>
            : <button className="btn btn-glass btn-lg btn-block" disabled><span className="th">ฝ่ายชั่วกำลังเลือกเป้าหมาย...</span></button>
        )}
      </div>

      {chatOpen && (
        <ChatPanel messages={chat.messages} players={players} meId={meId} onSend={chat.sendMessage} onReact={chat.toggleReaction} onClose={() => setChatOpen(false)} />
      )}
    </div>
  );
}
