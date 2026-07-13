// WerewolfTable — ตั้งวง ring adapted for Werewolf's day/night cycle.
//
// Day:   normal ambient ring, vote-tally badges, lynched target highlighted.
// Night: deep moon overlay, submitted-actor ✓ badge, private target ring.
// Dead:  ghost-opacity seats with role-reveal or skull badge; non-interactive.
import type { ReactNode } from 'react';
import { Avatar } from '@/components/ui';
import type { Player } from '@/types';
import type { WerewolfPublic, WerewolfPrivate, WerewolfRole } from '../types.ts';

// Role emoji for death reveals
const ROLE_EM: Record<WerewolfRole, string> = {
  werewolf:    '🐺',
  seer:        '👁️',
  doctor:      '💊',
  villager:    '🏡',
  cupid:       '💘',
  spellcaster: '🤫',
};

export interface WerewolfTableProps {
  players: Player[];
  meId: string;

  // Public state
  eliminatedPlayers: string[];
  revealedRoles: Record<string, WerewolfRole>;
  nightActors: string[];
  votes: Record<string, string | null>;

  // Private state (only set when this player's private data is available)
  seerHistory: WerewolfPrivate['seerHistory'];
  wolfSees: string[];
  myRole: WerewolfRole | null;
  doctorLastProtected: string | null;

  phase: string;
  // Local selection state (for the acting player's current pick)
  nightTarget: string | null;
  cupidSecond?: string | null;
  voteTarget: string | null;
  /** Seats that can perform the current phase action. Others remain readable but inert. */
  selectablePlayerIds?: string[];

  onSeatTap?: (playerId: string) => void;
  center?: ReactNode;
}

