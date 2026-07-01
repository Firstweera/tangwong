// WerewolfGame — the complete Werewolf in-game UI.
// Composes GameShell with Werewolf-specific slots: day/night track strip,
// player ring (WerewolfTable), role card (WolfRoleCard), and a phase-driven
// action bar.  Mirrors AvalonGame's offline/online duality pattern.
import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/ui';
import { useGameEngine } from '../../engine';
import type { GameState, RoomState } from '../../engine';
import type { Player } from '@/types';
import { werewolfConfig } from '../config';
import type { WerewolfPublic, WerewolfPrivate } from '../types.ts';
import { nextBotAction, nextAutoActor } from '../bot';
import { GameShell } from '../../ui/GameShell';
import { WerewolfTable } from './WerewolfTable';
import { WolfRoleCard } from './WolfRoleCard';

type S = GameState<WerewolfPublic, WerewolfPrivate>;

const BOT_DELAY = 900;
const DISCUSS_MS = 3 * 60 * 1000; // 3-minute dayDiscuss countdown

function friendlyError(raw: string): string {
  const m = raw.toLowerCase();
  if (m.includes('version') || m.includes('retry')) return 'เกมเพิ่งอัปเดต ลองอีกครั้ง';
  if (m.includes('not allowed') || m.includes('already') || m.includes('invalid')) return 'ตานี้ทำรายการนั้นไม่ได้';
  if (m.includes('only the host') || m.includes('host only')) return 'เฉพาะหัวห้องเท่านั้น';
  if (m.includes('not authenticated') || m.includes('session')) return 'เซสชันหมดอายุ เข้าห้องใหม่';
  if (m.includes('network') || m.includes('fetch') || m.includes('failed')) return 'เชื่อมต่อไม่ได้ ลองอีกครั้ง';
  if (m.includes('same player two nights')) return 'ปกป้องคนเดิมสองคืนติดกันไม่ได้';
  if (m.includes('wolves must agree')) return 'หมาป่าต้องเลือกเป้าหมายเดียวกัน';
  return 'ทำรายการไม่สำเร็จ ลองอีกครั้ง';
}

export interface WerewolfGameProps {
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
  busy?: boolean;
  error?: string | null;
  showToast?: (message: string, emoji?: string) => void;
}

