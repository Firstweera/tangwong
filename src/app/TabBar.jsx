// TabBar.jsx — bottom navigation + the four main tabs
import { Icon } from '../components/ui';

export const MAIN_TABS = [
  { id: 'home', icon: 'home', label: 'หน้าหลัก' },
  { id: 'games', icon: 'dice', label: 'เกม' },
  { id: 'friends', icon: 'users', label: 'เพื่อน' },
  { id: 'profile', icon: 'user', label: 'โปรไฟล์' },
];
const MAIN_SET = new Set(MAIN_TABS.map(t => t.id));

// Whether a given screen id is one of the main tabs (so the tab bar shows).
export const isMainTab = (screen) => MAIN_SET.has(screen);

export function TabBar({ screen, go, navStyle, navLabels, onFabPress }) {
  const bar = navStyle === 'bar';
  const left = MAIN_TABS.slice(0, 2), right = MAIN_TABS.slice(2);
  const Item = ({ t }) => {
    const active = screen === t.id;
    return (
      <button className={'tab' + (active ? ' active' : '')} onClick={() => go(t.id)}>
        <Icon name={t.icon} size={23} fill={active ? 'currentColor' : 'none'} stroke={active ? 0 : 2} />
        {navLabels && <span className="th">{t.label}</span>}
      </button>
    );
  };
  return (
    <div className="tabbar" style={bar ? { left: 0, right: 0, bottom: 0, borderRadius: '22px 22px 0 0', height: 78, paddingBottom: 12 } : {}}>
      {left.map(t => <Item key={t.id} t={t} />)}
      <button className="tab-fab" onClick={onFabPress ?? (() => go('lobby'))} aria-label="create room"><Icon name="plus" size={26} stroke={2.6} /></button>
      {right.map(t => <Item key={t.id} t={t} />)}
    </div>
  );
}
