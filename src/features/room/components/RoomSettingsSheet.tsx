import { useState, useEffect } from 'react';
import { Sheet } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { Room, RoomSettings } from '@/types';
import { GAMES } from '@/data';

export interface RoomSettingsSheetProps {
  open: boolean;
  onClose: () => void;
  room: Room;
  onSave: (settings: RoomSettings) => void;
}

const MAX_PLAYER_OPTIONS = [5, 6, 7, 8, 9, 10];

export function RoomSettingsSheet({ open, onClose, room, onSave }: RoomSettingsSheetProps) {
  const [name, setName] = useState(room.name);
  const [maxPlayers, setMaxPlayers] = useState(room.maxPlayers);
  const [isPublic, setIsPublic] = useState(room.isPublic);
  const [gameId, setGameId] = useState(room.gameId);

  // Sync form when room prop changes (e.g. room loaded from store)
  useEffect(() => {
    setName(room.name);
    setMaxPlayers(room.maxPlayers);
    setIsPublic(room.isPublic);
    setGameId(room.gameId);
  }, [room.id]);

  const handleSave = () => {
    onSave({ name: name.trim() || room.name, maxPlayers, isPublic, gameId });
    onClose();
  };

  return (
    <Sheet.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <Sheet.Content side="bottom" style={{ paddingBottom: 40 }}>
        <Sheet.Header style={{ paddingLeft: 16, paddingRight: 16, paddingTop: 8 }}>
          <Sheet.Title>ตั้งค่าห้อง</Sheet.Title>
          <Sheet.Close />
        </Sheet.Header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingLeft: 16, paddingRight: 16 }}>
          {/* Room name */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label className="label" style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)' }}>
              ชื่อห้อง
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value.slice(0, 32))}
              placeholder={room.name}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label className="label" style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)' }}>
              จำนวนผู้เล่นสูงสุด
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {MAX_PLAYER_OPTIONS.map(n => (
                <button
                  key={n}
                  onClick={() => setMaxPlayers(n)}
                  className="chip"
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label className="label" style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)' }}>
              เกม
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {GAMES.map(g => (
                <button
                  key={g.id}
                  onClick={() => setGameId(g.id)}
                  className="chip"
                  style={gameId === g.id
                    ? { background: 'var(--primary)', color: '#fff', border: 'none', fontWeight: 800 }
                    : { fontWeight: 700 }
                  }
                >
                  {g.emoji} {g.name}
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

        <Sheet.Footer style={{ marginTop: 28, gap: 10, paddingLeft: 16, paddingRight: 16 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>ยกเลิก</button>
          <button className="btn btn-primary" style={{ flex: 2, position: 'relative' }} onClick={handleSave}>
            <span className="sheen" />
            บันทึก
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