export function WerewolfTable({
  players, meId, eliminatedPlayers, revealedRoles, nightActors, votes,
  seerHistory, wolfSees, myRole, doctorLastProtected,
  phase, nightTarget, voteTarget, onSeatTap, center,
  cupidSecond = null, selectablePlayerIds = [],
}: WerewolfTableProps) {
  const n = players.length;
  const isNight = phase === 'night' || phase === 'roleReveal';
  const isDawn = phase === 'dawn';
  const isDayVote = phase === 'dayVote' || phase === 'resolve';

  // Glow color changes with day/night
  const glowStyle: React.CSSProperties = isNight
    ? { background: 'radial-gradient(circle, rgba(60,20,140,0.45), rgba(10,5,60,0.12))', filter: 'blur(10px)' }
    : isDawn
    ? { background: 'radial-gradient(circle, rgba(255,180,40,0.30), rgba(255,120,0,0.08))', filter: 'blur(10px)' }
    : { background: 'var(--grad-soft)', filter: 'blur(8px)' };

  // Seat badge for each player
  function badge(p: Player): ReactNode {
    const id = p.id;
    const dead = eliminatedPlayers.includes(id);

    if (dead) {
      return (
        <span className="seat-token" style={{
          background: 'var(--surface-3)',
          fontSize: 12, border: '2px solid var(--surface-solid)',
        }}>
          💀
        </span>
      );
    }

    // Night: show ✓ only on own seat (hiding who else has acted prevents role deduction)
    if (phase === 'night' && id === meId && nightActors.includes(id)) {
      return (
        <span className="seat-token" style={{ background: 'var(--success)', color: '#fff', fontSize: 13 }}>✓</span>
      );
    }

    // Private seer knowledge dot
    if (myRole === 'seer') {
      const inspection = seerHistory.find(h => h.playerId === id);
      if (inspection) {
        return (
          <span className="seat-token" style={{
            background: inspection.result === 'evil' ? 'var(--evil)' : 'var(--success)',
            fontSize: 10,
          }}>
            {inspection.result === 'evil' ? '🐺' : '✓'}
          </span>
        );
      }
    }

    // Day vote tally badge
    if (isDayVote) {
      const count = Object.values(votes).filter(v => v === id).length;
      if (count > 0) {
        return (
          <span className="seat-token" style={{
            background: 'var(--evil)', color: '#fff',
            fontWeight: 800, fontSize: 12,
            minWidth: 22,
          }}>
            {count}
          </span>
        );
      }
    }

    return null;
  }

  return (
    <div className="ring-stage" style={{ flex: 1, minHeight: 0 }}>
      {/* Dashed guide ring */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        width: '74%', paddingBottom: '74%',
        transform: 'translate(-50%,-50%)',
        borderRadius: '50%',
        border: `1.5px dashed ${isNight ? 'rgba(100,60,200,0.35)' : 'var(--border-2)'}`,
        transition: 'border-color 0.6s',
      }} />

      {/* Centre glow */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        width: 150, height: 150,
        transform: 'translate(-50%,-50%)',
        borderRadius: '50%',
        transition: 'background 0.7s, filter 0.7s',
        ...glowStyle,
      }} />

      {/* Night mood overlay — dim the ring area without affecting avatars */}
      {isNight && (
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 50% 40%, transparent 30%, rgba(10,5,40,0.22) 100%)',
          pointerEvents: 'none',
        }} />
      )}

      {center && (
        <div className="ring-center col center" style={{ width: 166 }}>
          {center}
        </div>
      )}

      {players.map((p, i) => {
        const ang = (-90 + (i * 360) / n) * (Math.PI / 180);
        const x = 50 + 38 * Math.cos(ang);
        const y = 50 + 39 * Math.sin(ang);
        const dead = eliminatedPlayers.includes(p.id);
        const me = p.id === meId;

        // Determine avatar ring color
        let ring: string | false = false;
        if (!dead) {
          if (voteTarget === p.id && isDayVote) {
            ring = 'var(--evil)';
          } else if ((nightTarget === p.id || cupidSecond === p.id) && phase === 'night') {
            ring = 'var(--primary)';
          } else if (wolfSees.includes(p.id) && myRole === 'werewolf') {
            // Private: fellow wolf — subtle evil ring
            ring = 'rgba(255,92,108,0.55)';
          } else if (doctorLastProtected === p.id && myRole === 'doctor') {
            // Private: cannot protect again tonight
            ring = 'rgba(255,180,0,0.45)';
          }
        }

        const selectionOrder = nightTarget === p.id ? 1 : cupidSecond === p.id ? 2 : null;
        const isSelected = voteTarget === p.id || selectionOrder !== null;
        const tappable = !dead && !!onSeatTap && selectablePlayerIds.includes(p.id);
        const seatContent = (
          <>
            <Avatar
              who={p}
              size={me ? 58 : 52}
              ring={ring}
              style={{
                cursor: tappable ? 'pointer' : 'default',
                transition: 'transform 0.18s var(--ease-out)',
                transform: isSelected ? 'scale(1.07)' : 'none',
              }}
            />
            {badge(p)}
            {isSelected && (
              <span className="seat-selection-token" aria-hidden="true">
                {myRole === 'cupid' && phase === 'night' ? selectionOrder : '✓'}
              </span>
            )}
          </>
        );

        return (
          <div
            key={p.id}
            className="ring-seat"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              opacity: dead ? 0.28 : 1,
              transition: 'opacity 0.45s var(--ease-out)',
              pointerEvents: dead ? 'none' : undefined,
            }}
          >
            {tappable ? (
              <button
                type="button"
                className="werewolf-seat-button"
                aria-label={`${isSelected ? 'ยกเลิกการเลือก' : 'เลือก'} ${me ? 'ตัวคุณ' : p.name}`}
                aria-pressed={isSelected}
                onClick={() => onSeatTap?.(p.id)}
              >
                {seatContent}
              </button>
            ) : (
              <div className="werewolf-seat-button" aria-hidden="true">{seatContent}</div>
            )}
            <span
              className="ring-name th"
              style={{
                color: dead ? 'var(--faint)' : me ? 'var(--primary)' : 'var(--text)',
                fontWeight: me ? 800 : 700,
                textDecoration: dead ? 'line-through' : 'none',
              }}
            >
              {me ? 'คุณ' : p.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}
