// SeatSwitcher — devtools overlay for offline matches: view and play the same
// match from any seat (boardgame.io Debug-panel idea). Used to test hidden-
// information UI on one device. Never rendered for online games.
//
// Shown when `isSeatSwitcherEnabled()` — Vite dev server, or `?devtools` in the URL.
import { useState } from 'react';
import { Avatar } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { Player } from '@/types';
import type { LocalSeat } from '@/features/games/useLocalGameClient';

export function isSeatSwitcherEnabled(): boolean {
  if (import.meta.env.DEV) return true;
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).has('devtools');
}

export interface SeatSwitcherProps {
  seats: LocalSeat[];
  players: Player[];
  /** The real local player — marked "คุณ" so it's easy to switch back. */
  homeSeatId: string;
  onSelect: (playerId: string) => void;
}

export function SeatSwitcher({ seats, players, homeSeatId, onSelect }: SeatSwitcherProps) {
  const [open, setOpen] = useState(false);
  if (seats.length === 0) return null;

  const byId = (id: string) => players.find(p => p.id === id);
  const viewing = seats.find(s => s.viewing);
  const viewingPlayer = viewing ? byId(viewing.id) : undefined;
  const pending = seats.filter(s => s.needsAction).length;

  return (
    <div
      className="fixed left-2 z-[60] flex items-start gap-2"
      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 33%)' }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-label={`สลับที่นั่ง (ตอนนี้ดูในมุม ${viewingPlayer?.name ?? viewing?.id ?? ''})`}
        onClick={() => setOpen(o => !o)}
        className={cn(
          'relative flex h-12 w-12 items-center justify-center rounded-full border border-line-2 bg-elev shadow-lg backdrop-blur-md',
          open && 'border-primary',
        )}
      >
        {viewingPlayer ? <Avatar who={viewingPlayer} size={34} /> : <span className="text-lg">👁</span>}
        <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1.5 text-[10px] font-extrabold leading-4 text-white">
          👁
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="สลับมุมมองที่นั่ง"
          className="w-[min(78vw,320px)] rounded-card border border-line-2 bg-elev p-3 text-ink shadow-xl backdrop-blur-md"
        >
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <span className="th text-[13px] font-extrabold">สลับมุมมองที่นั่ง</span>
            <span className="th text-[11px] font-bold text-muted">devtools · รอเล่น {pending}</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {seats.map(seat => {
              const p = byId(seat.id);
              return (
                <button
                  key={seat.id}
                  type="button"
                  onClick={() => { onSelect(seat.id); setOpen(false); }}
                  aria-pressed={seat.viewing}
                  className={cn(
                    'relative flex min-h-[64px] flex-col items-center gap-1 rounded-2xl border border-transparent bg-surface-2 px-1 py-2',
                    seat.viewing && 'border-primary bg-surface-3',
                  )}
                >
                  {p ? <Avatar who={p} size={32} faded={!seat.viewing && !seat.needsAction} /> : <span>❔</span>}
                  <span className="th w-full truncate text-center text-[10.5px] font-bold">
                    {seat.id === homeSeatId ? 'คุณ' : (p?.name ?? seat.id)}
                  </span>
                  {seat.needsAction && (
                    <span
                      className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-accent"
                      title="ที่นั่งนี้ต้องเล่นตอนนี้"
                    />
                  )}
                  {seat.viewing && seat.auto && (
                    <span className="absolute left-1 top-0.5 text-[10px]" title="ออโต้">🤖</span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="th mt-2 text-[10.5px] font-semibold leading-snug text-muted">
            ที่นั่งที่กำลังดูเล่นด้วยมือ ที่เหลือบอทเล่นแทน · จุดส้ม = ต้องเล่นตอนนี้
          </p>
        </div>
      )}
    </div>
  );
}
