import { Icon } from '@/components/ui';
import type { Game } from '@/types';
import { getGameRules } from '../rules';

export interface RulesSheetProps {
  game: Game;
  onClose: () => void;
  /** Optional "play this game" CTA. */
  onPlay?: (game: Game) => void;
}

/**
 * RulesSheet — slide-up rules for a game: objective, team composition, roles,
 * how-to-play, and win conditions. Content comes from the game's engine
 * (getGameRules), so it always matches real gameplay.
 */
export function RulesSheet({ game, onClose, onPlay }: RulesSheetProps) {
  const r = getGameRules(game.id);

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 75, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={onClose} />
      <div className="card-solid rise" role="dialog" aria-label="rules" style={{ position: 'relative', borderRadius: '26px 26px 0 0', maxHeight: '88%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* cover header */}
        <div style={{ position: 'relative', padding: '20px 18px 18px', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(150deg, ${game.g[0]}, ${game.g[1]})` }} />
          <div style={{ position: 'absolute', right: -10, bottom: -24, fontSize: 120, opacity: 0.9, transform: 'rotate(-8deg)', filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.3))' }}>{game.emoji}</div>
          <div className="row between" style={{ position: 'relative', alignItems: 'flex-start' }}>
            <span className="th" style={{ fontSize: 11.5, fontWeight: 700, padding: '5px 10px', borderRadius: 9, background: 'rgba(0,0,0,0.24)', color: '#fff' }}>{game.th_tag}</span>
            <button aria-label="close" className="row center" style={{ width: 34, height: 34, borderRadius: 11, background: 'rgba(0,0,0,0.28)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }} onClick={onClose}><Icon name="x" size={17} /></button>
          </div>
          <div className="th" style={{ position: 'relative', fontSize: 30, fontWeight: 800, color: '#fff', marginTop: 14, letterSpacing: '-0.02em', textShadow: '0 2px 10px rgba(0,0,0,0.25)' }}>{game.th}</div>
          <div className="row gap10" style={{ position: 'relative', marginTop: 6, color: 'rgba(255,255,255,0.92)', fontSize: 12.5, fontWeight: 600 }}>
            <span className="row gap6" style={{ alignItems: 'center' }}><Icon name="users" size={14} /> {(r?.players ?? game.players)} คน</span>
            <span style={{ opacity: 0.5 }}>·</span>
            <span className="row gap6" style={{ alignItems: 'center' }}><Icon name="clock" size={14} /> {game.mins} นาที</span>
          </div>
        </div>

        {/* body */}
        <div className="scroll" style={{ padding: '18px 18px 8px' }}>
          {!r ? (
            <div className="col center gap10" style={{ padding: '30px 10px', textAlign: 'center' }}>
              <span style={{ fontSize: 40 }}>✨</span>
              <span className="th h3">กติกาของเกมนี้กำลังจะมา</span>
              <span className="body" style={{ fontSize: 13 }}>{game.desc}</span>
            </div>
          ) : (
            <>
              {/* objective */}
              <div className="card" style={{ padding: 14, marginBottom: 20 }}>
                <div className="row gap8" style={{ alignItems: 'center', marginBottom: 7 }}>
                  <Icon name="trophy" size={17} style={{ color: 'var(--accent)' }} />
                  <span className="eyebrow">เป้าหมาย · objective</span>
                </div>
                <p className="th body" style={{ fontSize: 13.5, color: 'var(--text)' }}>{r.goal}</p>
              </div>

              {/* composition */}
              {r.composition && (
                <>
                  <span className="eyebrow">จำนวนผู้เล่น · ฝ่ายดี / ฝ่ายชั่ว</span>
                  <div className="row gap6" style={{ marginTop: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                    {r.composition.map(c => (
                      <div key={c.players} className="col center" style={{ flex: '1 0 28%', minWidth: 72, padding: '8px 6px', borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                        <span className="th" style={{ fontSize: 14, fontWeight: 800 }}>{c.players} คน</span>
                        <span className="tiny" style={{ fontWeight: 700, marginTop: 2 }}>
                          <span style={{ color: 'var(--good)' }}>{c.good}</span>
                          <span style={{ color: 'var(--muted)' }}> · </span>
                          <span style={{ color: 'var(--evil)' }}>{c.evil}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                  {r.structure && <p className="tiny" style={{ marginTop: 8, marginBottom: 20, lineHeight: 1.5 }}>{r.structure}</p>}
                </>
              )}

              {/* roles */}
              {r.roles && (
                <>
                  <span className="eyebrow">บทบาท · roles</span>
                  <div className="col gap8" style={{ marginTop: 10, marginBottom: 20 }}>
                    {r.roles.map(role => (
                      <div key={role.name} className="row gap10" style={{ alignItems: 'flex-start', padding: '10px 12px', borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)', borderLeft: `3px solid ${role.side === 'good' ? 'var(--good)' : 'var(--evil)'}` }}>
                        <span style={{ fontSize: 20, flexShrink: 0 }}>{role.em}</span>
                        <div className="col" style={{ gap: 2 }}>
                          <span className="th h3" style={{ fontSize: 14 }}>{role.name} <span style={{ fontSize: 10.5, fontWeight: 800, color: role.side === 'good' ? 'var(--good)' : 'var(--evil)' }}>· {role.side === 'good' ? 'ฝ่ายดี' : 'ฝ่ายชั่ว'}</span></span>
                          <span className="th tiny" style={{ lineHeight: 1.45 }}>{role.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* how to play */}
              <span className="eyebrow">วิธีเล่น · how to play</span>
              <div className="col gap10" style={{ marginTop: 12, marginBottom: 20 }}>
                {r.steps.map((s, i) => (
                  <div key={i} className="row gap12" style={{ alignItems: 'flex-start' }}>
                    <div className="row center" style={{ position: 'relative', width: 40, height: 40, borderRadius: 13, background: 'var(--surface-3)', fontSize: 20, flexShrink: 0 }}>
                      {s.emoji}
                      <span className="mono" style={{ position: 'absolute', top: -5, left: -5, width: 19, height: 19, borderRadius: '50%', background: 'var(--grad)', color: '#fff', fontSize: 10.5, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                    </div>
                    <div className="col" style={{ gap: 2, paddingTop: 2, flex: 1 }}>
                      <span className="th h3" style={{ fontSize: 14.5 }}>{s.title}</span>
                      <span className="th tiny" style={{ lineHeight: 1.45 }}>{s.desc}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* win conditions */}
              {r.win && (
                <>
                  <span className="eyebrow">เงื่อนไขชนะ · win</span>
                  <div className="col gap8" style={{ marginTop: 10, marginBottom: 20 }}>
                    {r.win.map((w, i) => (
                      <div key={i} className="th tiny" style={{ padding: '10px 13px', borderRadius: 12, background: 'var(--surface-2)', border: '1px solid var(--border)', lineHeight: 1.45 }}>{w}</div>
                    ))}
                  </div>
                </>
              )}

              {/* tips */}
              {r.tips && (
                <>
                  <span className="eyebrow">เคล็ดลับ · tips</span>
                  <div className="col gap8" style={{ marginTop: 10 }}>
                    {r.tips.map((tp, i) => (
                      <div key={i} className="row gap8" style={{ alignItems: 'flex-start', padding: '10px 13px', borderRadius: 13, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                        <Icon name="sparkle" size={15} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }} />
                        <span className="th tiny" style={{ color: 'var(--text)', lineHeight: 1.45 }}>{tp}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* CTA */}
        {onPlay && (
          <div className="pad-x" style={{ paddingTop: 12, paddingBottom: 24, borderTop: '1px solid var(--border)' }}>
            <button className="btn btn-primary btn-lg btn-block" onClick={() => onPlay(game)}>
              <span className="sheen" />
              <Icon name="arrowR" size={20} stroke={2.6} /> <span className="th" style={{ fontWeight: 800 }}>เล่นเกมนี้</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
