import { useEffect, useMemo, useState } from 'react';
import { Avatar, Icon } from '@/components/ui';
import type { Player } from '@/types';
import type { GameState, RoomState } from '../../engine';
import { GameShell } from '../../ui/GameShell';
import { CHECKPOINT_GOODS, LEGAL_GOODS } from '../goods.ts';
import type { CheckpointGoodId, CheckpointPrivate, CheckpointPublic, LegalGoodId } from '../types.ts';

type S = GameState<CheckpointPublic, CheckpointPrivate>;

export interface CheckpointGameProps {
  roomState: RoomState;
  players: Player[];
  meId: string;
  onExit: () => void;
  onEnd: (state: S) => void;
  externalState?: S | null;
  onSubmitAction?: (type: string, payload: unknown) => void | Promise<void>;
  onStartGame?: () => void | Promise<void>;
  onlineMode?: boolean;
  loading?: boolean;
  busy?: boolean;
  error?: string | null;
  showToast?: (message: string, emoji?: string) => void;
  /** Offline only: the local seat is bot-played. */
  autoPlay?: boolean;
  onToggleAutoPlay?: () => void;
}

export function CheckpointGame({
  roomState, players, meId, onExit, onEnd, externalState = null,
  onSubmitAction, onlineMode = false, loading = false, busy = false, error, showToast,
  autoPlay = false, onToggleAutoPlay,
}: CheckpointGameProps) {
  // State comes from the GameClient (Supabase online, LocalTransport offline);
  // bots, setup and phase entry all run in the transport, not here.
  const state = externalState;
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);
  const [declaredGoodId, setDeclaredGoodId] = useState<LegalGoodId>('rice');
  const [offer, setOffer] = useState(0);

  const phase = state?.public.phase ?? 'lobby';
  const pub = state?.public.data;
  const mine = state?.private[meId]?.data as CheckpointPrivate | undefined;
  const isHost = roomState.hostId === meId;
  const isGatekeeper = pub?.gatekeeperId === meId;
  const me = players.find(player => player.id === meId);
  const byId = (id: string) => players.find(player => player.id === id);

  useEffect(() => {
    setSelectedIndexes([]);
    setOffer(0);
    const content = document.querySelector<HTMLElement>('.game-shell-content');
    if (content) content.scrollTop = 0;
  }, [phase, pub?.shift]);

  useEffect(() => {
    if (!state?.winner) return;
    const timer = setTimeout(() => onEnd(state), 1200);
    return () => clearTimeout(timer);
  }, [state?.winner]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (error) showToast?.('ทำรายการไม่สำเร็จ ลองอีกครั้ง', '⚠️');
  }, [error]); // eslint-disable-line react-hooks/exhaustive-deps

  const act = (type: string, payload: unknown) => {
    void onSubmitAction?.(type, payload);
  };

  const selectedGoods = useMemo(
    () => selectedIndexes.map(index => mine?.hand[index]).filter(Boolean) as CheckpointGoodId[],
    [selectedIndexes, mine?.hand],
  );

  if (!pub) {
    return <GameShell roomId={roomState.roomId} meId={meId} players={players} hasState={false} loading={loading} onExit={onExit} />;
  }

  const gatekeeper = byId(pub.gatekeeperId);
  const merchantIds = pub.playerOrder.filter(id => id !== pub.gatekeeperId);
  const phaseInfo: Record<string, { em: string; th: string }> = {
    pack: { em: '🧳', th: 'จัดกระเป๋า' },
    negotiate: { em: '🤝', th: 'เจรจา' },
    decide: { em: '🛂', th: 'ตัดสิน' },
    shiftResult: { em: '🧾', th: 'ปิดตลาด' },
    end: { em: '🏆', th: 'จบเกม' },
  };
  const currentPhase = phaseInfo[phase] ?? phaseInfo.pack;

  const track = (
    <div className="checkpoint-track pad-x">
      <div className="checkpoint-progress-row">
        <span className="th checkpoint-kicker">รอบ {pub.cycle}/2</span>
        <span className="th checkpoint-phase">{currentPhase.em} {currentPhase.th}</span>
        <span className="th checkpoint-kicker">กะ {pub.shift}/{pub.totalShifts}</span>
      </div>
      <div className="checkpoint-progress"><span style={{ width: `${(pub.shift / pub.totalShifts) * 100}%` }} /></div>
    </div>
  );

  const merchantRows = merchantIds.map(id => {
    const player = byId(id);
    const declaration = pub.declarations[id];
    const resolution = pub.resolutions.find(item => item.merchantId === id);
    const offerAmount = isGatekeeper ? mine?.receivedOffers[id] : undefined;
    const rumorCount = Object.values(pub.rumors).filter(target => target === id).length;
    return (
      <div className="checkpoint-merchant" key={id} data-resolved={Boolean(resolution)}>
        <Avatar who={player} size={42} />
        <div className="checkpoint-merchant-copy">
          <strong className="th">{player?.name ?? 'ผู้เล่น'}{id === meId ? ' · คุณ' : ''}</strong>
          <span className="th">
            {declaration ? `${CHECKPOINT_GOODS[declaration.goodId].emoji} ${CHECKPOINT_GOODS[declaration.goodId].nameTh} ×${declaration.count}` : 'กำลังจัดกระเป๋า...'}
          </span>
          {resolution && (
            <span className={resolution.truthful === false ? 'checkpoint-bad' : 'checkpoint-good'}>
              {resolution.decision === 'pass' ? `ผ่าน · จ่าย ${resolution.offerPaid} บาท` : resolution.truthful ? 'ตรวจแล้วซื่อสัตย์' : `จับโกหก · ปรับ ${resolution.penaltyPaid} บาท`}
            </span>
          )}
        </div>
        <div className="checkpoint-merchant-meta">
          {rumorCount > 0 && <span title="จำนวนข่าวลือ">📣 {rumorCount}</span>}
          {offerAmount !== undefined && phase === 'decide' && <span title="ข้อเสนอลับ">💵 {offerAmount}</span>}
          {phase === 'negotiate' && pub.offersSubmitted.includes(id) && <span className="checkpoint-good">✓</span>}
          {phase === 'negotiate' && !isGatekeeper && id !== meId && !mine?.rumorUsed && (
            <button className="checkpoint-rumor-button th" onClick={() => act('PLACE_RUMOR', { targetId: id })} title="ปล่อยข่าวลือ">📣</button>
          )}
        </div>
        {phase === 'decide' && isGatekeeper && !resolution && (
          <div className="checkpoint-decisions">
            <button className="checkpoint-icon-action pass" disabled={busy} onClick={() => act('PASS_MERCHANT', { merchantId: id })} aria-label={`ให้ ${player?.name} ผ่าน`} title="ให้ผ่าน">✓</button>
            <button className="checkpoint-icon-action inspect" disabled={busy || pub.inspectionSeals <= 0} onClick={() => act('INSPECT_MERCHANT', { merchantId: id })} aria-label={`ตรวจ ${player?.name}`} title="ตรวจค้น"><Icon name="search" size={17} /></button>
          </div>
        )}
      </div>
    );
  });

  const table = (
    <div className="checkpoint-board pad-x">
      <div className="checkpoint-gatekeeper">
        <Avatar who={gatekeeper} size={60} ring="var(--accent)" />
        <div>
          <span className="th checkpoint-kicker">ผู้คุ้มด่าน</span>
          <strong className="th">{gatekeeper?.name ?? 'ผู้เล่น'}{isGatekeeper ? ' · คุณ' : ''}</strong>
        </div>
        <div className="checkpoint-seals" title="ตราตรวจค้นที่เหลือ">🔎 {pub.inspectionSeals}</div>
      </div>

      {phase === 'pack' && !isGatekeeper && !pub.declarations[meId] ? (
        <div className="checkpoint-hand-section">
          <div className="checkpoint-section-title"><strong className="th">เลือกสินค้า 1–3 ชิ้น</strong><span>{selectedGoods.length}/3</span></div>
          <div className="checkpoint-hand">
            {(mine?.hand ?? []).map((id, index) => {
              const good = CHECKPOINT_GOODS[id];
              const selected = selectedIndexes.includes(index);
              return (
                <button key={`${id}-${index}`} className="checkpoint-good-card" data-selected={selected} data-illegal={!good.legal} onClick={() => setSelectedIndexes(current => selected ? current.filter(i => i !== index) : current.length < 3 ? [...current, index] : current)}>
                  <span>{good.emoji}</span><strong className="th">{good.nameTh}</strong><small className="th">{good.legal ? 'ถูกกฎหมาย' : 'ผิดกฎหมาย'} · {good.value}฿</small>
                </button>
              );
            })}
          </div>
          <label className="checkpoint-declare-label th" htmlFor="checkpoint-declaration">ประกาศว่าในกระเป๋าเป็น</label>
          <select id="checkpoint-declaration" className="checkpoint-select th" value={declaredGoodId} onChange={event => setDeclaredGoodId(event.target.value as LegalGoodId)}>
            {LEGAL_GOODS.map(good => <option key={good.id} value={good.id}>{good.emoji} {good.nameTh}</option>)}
          </select>
        </div>
      ) : (
        <div className="checkpoint-merchant-list">{merchantRows}</div>
      )}

      {phase === 'shiftResult' && (
        <div className="checkpoint-scoreboard">
          {[...pub.playerOrder].sort((a, b) => pub.wealth[b] - pub.wealth[a]).map((id, index) => (
            <div key={id}><span>{index + 1}</span><Avatar who={byId(id)} size={32} /><strong className="th">{byId(id)?.name}{id === meId ? ' · คุณ' : ''}</strong><b>{pub.wealth[id]}฿</b></div>
          ))}
        </div>
      )}
    </div>
  );

  const roleStrip = (
    <div className="checkpoint-wallet pad-x">
      <span><small className="th">เงินสด</small><strong>{pub.cash[meId]}฿</strong></span>
      <span><small className="th">มูลค่าสินค้า</small><strong>{pub.wealth[meId] - pub.cash[meId]}฿</strong></span>
      <span><small className="th">รวม</small><strong>{pub.wealth[meId]}฿</strong></span>
    </div>
  );

  let actionBar = <span className="game-action-hint th">รอผู้เล่นคนอื่น...</span>;
  if (phase === 'pack' && !isGatekeeper && !pub.declarations[meId]) {
    actionBar = <button className="btn btn-primary btn-lg checkpoint-primary" disabled={busy || selectedGoods.length < 1} onClick={() => act('SUBMIT_CRATE', { goods: selectedGoods, declaredGoodId })}><span className="th">🧳 ปิดผนึกกระเป๋า · {selectedGoods.length} ชิ้น</span></button>;
  } else if (phase === 'pack') {
    actionBar = <span className="game-action-hint th">{isGatekeeper ? 'รอพ่อค้าจัดกระเป๋าให้ครบ' : 'ปิดผนึกแล้ว รอคนอื่น...'}</span>;
  } else if (phase === 'negotiate' && !isGatekeeper && !pub.offersSubmitted.includes(meId)) {
    actionBar = (
      <div className="checkpoint-offer-bar">
        <button aria-label="ลดข้อเสนอ" onClick={() => setOffer(value => Math.max(0, value - 1))}>−</button>
        <div><small className="th">ข้อเสนอลับ</small><strong>{offer} บาท</strong></div>
        <button aria-label="เพิ่มข้อเสนอ" onClick={() => setOffer(value => Math.min(5, value + 1))}>+</button>
        <button className="btn btn-primary th" disabled={busy} onClick={() => act('SUBMIT_OFFER', { amount: offer })}>ยื่นข้อเสนอ</button>
      </div>
    );
  } else if (phase === 'negotiate') {
    actionBar = <span className="game-action-hint th">{isGatekeeper ? 'ข้อเสนอจะเปิดให้คุณเห็นเมื่อทุกคนยื่นครบ' : 'ยื่นข้อเสนอแล้ว รอการตัดสิน...'}</span>;
  } else if (phase === 'decide') {
    actionBar = <span className="game-action-hint th">{isGatekeeper ? 'เลือก ✓ ให้ผ่าน หรือ 🔎 ตรวจค้นพ่อค้าแต่ละคน' : 'ผู้คุ้มด่านกำลังตัดสินกระเป๋าของทุกคน'}</span>;
  } else if (phase === 'shiftResult' && isHost) {
    actionBar = <button className="btn btn-primary btn-lg checkpoint-primary" disabled={busy} onClick={() => act('CONTINUE_SHIFT', null)}><span className="th">{pub.shift === pub.totalShifts ? '🏆 สรุปผลเกม' : 'หมุนผู้คุ้มด่าน →'}</span></button>;
  } else if (phase === 'shiftResult') {
    actionBar = <span className="game-action-hint th">รอหัวห้องเปิดกะถัดไป...</span>;
  }

  return (
    <GameShell
      roomId={roomState.roomId} meId={meId} players={players} hasState={Boolean(state)} winner={state?.winner}
      onlineMode={onlineMode} busy={busy} onExit={onExit} track={track} table={table} roleStrip={roleStrip} actionBar={actionBar}
      extraChips={!onlineMode ? <button className="chip checkpoint-auto th" onClick={onToggleAutoPlay}>🤖 {autoPlay ? 'หยุด' : 'ออโต้'}</button> : undefined}
    />
  );
}
