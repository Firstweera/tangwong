import { useState, useEffect } from 'react';
import { Sheet } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { RoomSettings, Player } from '@/types';
import { GAMES } from '@/data';

export interface CreateRoomSheetProps {
  open: boolean;
  onClose: () => void;
  onCreateRoom: (settings: RoomSettings) => void;
  player?: Player;
}

const DEFAULT_GAME_ID = 'avalon';

/** Inclusive integer range [min, max] as an array, e.g. (2, 6) → [2,3,4,5,6]. */
function rangeOptions(min: number, max: number): number[] {
  return Array.from({ length: max - min + 1 }, (_, i) => min + i);
}

export function CreateRoomSheet({ open, onClose, onCreateRoom, player }: CreateRoomSheetProps) {
  const defaultName = `ห้องของ${player?.name ?? 'คุณ'}`;
  const [name, setName] = useState(defaultName);

  // Reset name default when sheet opens fresh (e.g. after nickname change)
  useEffect(() => {
    if (open) setName(defaultName);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const [gameId, setGameId] = useState(DEFAULT_GAME_ID);
  const [isPublic, setIsPublic] = useState(true);

  // The selected game defines the valid player-count range. Room size options
  // and the default cap follow the game, not a fixed list.
  const game = GAMES.find(g => g.id === gameId) ?? GAMES[0];
  const playerOptions = rangeOptions(game.minPlayers, game.maxPlayers);
  const [maxPlayers, setMaxPlayers] = useState(game.maxPlayers);

  // When the game changes, snap the room size back into its valid range
  // (default to the game's cap).
  useEffect(() => {
    setMaxPlayers(prev =>
      prev >= game.minPlayers && prev <= game.maxPlayers ? prev : game.maxPlayers,
    );
  }, [gameId, game.minPlayers, game.maxPlayers]);

  const handleCreate = () => {
    onCreateRoom({ name: name.trim() || defaultName, maxPlayers, isPublic, gameId });
  };

  return (
    <Sheet.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <Sheet.Content side="bottom" style={{ paddingBottom: 40 }}>
        <Sheet.Header style={{ paddingLeft: 16, paddingRight: 16, paddingTop: 8 }}>
          <Sheet.Title>สร้างห้อง</Sheet.Title>
          <Sheet.Close />
        </Sheet.Header>

        <div className="col gap16" style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingLeft: 16, paddingRight: 16 }}>
          {/* Room name */}
          <div className="col gap6" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label className="label" style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)' }}>
              ชื่อห้อง
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value.slice(0, 32))}
              placeholder={defaultName}
              className="th"
              style={{
                background: 'var(--surface-2)',
                border: '1.5px solid var(--border)',
                borderRadius: 14,
                padding: '13px 16px',
                fontSize: 15,
                fontWeight: 700,
                color: 'var(--text)',
                outline: 'none',
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Max players */}
          <div className="col gap6" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label className="label" style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', display: 'flex', justifyContent: 'space-between' }}>
              <span>จำนวนผู้เล่นสูงสุด</span>
              <span style={{ fontWeight: 700, color: 'var(--muted)' }}>{game.name} · {game.players} คน</span>
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {playerOptions.map(n => (
                <button
                  key={n}
                  onClick={() => setMaxPlayers(n)}
                  className={cn('chip', maxPlayers === n && 'chip-active')}
                  style={maxPlayers === n
                    ? { background: 'var(--primary)', color: '#fff', border: 'none', fontWeight: 800 }
                    : { fontWeight: 700 }
                  }
                >
                  {n} คน
                </button>
              ))}
            </div>
          </div>

          {/* Game */}
          <div className="col gap6" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label className="label" style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)' }}>
              เกม
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {GAMES.map(g => (
                <button
                  key={g.id}
                  onClick={() => g.available && setGameId(g.id)}
                  disabled={!g.available}
                  className="chip"
                  title={g.available ? undefined : 'เร็วๆ นี้'}
                  style={!g.available
                    ? { fontWeight: 700, opacity: 0.45, cursor: 'not-allowed' }
                    : gameId === g.id
                      ? { background: 'var(--primary)', color: '#fff', border: 'none', fontWeight: 800 }
                      : { fontWeight: 700 }
                  }
                >
                  {g.emoji} {g.name}{!g.available && ' 🔒'}
                </button>
              ))}
            </div>
          </div>

          {/* Public / Private */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span className="th" style={{ fontSize: 14, fontWeight: 700 }}>ห้องสาธารณะ</span>
              <span className="tiny" style={{ color: 'var(--muted)' }}>
                {isPublic ? 'ใครก็สามารถค้นหาและเข้าร่วมได้' : 'เข้าร่วมได้ด้วยรหัสเท่านั้น'}
              </span>
            </div>
            <Toggle value={isPublic} onChange={setIsPublic} />
          </div>
        </div>

        <Sheet.Footer style={{ marginTop: 28, paddingLeft: 16, paddingRight: 16 }}>
          <button className="btn btn-primary btn-lg" style={{ flex: 1, position: 'relative' }} onClick={handleCreate}>
            <span className="sheen" />
            สร้างห้อง
          </button>
        </Sheet.Footer>
      </Sheet.Content>
    </Sheet.Root>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      style={{
        width: 50,
        height: 28,
        borderRadius: 14,
        border: 'none',
        cursor: 'pointer',
        background: value ? 'var(--primary)' : 'var(--border-2)',
        position: 'relative',
        flexShrink: 0,
        transition: 'background 0.2s',
      }}
    >
      <span style={{
        position: 'absolute',
        top: 3,
        left: value ? 25 : 3,
        width: 22,
        height: 22,
        borderRadius: 11,
        background: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
        transition: 'left 0.2s',
      }} />
    </button>
  );
}
