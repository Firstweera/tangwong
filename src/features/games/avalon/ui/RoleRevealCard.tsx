import { Avatar, Icon } from '@/components/ui';
import { ROLES } from '@/data';
import type { Player } from '@/types';
import type { AvalonPrivate } from '../types';

export interface RoleRevealCardProps {
  me: AvalonPrivate;
  players: Player[];
  open: boolean;
  onToggle: () => void;
}

function visionLabel(role: AvalonPrivate['role']): string | null {
  switch (role) {
    case 'merlin': return 'คุณเห็นว่าเป็นฝ่ายชั่ว 👁️';
    case 'percival': return 'คุณเห็นว่าเป็นเมอร์ลิน หรือ มอร์กานา 🔮';
    case 'morgana': case 'assassin': case 'mordred': case 'minion': return 'พวกพ้องฝ่ายชั่วของคุณ 😈';
    default: return null; // loyal servant — no info
  }
}

/**
 * RoleRevealCard — the secret role strip: tap to reveal your role, side,
 * description, and the players your role can see (with role-specific framing).
 */
export function RoleRevealCard({ me, players, open, onToggle }: RoleRevealCardProps) {
  const role = ROLES[me.role];
  const good = me.side === 'good';
  const sideColor = good ? 'var(--good)' : 'var(--evil)';
  const label = visionLabel(me.role);
  const byId = (id: string) => players.find(p => p.id === id);

  return (
    <div className="pad-x" style={{ marginBottom: 8 }}>
      <button
        className="role-card row between"
        style={{ width: '100%', padding: 12, background: open ? 'var(--grad-soft)' : 'var(--surface)', backdropFilter: 'blur(18px)' }}
        onClick={onToggle}
      >
        <div className="row gap12">
          <div className="row center" style={{ width: 40, height: 40, borderRadius: 12, background: open ? sideColor : 'var(--surface-2)', fontSize: 20 }}>
            {open ? role.em : '🎴'}
          </div>
          <div className="col" style={{ gap: 1, textAlign: 'left' }}>
            <span className="th h3">
              {open ? <>{role.th} · <span style={{ color: sideColor }}>{good ? 'ฝ่ายดี' : 'ฝ่ายชั่ว'}</span></> : 'บทบาทของคุณ'}
            </span>
            <span className="tiny">{open ? 'แตะเพื่อซ่อน' : 'แตะเพื่อดู (เป็นความลับ)'}</span>
          </div>
        </div>
        <Icon name={open ? 'eye' : 'lock'} size={18} style={{ color: 'var(--muted)' }} />
      </button>

      {open && (
        <div className="card rise" style={{ padding: 14, marginTop: 8 }}>
          <p className="th body" style={{ fontSize: 13, color: 'var(--text)' }}>{role.desc}</p>
          {label && me.sees.length > 0 && (
            <>
              <div className="divider" style={{ margin: '12px 0' }} />
              <span className="eyebrow">{label}</span>
              <div className="row gap14" style={{ marginTop: 10, flexWrap: 'wrap' }}>
                {me.sees.map(s => {
                  const p = byId(s.playerId);
                  if (!p) return null;
                  return (
                    <div key={s.playerId} className="col center gap6">
                      <Avatar who={p} size={44} ring={s.appearsAs === 'evil' ? 'var(--evil)' : 'var(--accent)'} />
                      <span className="th tiny" style={{ fontWeight: 700 }}>{p.name}</span>
                    </div>
                  );
                })}
              </div>
              {me.role === 'merlin' && (
                <span className="tiny" style={{ display: 'block', marginTop: 10, color: 'var(--evil)', fontWeight: 700 }}>
                  ⚠️ ระวัง! มอร์เดร็ดซ่อนตัวอยู่ — คุณมองไม่เห็นเขา
                </span>
              )}
            </>
          )}
          {!label && (
            <span className="tiny" style={{ display: 'block', marginTop: 10, color: 'var(--muted)', fontWeight: 700 }}>
              คุณไม่มีข้อมูลพิเศษ — ใช้การพูดคุยและโหวตอย่างชาญฉลาด
            </span>
          )}
        </div>
      )}
    </div>
  );
}
