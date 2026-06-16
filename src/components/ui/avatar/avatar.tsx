import { Children, cloneElement, isValidElement, type CSSProperties, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { MASCOTS } from '@/data';
import type { MascotKey } from '@/types';

export type Presence = 'online' | 'away' | 'busy' | 'offline';

const PRESENCE_COLOR: Record<Presence, string> = {
  online: '#34D17E',
  away: 'var(--muted)',
  busy: 'var(--accent)',
  offline: 'var(--faint)',
};

function initials(name?: string): string {
  if (!name) return '';
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

export interface AvatarProps {
  /** Image URL — takes priority over mascot/initials. */
  src?: string;
  /** Used for alt text and the initials fallback. */
  name?: string;
  /** Animal-mascot key (emoji disc), the prototype's default avatar style. */
  mascot?: MascotKey;
  size?: number;
  /** Presence dot. */
  status?: Presence;
  /** Highlight ring — `true` uses the brand secondary, or pass a colour. */
  ring?: boolean | string;
  faded?: boolean;
  /** Corner badge (e.g. a host crown). */
  badge?: ReactNode;
  onClick?: () => void;
  className?: string;
  style?: CSSProperties;
}

function AvatarRoot({ src, name, mascot, size = 44, status, ring, faded, badge, onClick, className, style }: AvatarProps) {
  const m = mascot ? MASCOTS[mascot] : undefined;
  const ringColor = ring === true ? 'var(--secondary)' : ring || undefined;
  const interactive = !!onClick;

  return (
    <div
      role={src ? 'img' : undefined}
      aria-label={src ? name : undefined}
      onClick={onClick}
      onKeyDown={interactive ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } } : undefined}
      tabIndex={interactive ? 0 : undefined}
      className={cn('relative flex shrink-0 items-center justify-center rounded-full leading-none', interactive && 'cursor-pointer', className)}
      style={{
        width: size, height: size, fontSize: size * 0.5, fontWeight: 800,
        background: m ? `linear-gradient(140deg, ${m.g[0]}, ${m.g[1]})` : 'var(--surface-3)',
        color: '#fff',
        opacity: faded ? 0.4 : 1,
        boxShadow: ringColor
          ? `inset 0 0 0 1px rgba(255,255,255,0.18), 0 0 0 2.5px ${ringColor}, 0 0 12px -2px ${ringColor}`
          : 'inset 0 0 0 1px rgba(255,255,255,0.18)',
        ...style,
      }}
    >
      {src ? (
        <img src={src} alt={name ?? ''} className="h-full w-full rounded-full object-cover" />
      ) : m ? (
        <span style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.25))' }}>{m.em}</span>
      ) : (
        <span className="font-thai">{initials(name)}</span>
      )}

      {status && <AvatarStatus status={status} size={size} />}
      {badge && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-sm" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))' }}>{badge}</span>}
    </div>
  );
}

/* ─────────────────────────── Avatar.Status ─────────────────────────── */

export interface AvatarStatusProps {
  status: Presence;
  /** Parent avatar size, used to scale the dot. */
  size?: number;
  className?: string;
}

function AvatarStatus({ status, size = 44, className }: AvatarStatusProps) {
  const d = Math.max(9, size * 0.28);
  return (
    <span
      aria-label={status}
      className={cn('absolute bottom-0 right-0 rounded-full', className)}
      style={{ width: d, height: d, background: PRESENCE_COLOR[status], boxShadow: '0 0 0 2.5px var(--surface-solid)' }}
    />
  );
}

/* ─────────────────────────── Avatar.Group ─────────────────────────── */

export interface AvatarGroupProps {
  children: ReactNode;
  /** Max avatars shown before collapsing to “+N”. */
  max?: number;
  size?: number;
  className?: string;
}

function AvatarGroup({ children, max = 4, size = 30, className }: AvatarGroupProps) {
  const all = Children.toArray(children).filter(isValidElement);
  const shown = all.slice(0, max);
  const extra = all.length - shown.length;
  const overlap = -size * 0.32;

  return (
    <div className={cn('flex', className)} style={{ paddingLeft: size * 0.32 }}>
      {shown.map((child, i) => (
        <div key={i} className="rounded-full" style={{ marginLeft: overlap, zIndex: 10 - i, boxShadow: '0 0 0 2.5px var(--surface-solid)' }}>
          {cloneElement(child as React.ReactElement<AvatarProps>, { size })}
        </div>
      ))}
      {extra > 0 && (
        <div
          className="flex items-center justify-center rounded-full font-bold text-muted"
          style={{ marginLeft: overlap, width: size, height: size, background: 'var(--surface-3)', boxShadow: '0 0 0 2.5px var(--surface-solid)', fontSize: size * 0.34, zIndex: 1 }}
        >
          +{extra}
        </div>
      )}
    </div>
  );
}

export const Avatar = Object.assign(AvatarRoot, { Group: AvatarGroup, Status: AvatarStatus });
