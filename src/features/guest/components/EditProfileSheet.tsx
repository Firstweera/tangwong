import { useState, useEffect } from 'react';
import { Sheet } from '@/components/ui/sheet';
import { Icon } from '@/components/ui';
import { MASCOTS } from '@/data';
import type { GuestProfile } from '../types';
import type { MascotKey } from '@/types';

export interface EditProfileSheetProps {
  open: boolean;
  onClose: () => void;
  guest: GuestProfile;
  onSave: (updates: Partial<Omit<GuestProfile, 'playerId'>>) => void;
  /** Sign out + reset identity (returns to Welcome). */
  onLogout?: () => void;
  /** For the "coming soon" account-linking preview. */
  showToast?: (message: string, emoji?: string) => void;
}

const MASCOT_KEYS = Object.keys(MASCOTS) as MascotKey[];

// Provider brand glyphs (filled marks, not part of the stroke icon set).
const PROVIDERS: { key: 'google' | 'apple'; label: string; bg: string; fg: string; glyph: React.ReactNode }[] = [
  {
    key: 'google', label: 'Google', bg: '#fff', fg: '#1f1f1f',
    glyph: <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.5 12.2c0-.7-.06-1.4-.18-2H12v3.9h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2-1.9 3.3-4.7 3.3-7.9z" /><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .65-2.2 1-3.8 1-2.9 0-5.4-2-6.3-4.6H2v2.8A11 11 0 0 0 12 23z" /><path fill="#FBBC05" d="M5.7 14c-.23-.66-.36-1.37-.36-2.1s.13-1.43.36-2.1V7H2a11 11 0 0 0 0 9.9z" /><path fill="#EA4335" d="M12 5.3c1.6 0 3 .56 4.2 1.65l3-3A11 11 0 0 0 2 7l3.7 2.8C6.6 7.2 9.1 5.3 12 5.3z" /></svg>,
  },
  {
    key: 'apple', label: 'Apple', bg: '#000', fg: '#fff',
    glyph: <svg width="17" height="17" viewBox="0 0 24 24"><path fill="#fff" d="M16.4 12.6c0-2.2 1.8-3.3 1.9-3.4-1-1.5-2.6-1.7-3.2-1.7-1.4-.14-2.7.8-3.3.8s-1.7-.8-2.9-.78c-1.5.02-2.9.87-3.6 2.2-1.6 2.7-.4 6.7 1.1 8.9.74 1.07 1.6 2.3 2.8 2.25 1.1-.04 1.5-.72 2.9-.72s1.7.72 2.9.7c1.2-.02 2-1.1 2.7-2.17.85-1.25 1.2-2.45 1.2-2.5-.03-.02-2.3-.9-2.3-3.6zM14.2 5.9c.6-.74 1-1.77.9-2.8-.86.03-1.9.57-2.5 1.3-.56.64-1 1.7-.9 2.7.96.07 1.94-.5 2.5-1.2z" /></svg>,
  },
];

/**
 * EditProfileSheet — "บัญชีของฉัน": edit nickname + mascot, preview the account
 * status, link a real account (previewed; lands in Epic 9), or sign out.
 */
