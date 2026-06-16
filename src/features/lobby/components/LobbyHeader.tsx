import { Icon } from '@/components/ui';
import { Header, IconButton } from '@/components/layout';

export interface LobbyHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onSettings?: () => void;
}

/**
 * LobbyHeader — room title bar: back · title/subtitle · settings.
 * Wraps the shared layout Header so every lobby/room screen is consistent.
 */
export function LobbyHeader({ title, subtitle, onBack, onSettings }: LobbyHeaderProps) {
  return (
    <Header
      left={onBack ? <IconButton onClick={onBack}><Icon name="chevL" size={20} /></IconButton> : undefined}
      title={title}
      subtitle={subtitle}
      right={onSettings ? <IconButton onClick={onSettings}><Icon name="settings" size={19} /></IconButton> : undefined}
    />
  );
}
