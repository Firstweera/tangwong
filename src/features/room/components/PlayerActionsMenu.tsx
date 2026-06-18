import { DropdownMenu } from '@/components/ui/dropdown-menu';

export interface PlayerActionsMenuProps {
  /** Target player's display name (for the accessible label). */
  playerName: string;
  onTransferHost: () => void;
  onKick: () => void;
  /** Bots can't host — transfer is hidden and the kick label changes. */
  isBot?: boolean;
}

/**
 * PlayerActionsMenu — host-only dropdown of moderation actions for another
 * player in the lobby: transfer host or remove from room. Composed from the
 * generic DropdownMenu primitive.
 */
export function PlayerActionsMenu({ playerName, onTransferHost, onKick, isBot }: PlayerActionsMenuProps) {
  const items = isBot
    ? [{ label: 'นำบอทออก', emoji: '🗑️', onClick: onKick, danger: true }]
    : [
        { label: 'โอนสิทธิ์เจ้าของห้อง', emoji: '👑', onClick: onTransferHost },
        { label: 'นำออกจากห้อง', emoji: '🚫', onClick: onKick, danger: true },
      ];
  return <DropdownMenu ariaLabel={`จัดการ ${playerName}`} items={items} />;
}