export function EditProfileSheet({ open, onClose, guest, onSave, onLogout, showToast }: EditProfileSheetProps) {
  const [nickname, setNickname] = useState(guest.nickname);
  const [mascot, setMascot] = useState<MascotKey>(guest.mascot);

  // Sync when sheet re-opens with fresh guest data
  useEffect(() => {
    if (open) {
      setNickname(guest.nickname);
      setMascot(guest.mascot);
    }
  }, [open, guest.nickname, guest.mascot]);

  const m = MASCOTS[mascot];
  const previewName = nickname.trim() || 'ผู้เล่นใหม่';

  const handleSave = () => {
    onSave({ nickname: nickname.trim() || guest.nickname, mascot });
    onClose();
  };

  const handleLink = () => {
    showToast?.('การผูกบัญชีจะมาเร็วๆ นี้ — เล่นแบบ Guest ได้เลย', '🔜');
  };

  return (
    <Sheet.Root open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <Sheet.Content side="bottom" style={{ paddingBottom: 'calc(26px + env(safe-area-inset-bottom))', maxHeight: '92%' }}>
        <Sheet.Header style={{ paddingLeft: 16, paddingRight: 16, paddingTop: 8 }}>
          <Sheet.Title>บัญชีของฉัน</Sheet.Title>
          <Sheet.Close />
        </Sheet.Header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 22, paddingLeft: 16, paddingRight: 16 }}>
          {/* Live preview + account status */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, paddingTop: 2 }}>
            <div className="pop" key={mascot} style={{
              width: 84, height: 84, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 40,
              background: `linear-gradient(135deg, ${m.g[0]}, ${m.g[1]})`,
              boxShadow: '0 8px 24px -6px rgba(0,0,0,0.4)',
            }}>
              {m.em}
            </div>
            <span className="th h2" style={{ fontSize: 18 }}>{previewName}</span>
            <span className="tiny" style={{ fontWeight: 700, color: 'var(--accent)' }}>🎭 บัญชีผู้เยี่ยมชม</span>
          </div>

          {/* Nickname */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label className="eyebrow">ชื่อเล่น · nickname</label>
            <div className="card row" style={{ padding: '0 16px', height: 54, alignItems: 'center' }}>
              <input
                value={nickname}
                onChange={e => setNickname(e.target.value.slice(0, 16))}
                maxLength={16}
                placeholder="ตั้งชื่อเล่น"
                className="th"
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 16, fontWeight: 700 }}
              />
              <span className="tiny mono" style={{ opacity: 0.6 }}>{nickname.length}/16</span>
            </div>
          </div>

          {/* Mascot picker */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label className="eyebrow">มาสคอต · icon</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 9 }}>
              {MASCOT_KEYS.map(key => {
                const mk = MASCOTS[key];
                const selected = mascot === key;
                return (
                  <button
                    key={key}
                    onClick={() => setMascot(key)}
                    style={{
                      width: '100%', aspectRatio: '1', borderRadius: 14,
                      border: selected ? '2px solid var(--primary)' : '1px solid var(--border)',
                      background: selected ? 'var(--grad-soft)' : 'var(--surface-2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 22, cursor: 'pointer', position: 'relative',
                    }}
                    aria-label={key}
                    aria-pressed={selected}
                  >
                    {mk.em}
                    {selected && (
                      <span className="row center" style={{ position: 'absolute', top: -5, right: -5, width: 19, height: 19, borderRadius: '50%', background: 'var(--primary)', color: '#fff', border: '2px solid var(--surface-solid)' }}>
                        <Icon name="check" size={11} stroke={3.5} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Account linking (previewed) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <label className="eyebrow">บัญชี · account</label>
            <div className="row gap8" style={{ alignItems: 'flex-start', padding: '10px 13px', borderRadius: 13, background: 'rgba(255,159,67,0.12)', border: '1px solid rgba(255,159,67,0.28)' }}>
              <span style={{ fontSize: 15 }}>⚠️</span>
              <span className="th tiny" style={{ color: 'var(--accent)', fontWeight: 700, lineHeight: 1.45 }}>ผูกบัญชีเพื่อบันทึกความคืบหน้า สถิติ และเล่นข้ามอุปกรณ์ได้</span>
            </div>
            {PROVIDERS.map(p => (
              <button key={p.key} className="btn btn-lg btn-block" onClick={handleLink}
                style={{ background: p.bg, color: p.fg, border: p.key === 'google' ? '1px solid var(--border-2)' : 'none' }}>
                {p.glyph}<span className="th" style={{ fontWeight: 700 }}>ผูกกับ {p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="pad-x" style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 22, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-primary btn-lg btn-block" style={{ position: 'relative' }} onClick={handleSave}>
            <span className="sheen" />
            <span className="th" style={{ fontWeight: 800 }}>บันทึก</span>
          </button>
          {onLogout && (
            <button className="row center gap8" onClick={() => { onClose(); onLogout(); }}
              style={{ height: 44, color: 'var(--evil)', fontWeight: 700, background: 'none' }}>
              <Icon name="exit" size={18} /><span className="th">ออกจากระบบ</span>
            </button>
          )}
        </div>
      </Sheet.Content>
    </Sheet.Root>
  );
}
