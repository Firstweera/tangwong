// QuestTrack.jsx — 5-pip quest progress indicator
import { QUESTS } from '../../data';
import { Icon } from './Icon.jsx';

export function QuestTrack({ results, current }) {
  // results: array like ['success','fail',null,null,null]; current index
  return (
    <div className="quest-track">
      {QUESTS.map((q, i) => {
        const r = results[i];
        const cls = r === 'success' ? 'success' : r === 'fail' ? 'fail' : i === current ? 'current' : '';
        return (
          <div key={i} className={'qpip ' + cls}>
            {r === 'success' ? <Icon name="check" size={16} stroke={3} />
              : r === 'fail' ? <Icon name="x" size={15} stroke={3} />
              : q.size}
            {q.fails === 2 && !r && <span style={{ position: 'absolute', bottom: -16, fontSize: 8.5, fontWeight: 800, color: 'var(--evil)' }}>2✗</span>}
          </div>
        );
      })}
    </div>
  );
}
