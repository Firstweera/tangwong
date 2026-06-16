// App.jsx — composition root: device scaler, theme/accent vars, shell + tweaks
import React, { useState, useEffect } from 'react';
import { IOSDevice } from '../devtools/IOSFrame.jsx';
import {
  useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakColor, TweakToggle, TweakButton,
} from '../devtools/TweaksPanel.jsx';
import { useToast } from '../components/ui';
import { TabBar, isMainTab } from './TabBar.jsx';
import { renderScreen } from './router.jsx';

const TWEAK_DEFAULTS = {
  theme: 'dark',
  accent: ['#6D5EF9', '#00D4FF'],
  lobbyLayout: 'grid',
  navStyle: 'float',
  navLabels: true,
  celebrate: true,
};

export default function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [screen, setScreen] = useState('home');
  const [payload, setPayload] = useState(null);
  const [scale, setScale] = useState(1);
  const [toastNode, showToast] = useToast();

  const go = (s, p = null) => { setPayload(p); setScreen(s); };

  // scale device to fit viewport
  useEffect(() => {
    const fit = () => {
      const W = 402, H = 874;
      setScale(Math.min((window.innerWidth - 24) / W, (window.innerHeight - 24) / H, 1));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  const dark = t.theme === 'dark';
  const accentVars = {
    '--primary': t.accent[0],
    '--secondary': t.accent[1],
    '--grad': `linear-gradient(135deg, ${t.accent[0]} 0%, ${t.accent[1]} 115%)`,
    '--grad-soft': `linear-gradient(135deg, ${t.accent[0]}38, ${t.accent[1]}1f)`,
  };

  const screenEl = renderScreen(screen, { go, showToast, payload, lobbyLayout: t.lobbyLayout });

  return (
    <React.Fragment>
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}>
        <IOSDevice dark={dark}>
          <div className="app" data-theme={t.theme} style={{ ...accentVars }}>
            <div className="screen" key={screen}>
              {screenEl}
            </div>
            {isMainTab(screen) && <TabBar screen={screen} go={go} navStyle={t.navStyle} navLabels={t.navLabels} />}
            {toastNode}
          </div>
        </IOSDevice>
      </div>

      <TweaksPanel>
        <TweakSection label="ธีม · Theme" />
        <TweakRadio label="โหมดสี" value={t.theme} options={['dark', 'light']} onChange={v => setTweak('theme', v)} />
        <TweakColor label="สีหลัก · Accent" value={t.accent}
          options={[['#6D5EF9', '#00D4FF'], ['#FF6FA3', '#FF9F43'], ['#34D17E', '#00D4FF'], ['#8B5CF6', '#6D5EF9']]}
          onChange={v => setTweak('accent', v)} />

        <TweakSection label="เลย์เอาต์ · Layout" />
        <TweakRadio label="ห้องรอ (Lobby)" value={t.lobbyLayout} options={['grid', 'list', 'circle']} onChange={v => setTweak('lobbyLayout', v)} />

        <TweakSection label="นำทาง · Navigation" />
        <TweakRadio label="แถบเมนู" value={t.navStyle} options={['float', 'bar']} onChange={v => setTweak('navStyle', v)} />
        <TweakToggle label="แสดงป้ายชื่อ" value={t.navLabels} onChange={v => setTweak('navLabels', v)} />

        <TweakSection label="ทางลัด · Jump to" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <TweakButton label="🏠 Home" onClick={() => go('home')} />
          <TweakButton label="🚪 Lobby" onClick={() => go('lobby')} />
          <TweakButton label="🛡️ Game" onClick={() => go('game')} />
          <TweakButton label="🏆 Result" onClick={() => go('result', { winner: 'good', reason: 'quests', results: ['success', 'fail', 'success', 'success', null] })} />
        </div>
      </TweaksPanel>
    </React.Fragment>
  );
}
