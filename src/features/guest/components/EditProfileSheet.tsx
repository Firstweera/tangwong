import { useState, useEffect } from 'react';
import { Sheet } from '@/components/ui/sheet';
import { MASCOTS } from '@/data';
import type { GuestProfile } from '../types';
import type { MascotKey } from '@/types';

export interface EditProfileSheetProps {
  open: boolean;
  onClose: () => void;
  guest: GuestProfile;
  onSave: (updates: Partial<Omit<GuestProfile, 'playerId'>>) => void;
}

const MASCOT_KEYS = Object.keys(MASCOTS) as MascotKey[];

export function EditProfileSheet({ open, onClose, guest, onSave }: EditProfileSheetProps) {
  const [nickname, setNickname] = useState(guest.nickname);
  const [mascot, setMascot] = useState<MascotKey>(guest.mascot);

  // Sync when sheet re-opens with fresh guest data
  useEffect(() => {
    if (open) {
      setNickname(guest.nickname);
      setMascot(guest.mascot);
    }
  }, [open, guest.nickname, guest.mascot]);

  const handleSave = () => {
    onSave({
      nickname: nickname.trim() || guest.nickname,
      mascot,
    });
    onClose();
  };

  return (
    <Sheet.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <Sheet.Content side="bottom" style={{ paddingBottom: 40 }}>
        <Sheet.Header style={{ paddingLeft: 16, paddingRight: 16, paddingTop: 8 }}>
          <Sheet.Title>แก้ไขโปรไฟล์</Sheet.Title>
          <Sheet.Close />
        </Sheet.Header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingLeft: 16, paddingRight: 16 }}>
          {/* Avatar preview */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 4 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 38,
              background: `linear-gradient(135deg, ${MASCOTS[mascot].g[0]}, ${MASCOTS[mascot].g[1]})`,
              boxShadow: '0 8px 24px -6px rgba(0,0,0,0.4)',
            }}>
              {MASCOTS[mascot].em}
            </div>
          </div>

          {/* Nickname */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)' }}>ชื่อเล่น</label>
            <input
              value={nickname}
              onChange={e => setNickname(e.target.value.slice(0, 20))}
              placeholder={guest.nickname}
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

          {/* Mascot picker */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)' }}>อวตาร</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
              {MASCOT_KEYS.map(key => {
                const m = MASCOTS[key];
                const selected = mascot === key;
                return (
                  <button
                    key={key}
                    onClick={() => setMascot(key)}
                    style={{
                      width: '100%',
                      aspectRatio: '1',
                      borderRadius: 14,
                      border: selected ? '2.5px solid var(--primary)' : '2px solid transparent',
                      background: selected
                        ? `linear-gradient(135deg, ${m.g[0]}, ${m.g[1]})`
                        : `linear-gradient(135deg, ${m.g[0]}55, ${m.g[1]}33)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 22,
                      cursor: 'pointer',
                      boxShadow: selected ? `0 4px 14px -4px ${m.g[0]}88` : 'none',
                      transition: 'transform 0.15s, box-shadow 0.15s',
                      transform: selected ? 'scale(1.08)' : 'scale(1)',
                    }}
                    aria-label={key}
                    aria-pressed={selected}
                  >
                    {m.em}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <Sheet.Footer style={{ marginTop: 28, paddingLeft: 16, paddingRight: 16 }}>
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
