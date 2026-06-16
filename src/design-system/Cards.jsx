// Cards — Card, PlayingCard, ResourceCard, GameCard
import { GameCard } from '../components/ui';

const cx = (...c) => c.filter(Boolean).join(' ');

// Card — the prototype's surface. variant: glass (.card) | solid (.card-solid).
export function Card({ children, variant = 'glass', padding = 16, onClick, className = '', style }) {
  return (
    <div
      className={cx(variant === 'solid' ? 'card-solid' : 'card', onClick && 'pressable', className)}
      onClick={onClick}
      style={{ padding, ...style }}
    >
      {children}
    </div>
  );
}

const RED_SUITS = new Set(['♥', '♦', '❤', '♡', '♢']);

// PlayingCard — generic suit/rank card for card games. Pass `suit` (symbol or
// emoji) + `rank`; or `face` for a custom centre (e.g. an action card emoji).
// `faceDown` shows the patterned back.
export function PlayingCard({ rank, suit, face, red, faceDown, big, onClick, ariaLabel, style }) {
  const isRed = red ?? (suit && RED_SUITS.has(suit));
  if (faceDown) {
    return (
      <div className={cx('ds-pcard', big && 'ds-pcard--lg', 'ds-pcard--down')} onClick={onClick} style={style} aria-label={ariaLabel || 'face-down card'}>
        <span className="ds-pcard-grain" />
      </div>
    );
  }
  const corner = (
    <span className="col" style={{ gap: 1, alignItems: 'center', lineHeight: 1 }}>
      {rank != null && <span className="ds-pcard-rank">{rank}</span>}
      {suit && <span className="ds-pcard-suit-sm">{suit}</span>}
    </span>
  );
  return (
    <div
      className={cx('ds-pcard', big && 'ds-pcard--lg', isRed && 'ds-pcard--red')}
      onClick={onClick}
      style={style}
      aria-label={ariaLabel || `${rank ?? ''} ${suit ?? ''}`.trim()}
    >
      {corner}
      <span className="ds-pcard-center">{face || suit}</span>
      <span className="ds-pcard-br">{corner}</span>
    </div>
  );
}

// ResourceCard — resource type + amount token for strategy/euro games.
export function ResourceCard({ icon, label, amount, onClick, className = '', style }) {
  return (
    <div className={cx('ds-rcard', onClick && 'pressable', className)} onClick={onClick} style={style}>
      <span className="ds-rcard-icon">{icon}</span>
      <span className="col" style={{ gap: 0 }}>
        {amount != null && <span className="ds-rcard-amt">{amount}</span>}
        {label && <span className="ds-rcard-label th">{label}</span>}
      </span>
    </div>
  );
}

export { GameCard };
