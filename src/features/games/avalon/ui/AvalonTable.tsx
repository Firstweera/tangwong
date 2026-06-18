import type { ReactNode } from 'react';
import { Avatar } from '@/components/ui';
import type { Player } from '@/types';

export interface AvalonTableProps {
  players: Player[];
  leaderId: string;
  meId: string;
  /** Highlighted (selected / on-team) player ids. */
  selectedIds?: string[];
  /** Faded player ids (e.g. not on the active mission). */
  dimIds?: string[];
  /** Optional badge rendered on a seat (vote chip, team check, …). */
  badge?: (playerId: string) => ReactNode;
  /** Tap a seat (team selection, assassin target). */
  onSeatTap?: (playerId: string) => void;
  /** Centre content (phase status). */
  center?: ReactNode;
}

/**
 * AvalonTable — the ตั้งวง round table: players seated around a ring with the
 * leader crown, selection ring, per-seat badges, and a centre slot. Reused
 * across every Avalon phase.
 */
export function AvalonTable({
  players, leaderId, meId, selectedIds = [], dimIds = [], badge, onSeatTap, center,
}: AvalonTableProps) {
  const n = players.length;
  return (
    <div className="ring-stage" style={{ flex: 1, minHeight: 0 }}>
      <div style={{ position: 'absolute', top: '50%', left: '50%', width: '74%', paddingBottom: '74%', transform: 'translate(-50%,-50%)', borderRadius: '50%', border: '1.5px dashed var(--border-2)' }} />
      <div style={{ position: 'absolute', top: '50%', left: '50%', width: 150, height: 150, transform: 'translate(-50%,-50%)', borderRadius: '50%', background: 'var(--grad-soft)', filter: 'blur(8px)' }} />
      {center && <div className="ring-center col center" style={{ width: 160 }}>{center}</div>}
      {players.map((p, i) => {
        const ang = (-90 + (i * 360) / n) * Math.PI / 180;
        const x = 50 + 38 * Math.cos(ang);
        const y = 50 + 39 * Math.sin(ang);
        const selected = selectedIds.includes(p.id);
        const dim = dimIds.includes(p.id);
        const me = p.id === meId;
        return (
          <div key={p.id} className="ring-seat" style={{ left: `${x}%`, top: `${y}%`, opacity: dim ? 0.4 : 1 }}>
            <div style={{ position: 'relative' }} onClick={() => onSeatTap?.(p.id)}>
              <Avatar
                who={p}
                size={me ? 58 : 52}
                crown={p.id === leaderId}
                ring={selected ? 'var(--accent)' : false}
                style={{ cursor: onSeatTap ? 'pointer' : 'default', transition: 'transform 0.2s', transform: selected ? 'scale(1.06)' : 'none' }}
              />
              {badge?.(p.id)}
            </div>
            <span className="ring-name th" style={{ color: me ? 'var(--primary)' : 'var(--text)', fontWeight: me ? 800 : 700 }}>
              {me ? 'คุณ' : p.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}
