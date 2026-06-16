import type { ReactNode } from 'react';
import { Badge, type BadgeTone } from '@/components/ui/badge';

export interface PlayerBadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  variant?: 'solid' | 'soft' | 'outline';
  icon?: ReactNode;
}

/**
 * PlayerBadge — small labelled badge describing a player attribute (team, tag,
 * status). Thin semantic wrapper over the design-system Badge so games share
 * one badge style. See HostBadge for a preset.
 */
export function PlayerBadge({ children, tone = 'neutral', variant = 'soft', icon }: PlayerBadgeProps) {
  return <Badge tone={tone} variant={variant} icon={icon}>{children}</Badge>;
}