export function WerewolfGame({
  roomState, players, meId, onExit, onEnd,
  externalState = null, onSubmitAction, onStartGame, onTimeout,
  onlineMode = false, loading = false, busy = false,
  error = null, showToast,
}: WerewolfGameProps) {
  const local = useGameEngine<WerewolfPublic, WerewolfPrivate>(werewolfConfig);
  const state = externalState ?? local.state;
  const controlled = onlineMode || externalState !== null;

  const [roleOpen, setRoleOpen]         = useState(false);
  const [autoAll, setAutoAll]           = useState(false);
  const [nightTarget, setNightTarget]   = useState<string | null>(null);
  const [cupidSecond, setCupidSecond]   = useState<string | null>(null);
  const [voteTarget, setVoteTarget]     = useState<string | null>(null);
  const [discussRemaining, setDiscussRemaining] = useState(DISCUSS_MS);
  const discussFiredRef = useRef(false);

  const byId = (id: string) => players.find(p => p.id === id);

  // Hoist derived values before effects that depend on them.
  const phase    = state?.public.phase ?? 'lobby';
  const pub      = state?.public.data;
  const myPriv   = state?.private[meId]?.data as WerewolfPrivate | undefined;
  const isHost   = roomState.hostId === meId;
  const isNight  = phase === 'night' || phase === 'roleReveal';
  const isDawn   = phase === 'dawn';
  const aliveCount = pub ? players.filter(p => !pub.eliminatedPlayers.includes(p.id)).length : 0;
  const iEliminated = pub ? pub.eliminatedPlayers.includes(meId) : false;
  const iVoted      = pub ? (meId in pub.votes) : false;
  const iActedNight = pub ? pub.nightActors.includes(meId) : false;

  // ─── Start + first phase transition (offline) ────────────────────────────────
  useEffect(() => {
    if (controlled) return;
    local.start(roomState);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (controlled) return;
    if (state?.public.phase === 'lobby') local.transitionTo('roleReveal');
  }, [state?.public.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Bot autoplay (offline) ──────────────────────────────────────────────────
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

  // ─── End of game ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (state?.winner) {
      const t = setTimeout(() => onEnd(state), 1600);
      return () => clearTimeout(t);
    }
  }, [state?.winner]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Phase-change toasts ─────────────────────────────────────────────────────
  const prevPhase = useRef<string>('lobby');
  useEffect(() => {
    if (!state) return;
    const pub = state.public.data;
    const from = prevPhase.current;
    if (from === 'night' && phase === 'dawn') {
      if (pub.lastDeaths.length === 0) {
        showToast?.('ไม่มีใครตายคืนนี้ 😮', '🌅');
      } else if (pub.lastDeaths.length >= 2 && pub.lastDeaths.some(d => d.cause === 'heartbreak')) {
        const names = pub.lastDeaths.slice(0, 2).map(d => byId(d.playerId)?.name ?? '???').join(' & ');
        showToast?.(`${names} เสียชีวิตพร้อมกัน! 💘`, '💀');
      } else {
        const name = byId(pub.lastDeaths[0].playerId)?.name ?? '???';
        showToast?.(`${name} เสียชีวิต!`, '💀');
      }
    }
    if (from === 'dayVote' && phase === 'resolve') {
      const lynched = pub.lastDeaths.find(d => d.cause === 'lynched');
      const heartbreak = pub.lastDeaths.find(d => d.cause === 'heartbreak');
      if (!lynched) showToast?.('ไม่มีเสียงข้างมาก — รอดกันไป', '🤷');
      else if (heartbreak) {
        showToast?.(`${byId(lynched.playerId)?.name ?? '???'} ถูกประหาร — ${byId(heartbreak.playerId)?.name ?? '???'} สิ้นใจตาม 💘`, '⚖️');
      } else {
        showToast?.(`${byId(lynched.playerId)?.name ?? '???'} ถูกประหาร!`, '⚖️');
      }
    }
    prevPhase.current = phase;
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Error toasts ────────────────────────────────────────────────────────────
  const lastErrorRef = useRef<string | null>(null);
  useEffect(() => {
    if (!error) { lastErrorRef.current = null; return; }
    if (error === lastErrorRef.current) return;
    lastErrorRef.current = error;
    showToast?.(friendlyError(error), '⚠️');
  }, [error]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Reset selections on phase change ───────────────────────────────────────
  useEffect(() => {
    setNightTarget(null);
    setCupidSecond(null);
    setVoteTarget(null);
  }, [phase]);

  const act = (type: string, payload: unknown) => {
    if (controlled) void onSubmitAction?.(type, payload);
    else local.dispatch({ type, playerId: meId, payload });
  };

  // ─── dayDiscuss countdown ─────────────────────────────────────────────────────
  // Keep a ref to the latest `act` so the auto-fire effect never closes over a stale copy.
  const actRef = useRef(act);
  actRef.current = act;

  // Reset and start ticking whenever we enter dayDiscuss; clean up on phase exit.
  useEffect(() => {
    if (phase !== 'dayDiscuss') return;
    const start = Date.now();
    discussFiredRef.current = false;
    setDiscussRemaining(DISCUSS_MS);
    const id = setInterval(() => {
      const r = Math.max(0, DISCUSS_MS - (Date.now() - start));
      setDiscussRemaining(r);
      if (r <= 0) clearInterval(id);
    }, 250);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // When timer hits 0, host auto-fires CONTINUE (once per phase).
  useEffect(() => {
    if (phase !== 'dayDiscuss' || discussRemaining > 0 || discussFiredRef.current || !isHost) return;
    discussFiredRef.current = true;
    actRef.current('CONTINUE', null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discussRemaining, phase, isHost]);

  const discussSecs = phase === 'dayDiscuss' ? Math.ceil(discussRemaining / 1000) : 180;
  const timerUrgent  = phase === 'dayDiscuss' && discussSecs <= 15;
  const timerWarning = phase === 'dayDiscuss' && discussSecs <= 60;

  // ─── Ring seat-tap ───────────────────────────────────────────────────────────
  const seatTap = (id: string) => {
    if (!pub) return;
    if (pub.eliminatedPlayers.includes(id)) return;

    if (phase === 'night' && !iActedNight && !iEliminated) {
      const role = myPriv?.role;
      if (role === 'werewolf' && id === meId) return;
      if (role === 'seer' && id === meId) return;

      // Cupid: tap to toggle 2 distinct targets
      if (role === 'cupid' && pub.dayCount === 1) {
        if (id === nightTarget) { setNightTarget(null); return; }
        if (id === cupidSecond) { setCupidSecond(null); return; }
        if (!nightTarget) { setNightTarget(id); return; }
        if (!cupidSecond) { setCupidSecond(id); return; }
        return;
      }

      setNightTarget(prev => prev === id ? null : id);
    }

    if (phase === 'dayVote' && !iEliminated && !iVoted) {
      setVoteTarget(prev => prev === id ? null : id);
    }
  };

  // ─── Track strip ─────────────────────────────────────────────────────────────
  const track = pub ? (
    <div
      className="row between pad-x"
      style={{ paddingBottom: 8, alignItems: 'center', gap: 8 }}
    >
      <span
        className="chip"
        style={{
          background: isNight ? 'rgba(60,20,140,0.35)' : isDawn ? 'rgba(255,140,0,0.18)' : 'var(--surface)',
          borderColor: timerUrgent ? 'var(--evil)' : timerWarning ? 'var(--accent)' : isNight ? 'rgba(100,60,200,0.5)' : 'var(--border-2)',
          color: timerUrgent ? 'var(--evil)' : timerWarning ? 'var(--accent)' : undefined,
          fontWeight: 700,
          transition: 'background 0.6s, border-color 0.4s, color 0.4s',
        }}
      >
        {isNight ? '🌙' : isDawn ? '🌅' : '☀️'}
        {' '}
        {isNight ? 'คืนที่' : 'วันที่'} {pub.dayCount}
      </span>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      <span className="chip" style={{ background: 'var(--surface)', borderColor: 'var(--border-2)', fontWeight: 700 }}>
        👥 {aliveCount} รอด · 💀 {pub.eliminatedPlayers.length}
      </span>
    </div>
  ) : null;

  // ─── Ring center (phase status) ───────────────────────────────────────────────
  const center = (() => {
    if (!pub) return null;

    if (phase === 'roleReveal') return (
      <div className="col center">
        <span style={{ fontSize: 34 }}>🎴</span>
        <span className="th tiny" style={{ fontWeight: 800, marginTop: 6, textAlign: 'center' }}>
          เปิดบทบาทของคุณ
        </span>
      </div>
    );

    if (phase === 'night') {
      const submitted = pub.nightActors.length;
      const role = myPriv?.role;
      // Cupid's own view on night 1 before acting
      if (role === 'cupid' && pub.dayCount === 1 && !iActedNight) {
        const pickCount = [nightTarget, cupidSecond].filter(Boolean).length;
        return (
          <div className="col center">
            <span style={{ fontSize: 36, filter: 'drop-shadow(0 0 12px rgba(255,120,180,0.7))' }}>💘</span>
            <span className="th" style={{ fontWeight: 800, marginTop: 6, fontSize: 15 }}>กามเทพ</span>
            <span className="tiny" style={{ fontWeight: 700, marginTop: 4, color: 'var(--muted)' }}>
              เลือก {pickCount}/2 คน
            </span>
          </div>
        );
      }
      // Spellcaster's view before acting
      if (role === 'spellcaster' && !iActedNight) {
        return (
          <div className="col center">
            <span style={{ fontSize: 36, filter: 'drop-shadow(0 0 12px rgba(140,60,255,0.7))' }}>🤫</span>
            <span className="th" style={{ fontWeight: 800, marginTop: 6, fontSize: 15 }}>ผู้ร่ายคำสาป</span>
            <span className="tiny" style={{ fontWeight: 700, marginTop: 4, color: 'var(--muted)' }}>
              {nightTarget ? `${byId(nightTarget)?.name ?? '???'} — ยืนยัน?` : 'แตะผู้ถูกสาปใบ้'}
            </span>
          </div>
        );
      }
      return (
        <div className="col center">
          <span style={{ fontSize: 36, filter: 'drop-shadow(0 0 12px rgba(120,60,200,0.7))' }}>🌙</span>
          <span className="th" style={{ fontWeight: 800, marginTop: 6, fontSize: 15 }}>กลางคืน</span>
          {submitted > 0 && (
            <span className="tiny" style={{ fontWeight: 700, marginTop: 4, color: 'var(--muted)' }}>
              {submitted} ยืนยันแล้ว
            </span>
          )}
        </div>
      );
    }

    if (phase === 'dawn') {
      const deaths = pub.lastDeaths;
      return (
        <div className="col center pop">
          <span style={{ fontSize: 40, filter: 'drop-shadow(0 0 10px rgba(255,160,0,0.5))' }}>🌅</span>
          {deaths.length === 0 ? (
            <span className="th" style={{ fontWeight: 800, marginTop: 6, fontSize: 14, textAlign: 'center' }}>
              ไม่มีใครตายคืนนี้ 😮
            </span>
          ) : deaths.length === 1 ? (
            <span className="th" style={{ fontWeight: 800, marginTop: 6, fontSize: 14, color: 'var(--evil)', textAlign: 'center' }}>
              {byId(deaths[0].playerId)?.name ?? '???'} เสียชีวิต!{deaths[0].cause === 'heartbreak' ? ' 💘' : ''}
            </span>
          ) : (
            <>
              <span className="th" style={{ fontWeight: 800, marginTop: 6, fontSize: 13, color: 'var(--evil)', textAlign: 'center' }}>
                {deaths.length} คนเสียชีวิต!
              </span>
              {deaths.slice(0, 2).map((d, idx) => (
                <span key={idx} className="tiny" style={{ fontWeight: 700, marginTop: 1, color: 'var(--muted)', textAlign: 'center' }}>
                  {byId(d.playerId)?.name ?? '???'}{d.cause === 'heartbreak' ? ' 💘' : ''}
                </span>
              ))}
            </>
          )}
        </div>
      );
    }

    if (phase === 'dayDiscuss') {
      const m = Math.floor(discussSecs / 60);
      const s = discussSecs % 60;
      const timerStr = `${m}:${String(s).padStart(2, '0')}`;
      const timerColor = timerUrgent ? 'var(--evil)' : timerWarning ? 'var(--accent)' : 'var(--text)';
      const silencedName = pub.silenced && !pub.eliminatedPlayers.includes(pub.silenced)
        ? byId(pub.silenced)?.name ?? null
        : null;
      return (
        <div className="col center" style={{ gap: 3 }}>
          <span
            className={timerUrgent ? 'ww-timer-urgent' : undefined}
            style={{
              fontSize: 32,
              fontWeight: 900,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.03em',
              lineHeight: 1,
              color: timerColor,
              transition: 'color 0.5s',
            }}
          >
            {timerStr}
          </span>
          <span className="th" style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', marginTop: 5 }}>
            ☀️ ถกเถียง
          </span>
          {silencedName ? (
            <span className="th" style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', marginTop: 1 }}>
              🤫 {silencedName} ถูกสาปใบ้ — พูดไม่ได้
            </span>
          ) : (
            <span className="th" style={{ fontSize: 10, fontWeight: 700, color: timerWarning ? timerColor : 'var(--muted)', marginTop: 1, transition: 'color 0.5s' }}>
              {timerUrgent ? '⚠️ ใกล้หมดเวลา' : timerWarning ? '⏱️ เตรียมโหวต' : `${aliveCount} ผู้รอด`}
            </span>
          )}
        </div>
      );
    }

    if (phase === 'dayVote') {
      const voteCast = Object.keys(pub.votes).length;
      const silencedAlive = pub.silenced && !pub.eliminatedPlayers.includes(pub.silenced)
        ? byId(pub.silenced)?.name ?? null
        : null;
      return (
        <div className="col center">
          <span style={{ fontSize: 34 }}>⚖️</span>
          <span className="th" style={{ fontWeight: 800, marginTop: 6, fontSize: 15 }}>โหวตประหาร</span>
          <span className="tiny" style={{ fontWeight: 700, marginTop: 4, color: 'var(--muted)' }}>
            {voteCast}/{aliveCount} โหวตแล้ว
          </span>
          {silencedAlive && (
            <span className="tiny" style={{ fontWeight: 700, marginTop: 2, color: 'var(--accent)' }}>
              🤫 {silencedAlive} ถูกสาปใบ้ (พูดไม่ได้วันนี้)
            </span>
          )}
        </div>
      );
    }

    if (phase === 'resolve') {
      const lynched = pub.lastDeaths.find(d => d.cause === 'lynched');
      const heartbreak = pub.lastDeaths.find(d => d.cause === 'heartbreak');
      return (
        <div className="col center pop">
          {lynched ? (
            <>
              <span style={{ fontSize: 38 }}>⚖️</span>
              <span className="th" style={{ fontWeight: 800, marginTop: 6, fontSize: 14, color: 'var(--evil)', textAlign: 'center' }}>
                {byId(lynched.playerId)?.name ?? '???'} ถูกประหาร
              </span>
              {heartbreak && (
                <span className="tiny" style={{ fontWeight: 700, marginTop: 2, color: 'var(--primary)' }}>
                  💘 {byId(heartbreak.playerId)?.name ?? '???'} สิ้นใจตาม
                </span>
              )}
            </>
          ) : (
            <>
              <span style={{ fontSize: 38 }}>🤷</span>
              <span className="th" style={{ fontWeight: 800, marginTop: 6, fontSize: 14, textAlign: 'center' }}>
                ไม่มีเสียงข้างมาก
              </span>
              <span className="tiny" style={{ fontWeight: 700, marginTop: 2, color: 'var(--muted)' }}>
                ไม่มีการประหาร
              </span>
            </>
          )}
        </div>
      );
    }

    if (phase === 'end') {
      const goodWin = state?.winner?.winnerTeam === 'good';
      return (
        <div className="col center pop">
          <span style={{ fontSize: 44 }}>{goodWin ? '🛡️' : '🐺'}</span>
          <span className="th" style={{ fontWeight: 800, marginTop: 6, color: goodWin ? 'var(--good)' : 'var(--evil)', fontSize: 16, textAlign: 'center' }}>
            {goodWin ? 'ชาวบ้านชนะ' : 'หมาป่าชนะ'}
          </span>
        </div>
      );
    }
    return null;
  })();

  // ─── Action bar ───────────────────────────────────────────────────────────────
  const actionBar = (() => {
    if (!pub) return null;

    // ── roleReveal ────────────────────────────────────────────────────────────
    if (phase === 'roleReveal') {
      return isHost
        ? (
          <button className="btn btn-primary btn-lg btn-block" disabled={busy} onClick={() => act('CONTINUE', null)}>
            <span className="sheen" />
            <span className="th">{busy ? 'กำลังเริ่ม...' : '🌙 เริ่มคืนแรก'}</span>
          </button>
        )
        : <button className="btn btn-glass btn-lg btn-block" disabled><span className="th">รอหัวห้องเริ่ม...</span></button>;
    }

    // ── night ─────────────────────────────────────────────────────────────────
    if (phase === 'night') {
      if (iEliminated) return <button className="btn btn-glass btn-lg btn-block" disabled><span className="th">💀 คุณถูกกำจัดแล้ว</span></button>;
      if (iActedNight) return <button className="btn btn-glass btn-lg btn-block" disabled><span className="th">ส่งแล้ว — รอผู้เล่นคนอื่น...</span></button>;

      const role = myPriv?.role;

      if (role === 'villager') {
        return <button className="btn btn-glass btn-lg btn-block" disabled><span className="th">🏡 ชาวบ้านรอฟ้าสาง...</span></button>;
      }

      if (role === 'werewolf') {
        const packVotes = (myPriv?.sees ?? [])
          .map(wolfId => ({ wolfId, target: pub.wolfVotes?.[wolfId] ?? null }))
          .filter(v => v.target !== null);
        return (
          <div className="col gap8">
            {packVotes.length > 0 && (
              <div className="col" style={{ gap: 3 }}>
                {packVotes.map(v => (
                  <span key={v.wolfId} className="th" style={{ fontSize: 11, fontWeight: 700, textAlign: 'center', color: 'var(--evil)', opacity: 0.85 }}>
                    🐺 {byId(v.wolfId)?.name ?? '???'} เลือก {byId(v.target!)?.name ?? '???'}
                  </span>
                ))}
              </div>
            )}
            <span style={{ fontSize: 12, fontWeight: 700, textAlign: 'center', color: 'var(--muted)' }}>
              {nightTarget ? `เลือก ${byId(nightTarget)?.name ?? '???'} — ยืนยันหรือเปลี่ยนใจ` : '🐺 แตะผู้เล่นเพื่อเลือกเหยื่อ'}
            </span>
            <div className="row gap10">
              {nightTarget && (
                <button className="btn btn-evil btn-lg" style={{ flex: 1.4 }} disabled={busy}
                  onClick={() => { act('WEREWOLF_KILL', { targetId: nightTarget }); setNightTarget(null); }}>
                  <span className="sheen" />
                  <Icon name="sword" size={18} stroke={2.5} />
                  <span className="th">โหวตฆ่า</span>
                </button>
              )}
              <button
                className={`btn ${nightTarget ? 'btn-glass' : 'btn-ghost'} btn-lg`}
                style={{ flex: nightTarget ? 1 : undefined, width: nightTarget ? undefined : '100%' }}
                onClick={() => setNightTarget(null)}
                disabled={!nightTarget}
              >
                <span className="th">{nightTarget ? 'เปลี่ยนใจ' : 'เลือกเหยื่อจากตาราง'}</span>
              </button>
            </div>
          </div>
        );
      }

      if (role === 'seer') {
        return (
          <div className="col gap8">
            <span style={{ fontSize: 12, fontWeight: 700, textAlign: 'center', color: 'var(--primary)' }}>
              👁️ แตะผู้เล่นเพื่อตรวจสอบ
            </span>
            {nightTarget
              ? (
                <button className="btn btn-primary btn-lg btn-block" disabled={busy} onClick={() => { act('SEER_PEEK', { targetId: nightTarget }); setNightTarget(null); }}>
                  <span className="sheen" />
                  <Icon name="eye" size={19} />
                  <span className="th">ตรวจ {byId(nightTarget)?.name ?? '???'}</span>
                </button>
              )
              : <button className="btn btn-glass btn-lg btn-block" disabled><span className="th">เลือกผู้ถูกตรวจสอบ</span></button>
            }
          </div>
        );
      }

      if (role === 'doctor') {
        const isRepeat = nightTarget === myPriv?.doctorLastProtected;
        return (
          <div className="col gap8">
            <span style={{ fontSize: 12, fontWeight: 700, textAlign: 'center', color: 'var(--success)' }}>
              💊 แตะผู้เล่นเพื่อปกป้อง (รวมตัวเอง)
            </span>
            {nightTarget
              ? isRepeat
                ? <button className="btn btn-glass btn-lg btn-block" disabled><span className="th">⚠️ ปกป้องคนเดิมสองคืนติดกันไม่ได้</span></button>
                : (
                  <button className="btn btn-good btn-lg btn-block" disabled={busy} onClick={() => { act('DOCTOR_SAVE', { targetId: nightTarget }); setNightTarget(null); }}>
                    <span className="sheen" />
                    <Icon name="shield" size={19} />
                    <span className="th">ปกป้อง {byId(nightTarget)?.name ?? '???'}</span>
                  </button>
                )
              : <button className="btn btn-glass btn-lg btn-block" disabled><span className="th">เลือกผู้ถูกปกป้อง</span></button>
            }
          </div>
        );
      }

      // Cupid: night 1 only — pick 2 lovers
      if (role === 'cupid' && pub.dayCount === 1) {
        const both = nightTarget && cupidSecond;
        return (
          <div className="col gap8">
            <span style={{ fontSize: 12, fontWeight: 700, textAlign: 'center', color: 'var(--primary)' }}>
              💘 แตะผู้เล่น 2 คนให้ตกหลุมรัก
            </span>
            {both ? (
              <button
                className="btn btn-primary btn-lg btn-block"
                disabled={busy}
                onClick={() => { act('CUPID_LINK', { targetIds: [nightTarget, cupidSecond] }); setNightTarget(null); setCupidSecond(null); }}
              >
                <span className="sheen" />
                <span className="th">💘 เชื่อมใจ {byId(nightTarget)?.name ?? '???'} & {byId(cupidSecond)?.name ?? '???'}</span>
              </button>
            ) : (
              <button className="btn btn-glass btn-lg btn-block" disabled>
                <span className="th">
                  {nightTarget ? `✓ ${byId(nightTarget)?.name ?? '???'} — แตะคนที่ 2` : 'แตะผู้เล่นคนแรก'}
                </span>
              </button>
            )}
          </div>
        );
      }

      // Cupid on nights 2+ — no action
      if (role === 'cupid') {
        return <button className="btn btn-glass btn-lg btn-block" disabled><span className="th">💘 คู่รักเชื่อมใจแล้ว...</span></button>;
      }

      // Spellcaster — pick 1 player to silence each night
      if (role === 'spellcaster') {
        return (
          <div className="col gap8">
            <span style={{ fontSize: 12, fontWeight: 700, textAlign: 'center', color: 'var(--primary)' }}>
              🤫 แตะผู้เล่นเพื่อสาปใบ้
            </span>
            {nightTarget ? (
              <button
                className="btn btn-primary btn-lg btn-block"
                disabled={busy}
                onClick={() => { act('SILENCE', { targetId: nightTarget }); setNightTarget(null); }}
              >
                <span className="sheen" />
                <span className="th">🤫 สาปใบ้ {byId(nightTarget)?.name ?? '???'}</span>
              </button>
            ) : (
              <button className="btn btn-glass btn-lg btn-block" disabled>
                <span className="th">เลือกผู้ถูกสาป</span>
              </button>
            )}
          </div>
        );
      }
    }

    // ── dawn ──────────────────────────────────────────────────────────────────
    if (phase === 'dawn') {
      return isHost
        ? (
          <button className="btn btn-accent btn-lg btn-block" disabled={busy} onClick={() => act('CONTINUE', null)}>
            <span className="sheen" />
            <span className="th">{busy ? '...' : '☀️ เริ่มการถกเถียง'}</span>
          </button>
        )
        : <button className="btn btn-glass btn-lg btn-block" disabled><span className="th">รอหัวห้อง...</span></button>;
    }

    // ── dayDiscuss ────────────────────────────────────────────────────────────
    if (phase === 'dayDiscuss') {
      const isSilenced = pub.silenced === meId && !iEliminated;
      return (
        <div className="col gap8">
          {isSilenced && (
            <div className="btn btn-glass btn-lg btn-block" style={{ pointerEvents: 'none', color: 'var(--accent)', fontWeight: 700 }}>
              <span className="th">🤫 ถูกสาปใบ้ — พูดถกเถียงไม่ได้วันนี้ แต่ยังโหวตได้</span>
            </div>
          )}
          {isHost
            ? (
              <button
                className={`btn ${timerUrgent ? 'btn-evil' : 'btn-accent'} btn-lg btn-block`}
                disabled={busy}
                onClick={() => act('CONTINUE', null)}
              >
                <span className="sheen" />
                <Icon name="vote" size={19} />
                <span className="th">{busy ? '...' : timerUrgent ? '⚠️ เปิดการโหวต!' : 'เปิดการโหวต'}</span>
              </button>
            )
            : (
              <button className="btn btn-glass btn-lg btn-block" disabled>
                <span className="th">{timerUrgent ? '⚠️ กำลังเปิดโหวต...' : 'รอหัวห้องเปิดโหวต...'}</span>
              </button>
            )}
        </div>
      );
    }

    // ── dayVote ───────────────────────────────────────────────────────────────
    if (phase === 'dayVote') {
      if (iEliminated) return <button className="btn btn-glass btn-lg btn-block" disabled><span className="th">💀 คุณถูกกำจัดแล้ว</span></button>;
      if (iVoted) return <button className="btn btn-glass btn-lg btn-block" disabled><span className="th">โหวตแล้ว — รอคนอื่น...</span></button>;
      return (
        <div className="col gap8">
          <span style={{ fontSize: 12, fontWeight: 700, textAlign: 'center', color: 'var(--muted)' }}>
            {voteTarget ? `เลือก ${byId(voteTarget)?.name ?? '???'} — ยืนยันหรือเปลี่ยนใจ` : 'แตะผู้เล่นเพื่อเลือกโหวต'}
          </span>
          <div className="row gap10">
            {voteTarget && (
              <button className="btn btn-evil btn-lg" style={{ flex: 1.4 }} disabled={busy}
                onClick={() => { act('LYNCH_VOTE', { targetId: voteTarget }); setVoteTarget(null); }}>
                <span className="sheen" />
                <Icon name="vote" size={18} />
                <span className="th">โหวตประหาร</span>
              </button>
            )}
            <button
              className={`btn ${voteTarget ? 'btn-glass' : 'btn-ghost'} btn-lg`}
              style={{ flex: voteTarget ? 1 : undefined, width: voteTarget ? undefined : '100%' }}
              disabled={busy}
              onClick={() => { act('LYNCH_VOTE', { targetId: null }); setVoteTarget(null); }}
            >
              <span className="th">งดออกเสียง</span>
            </button>
          </div>
        </div>
      );
    }

    // ── resolve ───────────────────────────────────────────────────────────────
    if (phase === 'resolve') {
      return isHost
        ? (
          <button className="btn btn-primary btn-lg btn-block" disabled={busy} onClick={() => act('CONTINUE', null)}>
            <span className="sheen" />
            <span className="th">{busy ? '...' : '🌙 เริ่มคืนใหม่'}</span>
            <Icon name="arrowR" size={20} stroke={2.6} />
          </button>
        )
        : <button className="btn btn-glass btn-lg btn-block" disabled><span className="th">รอหัวห้อง...</span></button>;
    }

    return null;
  })();

  // ─── Mode chip (top bar extras) ───────────────────────────────────────────────
  const modeChip = onlineMode
    ? <span className="chip" style={{ background: 'var(--surface)', borderColor: 'var(--border-2)', fontWeight: 700 }}>ออนไลน์</span>
    : <button className="chip" onClick={() => setAutoAll(a => !a)} style={{ background: autoAll ? 'var(--grad-soft)' : 'var(--surface)', borderColor: 'var(--border-2)', fontWeight: 700 }}>🤖 {autoAll ? 'ออโต้' : 'แมนนวล'}</button>;

  const loadingContent = onlineMode && onStartGame ? (
    <button className="btn btn-primary btn-lg" onClick={() => void onStartGame()}>
      <span className="sheen" />
      <Icon name="check" size={19} stroke={3} />
      <span className="th">เริ่มเกมออนไลน์</span>
    </button>
  ) : null;

  // ─── Role strip ────────────────────────────────────────────────────────────
  const roleStrip = myPriv ? (
    <WolfRoleCard
      role={myPriv.role}
      team={myPriv.team}
      sees={myPriv.sees}
      seerHistory={myPriv.seerHistory ?? []}
      doctorLastProtected={myPriv.doctorLastProtected}
      loverOf={myPriv.loverOf}
      players={players}
      eliminatedPlayers={pub?.eliminatedPlayers ?? []}
      open={roleOpen}
      onToggle={() => setRoleOpen(o => !o)}
    />
  ) : null;

  return (
    <GameShell
      roomId={roomState.roomId}
      meId={meId}
      players={players}
      hasState={Boolean(state && pub)}
      loading={loading}
      onlineMode={onlineMode}
      winner={state?.winner}
      timeLeft={undefined}
      busy={busy}
      onExit={onExit}
      extraChips={modeChip}
      track={track}
      table={pub ? (
        <WerewolfTable
          players={players}
          meId={meId}
          eliminatedPlayers={pub.eliminatedPlayers}
          revealedRoles={pub.revealedRoles}
          nightActors={pub.nightActors}
          votes={pub.votes}
          seerHistory={myPriv?.seerHistory ?? []}
          wolfSees={myPriv?.sees ?? []}
          myRole={myPriv?.role ?? null}
          doctorLastProtected={myPriv?.doctorLastProtected ?? null}
          phase={phase}
          nightTarget={nightTarget}
          voteTarget={voteTarget}
          onSeatTap={seatTap}
          center={center}
        />
      ) : null}
      roleStrip={roleStrip}
      actionBar={actionBar}
      loadingContent={loadingContent}
      chatInputDisabled={
        pub?.silenced === meId && !iEliminated && (phase === 'dayDiscuss' || phase === 'dayVote')
          ? '🤫 ถูกสาปใบ้ — พูดไม่ได้วันนี้'
          : undefined
      }
    />
  );
}
