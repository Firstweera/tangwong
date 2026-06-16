// ReadyPill.jsx — ready/waiting status badge for a player slot
import { Icon } from '../../../components/ui';

export function ReadyPill({ ready }) {
  return (
    <span className="row gap6" style={{
      fontSize: 10.5, fontWeight: 800, padding: '3px 8px', borderRadius: 8,
      background: ready ? 'rgba(52,209,126,0.16)' : 'var(--surface-2)',
      color: ready ? '#34D17E' : 'var(--muted)', alignItems: 'center',
    }}>
      {ready ? <><Icon name="check" size={11} stroke={3.2} /> พร้อม</> : 'รอ...'}
    </span>
  );
}
