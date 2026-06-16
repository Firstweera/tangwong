// Gaming — reusable, game-agnostic primitives.
// (No game-specific logic: roles/phases/votes are passed in as generic data.)
import { Avatar, Icon } from '../components/ui';
import { statusColor as STATUS } from './tokens.ts';

const cx = (...c) => c.filter(Boolean).join(' ');

// Generic default labels for the shared status vocabulary (override via prop).
const STATUS_LABEL = {
  online: 'ออนไลน์', ready: 'พร้อม', away: 'ไม่อยู่', busy: 'ไม่ว่าง',
  playing: 'กำลังเล่น', inRoom: 'อยู่ในห้อง', thinking: 'กำลังคิด', eliminated: 'ตกรอบ',
};

// PlayerAvatar — semantic wrapper over the prototype Avatar.
// Maps generic game roles to Avatar's visual affordances (ring/dot/crown/faded).
export function PlayerAvatar({ player, size = 44, status, host, ring, selected, onClick, style }) {
  const live = status === 'online' || status === 'ready' || status === 'playing' || status === 'inRoom';
  return (
    <Avatar
      who={player}
      size={size}
      ring={ring ?? (selected ? 'var(--primary)' : undefined)}
      dot={live || undefined}
      crown={host || undefined}
      faded={status === 'eliminated' || undefined}
      onClick={onClick}
      style={style}
    />
  );
}

// PlayerStatus — status pill (dot + label). `status` keys the colour + default label.
export function PlayerStatus({ status = 'online', label, className = '', style }) {
  return (
    <span className={cx('ds-pstatus', 'th', className)} style={style}>
      <span className="ds-pstatus-dot" style={{ background: STATUS[status] || 'var(--muted)' }} />
      {label ?? STATUS_LABEL[status] ?? status}
    </span>
  );
}

// VoteChip — a single vote token. value: 'yes' | 'no' | 'abstain' | custom string.
export function VoteChip({ value = 'yes', selected, onClick, label, size = 40, disabled, style }) {
  const variant = value === 'yes' || value === 'no' || value === 'abstain' ? value : null;
  const icon = value === 'yes' ? 'check' : value === 'no' ? 'x' : null;
  return (
    <button
      aria-label={label || value}
      aria-pressed={selected || undefined}
      disabled={disabled}
      onClick={onClick}
      className={cx('ds-vote', variant && `ds-vote--${variant}`, selected && 'ds-vote--selected')}
      style={{ width: size, height: size, opacity: disabled ? 0.45 : 1, ...style }}
    >
      {icon ? <Icon name={icon} size={Math.round(size * 0.5)} stroke={3} /> : (label ?? '–')}
    </button>
  );
}

// RoleBadge — hidden-role indicator. tone: good | evil | neutral. `hidden` masks it.
export function RoleBadge({ label, tone = 'neutral', icon, hidden, className = '', style }) {
  return (
    <span className={cx('ds-role', `ds-role--${tone}`, 'th', className)} style={style}>
      <Icon name={hidden ? 'lock' : icon || (tone === 'evil' ? 'sword' : tone === 'good' ? 'shield' : 'user')} size={15} />
      {hidden ? '???' : label}
    </span>
  );
}

// GamePhaseIndicator — horizontal stepper. phases: strings or { id, label }.
// current: matching id or index. Earlier phases render as "done".
export function GamePhaseIndicator({ phases, current, className = '', style }) {
  const items = phases.map((p, i) => (typeof p === 'object' ? p : { id: i, label: p }));
  const curIdx = typeof current === 'number' ? current : items.findIndex((p) => p.id === current);
  return (
    <div className={cx('ds-phase', className)} style={style}>
      {items.map((p, i) => (
        <div className="ds-phase-step" key={p.id}>
          {i > 0 && <span className="ds-phase-line" />}
          <span className={cx('ds-phase-dot', 'th', i < curIdx && 'done', i === curIdx && 'current')}>
            {i < curIdx ? <Icon name="check" size={13} stroke={3} /> : p.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// TurnIndicator — whose turn it is, with optional sub-label (e.g. time left).
export function TurnIndicator({ player, name, sub, active, className = '', style }) {
  return (
    <span className={cx('ds-turn', active && 'ds-turn--active', className)} style={style}>
      {player && <Avatar who={player} size={28} />}
      <span className="col" style={{ gap: 0 }}>
        <span className="ds-turn-label th">{name ?? player?.name}</span>
        {sub && <span className="ds-turn-sub th">{sub}</span>}
      </span>
    </span>
  );
}
