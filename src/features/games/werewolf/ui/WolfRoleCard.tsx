// WolfRoleCard — secret role strip adapted for Werewolf roles.
// Wolves see their pack; Seer sees accumulated inspection history;
// Doctor sees last-protected (cannot repeat). Villagers get a motivating message.
import { Avatar, Icon } from '@/components/ui';
import type { Player } from '@/types';
import type { WerewolfRole, WerewolfTeam, WerewolfPrivate } from '../types.ts';

// Role display metadata
const ROLE_INFO: Record<WerewolfRole, { em: string; th: string; desc: string }> = {
  werewolf:    { em: '🐺', th: 'หมาป่า',              desc: 'คืนนี้เลือกล่าเหยื่อ ปกปิดตัวตนในตอนกลางวัน อย่าให้ชาวบ้านรู้ว่าคุณเป็นใคร' },
  seer:        { em: '👁️', th: 'ผู้พยากรณ์',          desc: 'ตรวจสอบได้ 1 คนต่อคืน คุณจะรู้ว่าเป้าหมายเป็นหมาป่าหรือไม่ แต่อย่าเปิดเผยตัวตนเร็วเกินไป' },
  doctor:      { em: '💊', th: 'หมอ',                  desc: 'ปกป้อง 1 คนต่อคืน รวมถึงตัวคุณเอง แต่ปกป้องคนเดิมสองคืนติดกันไม่ได้' },
  villager:    { em: '🏡', th: 'ชาวบ้าน',             desc: 'คุณไม่มีพลังพิเศษ แต่เสียงโหวตของคุณมีความสำคัญ ช่วยหาหมาป่าให้เจอ' },
  cupid:       { em: '💘', th: 'กามเทพ',              desc: 'คืนแรกเท่านั้น — เลือก 2 คนให้เป็นคู่รัก ถ้าคนใดคนหนึ่งตาย อีกคนจะตายตามด้วยหัวใจสลาย' },
  spellcaster: { em: '🤫', th: 'ผู้ร่ายคำสาปใบ้',    desc: 'ทุกคืนเลือก 1 คนให้ใบ้ — เหยื่อพูดถกเถียงไม่ได้ในวันนั้น แต่ยังโหวตได้ตามปกติ' },
};

const TEAM_LABEL: Record<WerewolfTeam, { label: string; color: string }> = {
  good: { label: 'ฝ่ายชาวบ้าน', color: 'var(--good)' },
  evil: { label: 'ฝ่ายหมาป่า',  color: 'var(--evil)' },
};

export interface WolfRoleCardProps {
  role: WerewolfRole;
  team: WerewolfTeam;
  /** Fellow wolf IDs (wolves only). */
  sees: string[];
  seerHistory: WerewolfPrivate['seerHistory'];
  doctorLastProtected: string | null;
  loverOf?: string | null;
  players: Player[];
  eliminatedPlayers: string[];
  open: boolean;
  onToggle: () => void;
}

