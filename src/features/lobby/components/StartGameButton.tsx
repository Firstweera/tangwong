import type { CSSProperties } from 'react';
import { Icon } from '@/components/ui';

export interface StartGameButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  label?: string;
  style?: CSSProperties;
}

/**
 * StartGameButton — primary CTA that launches the match. Host-facing; the
 * actual start handshake is wired by the game engine later.
 */
export function StartGameButton({ onClick, disabled, label = 'เริ่มเกม', style }: StartGameButtonProps) {
  return (
    <button className="btn btn-primary" style={style} onClick={onClick} disabled={disabled}>
      <span className="sheen" />
      <span className="th" style={{ fontWeight: 800 }}>{label}</span>
      <Icon name="arrowR" size={20} stroke={2.6} />
    </button>
  );
}