export function WolfRoleCard({
  role, team, sees, seerHistory, doctorLastProtected, loverOf,
  players, eliminatedPlayers, open, onToggle,
}: WolfRoleCardProps) {
  const info = ROLE_INFO[role];
  const teamInfo = TEAM_LABEL[team];
  const byId = (id: string) => players.find(p => p.id === id);

  const roleColor = team === 'evil' ? 'var(--evil)' : 'var(--good)';

  return (
    <div className="pad-x" style={{ marginBottom: 8 }}>
      {/* Toggle button */}
      <button
        className="role-card row between"
        style={{
          width: '100%', padding: 12,
          background: open ? (team === 'evil' ? 'rgba(255,92,108,0.10)' : 'var(--grad-soft)') : 'var(--surface)',
          backdropFilter: 'blur(18px)',
        }}
        onClick={onToggle}
      >
        <div className="row gap12">
          <div
            className="row center"
            style={{
              width: 40, height: 40, borderRadius: 12,
              background: open ? roleColor : 'var(--surface-2)',
              fontSize: 20, transition: 'background 0.2s',
            }}
          >
            {open ? info.em : '🎴'}
          </div>
          <div className="col" style={{ gap: 1, textAlign: 'left' }}>
            <span className="th h3">
              {open
                ? <>{info.th} · <span style={{ color: roleColor }}>{teamInfo.label}</span></>
                : 'บทบาทของคุณ'}
            </span>
            <span className="tiny">{open ? 'แตะเพื่อซ่อน' : 'แตะเพื่อดู (เป็นความลับ)'}</span>
          </div>
        </div>
        <Icon name={open ? 'eye' : 'lock'} size={18} style={{ color: 'var(--muted)', flexShrink: 0 }} />
      </button>

      {/* Expanded details */}
      {open && (
        <div className="card rise" style={{ padding: 14, marginTop: 8 }}>
          <p className="th body" style={{ fontSize: 13, color: 'var(--text)', marginBottom: 10 }}>
            {info.desc}
          </p>

          {/* Wolf pack */}
          {role === 'werewolf' && (
            sees.length > 0 ? (
              <>
                <div className="divider" style={{ margin: '10px 0' }} />
                <span className="eyebrow" style={{ color: 'var(--evil)' }}>พวกพ้องหมาป่า 😈</span>
                <div className="row gap14" style={{ marginTop: 10, flexWrap: 'wrap' }}>
                  {sees.map(id => {
                    const p = byId(id);
                    if (!p) return null;
                    return (
                      <div key={id} className="col center gap6">
                        <Avatar who={p} size={44} ring="var(--evil)" />
                        <span className="th tiny" style={{ fontWeight: 700 }}>{p.name}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <span className="tiny" style={{ display: 'block', color: 'var(--evil)', fontWeight: 700 }}>
                🐺 คุณเป็นหมาป่าเพียงตัวเดียว
              </span>
            )
          )}

          {/* Seer history */}
          {role === 'seer' && (
            seerHistory.length > 0 ? (
              <>
                <div className="divider" style={{ margin: '10px 0' }} />
                <span className="eyebrow">ผลการตรวจสอบ</span>
                <div className="col" style={{ gap: 8, marginTop: 10 }}>
                  {seerHistory.map((h) => {
                    const p = byId(h.playerId);
                    if (!p) return null;
                    const isEvil = h.result === 'evil';
                    const dead = eliminatedPlayers.includes(h.playerId);
                    return (
                      <div key={h.playerId} className="row" style={{ alignItems: 'center', gap: 10, opacity: dead ? 0.6 : 1 }}>
                        <Avatar who={p} size={36} ring={isEvil ? 'var(--evil)' : 'var(--success)'} />
                        <div className="col" style={{ gap: 1 }}>
                          <span className="th tiny" style={{ fontWeight: 700 }}>
                            {p.name}{dead ? ' 💀' : ''}
                          </span>
                          <span style={{
                            fontSize: 11, fontWeight: 700,
                            color: isEvil ? 'var(--evil)' : 'var(--success)',
                          }}>
                            {isEvil ? '🐺 หมาป่า' : '✅ ไม่ใช่หมาป่า'} · คืนที่ {h.dayCount}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <span className="tiny" style={{ display: 'block', marginTop: 6, color: 'var(--muted)', fontWeight: 700 }}>
                👁️ ยังไม่ได้ตรวจสอบใครเลย — เลือกเป้าหมายคืนนี้
              </span>
            )
          )}

          {/* Doctor last protected */}
          {role === 'doctor' && doctorLastProtected && (
            <>
              <div className="divider" style={{ margin: '10px 0' }} />
              <span className="eyebrow">ปกป้องล่าสุด</span>
              <div className="row gap10" style={{ marginTop: 8, alignItems: 'center' }}>
                {(() => {
                  const p = byId(doctorLastProtected);
                  return p ? (
                    <>
                      <Avatar who={p} size={36} ring="rgba(255,180,0,0.6)" />
                      <span className="th tiny" style={{ fontWeight: 700, color: 'var(--warning)' }}>
                        ⚠️ ไม่สามารถปกป้อง {p.name} อีกครั้งคืนนี้
                      </span>
                    </>
                  ) : null;
                })()}
              </div>
            </>
          )}

          {/* Villager — motivational hint */}
          {role === 'villager' && (
            <span className="tiny" style={{ display: 'block', marginTop: 6, color: 'var(--muted)', fontWeight: 700 }}>
              💡 สังเกตพฤติกรรมผู้เล่น เชื่อผู้พยากรณ์ถ้าหาตัวได้ และโหวตให้แน่ใจ
            </span>
          )}

          {/* Lover link — shown for any role that has been linked by Cupid */}
          {loverOf && (
            <>
              <div className="divider" style={{ margin: '10px 0' }} />
              <span className="eyebrow" style={{ color: 'var(--primary)' }}>คู่รัก 💘</span>
              <div className="row gap10" style={{ marginTop: 8, alignItems: 'center' }}>
                {(() => {
                  const p = byId(loverOf);
                  return p ? (
                    <>
                      <Avatar who={p} size={36} ring="rgba(255,120,180,0.7)" />
                      <span className="th tiny" style={{ fontWeight: 700, color: 'var(--primary)' }}>
                        {p.name} · ถ้าอีกฝ่ายตาย คุณจะตายตาม
                      </span>
                    </>
                  ) : null;
                })()}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
