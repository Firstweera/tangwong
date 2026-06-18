// app.jsx — router, device scaler, tab bar, tweaks

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "dark",
  "accent": ["#6D5EF9", "#00D4FF"],
  "lobbyLayout": "grid",
  "felt": "green",
  "navStyle": "float",
  "navLabels": true,
  "celebrate": true
}/*EDITMODE-END*/;

const MAIN_TABS = [
  { id: 'home', icon: 'home', label: 'หน้าหลัก' },
  { id: 'games', icon: 'dice', label: 'เกม' },
  { id: 'friends', icon: 'users', label: 'เพื่อน' },
  { id: 'profile', icon: 'user', label: 'โปรไฟล์' },
];
const MAIN_SET = new Set(MAIN_TABS.map(t => t.id));

function TabBar({ screen, go, navStyle, navLabels }) {
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
      <button className="tab-fab" onClick={() => go('lobby')} aria-label="create room"><Icon name="plus" size={26} stroke={2.6} /></button>
      {right.map(t => <Item key={t.id} t={t} />)}
    </div>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [screen, setScreen] = useState('welcome');
  const [payload, setPayload] = useState(null);
  const [scale, setScale] = useState(1);
  const [account, setAccount] = useState(false);
  const [idV, setIdV] = useState(0);          // identity version — bump to re-render ME everywhere
  const [toastNode, showToast] = useToast();

  const go = (s, p = null) => { setPayload(p); setScreen(s); };
  const openAccount = () => setAccount(true);

  const onAuth = (info) => {
    if (info.provider === 'guest') {
      ME.mascot = info.mascot; ME.name = info.name; ME.guest = true; ME.provider = null;
    } else {
      ME.guest = false; ME.provider = info.provider;
      const names = { google: 'Google', apple: 'Apple' };
      showToast(`เข้าสู่ระบบด้วย ${names[info.provider]} แล้ว`, '✅');
    }
    setIdV(v => v + 1);
    setScreen('home');
  };

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

  const screenEl = (() => {
    switch (screen) {
      case 'welcome': return <WelcomeScreen onAuth={onAuth} />;
      case 'home':    return <HomeScreen go={go} openAccount={openAccount} showToast={showToast} />;
      case 'games':   return <GamesScreen go={go} showToast={showToast} />;
      case 'friends': return <FriendsScreen go={go} showToast={showToast} />;
      case 'profile': return <ProfileScreen go={go} openAccount={openAccount} showToast={showToast} />;
      case 'lobby':   return <LobbyScreen go={go} layout={t.lobbyLayout} showToast={showToast} />;
      case 'game':    return <GameScreen go={go} showToast={showToast} />;
      case 'result':  return <ResultScreen go={go} payload={payload} showToast={showToast} />;
      default:        return <HomeScreen go={go} showToast={showToast} />;
    }
  })();

  return (
    <React.Fragment>
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}>
        <IOSDevice dark={dark}>
          <div className="app" data-theme={t.theme} data-felt={t.felt} style={{ ...accentVars }}>
            <div className="screen" key={screen + ':' + idV}>
              {screenEl}
            </div>
            {MAIN_SET.has(screen) && <TabBar screen={screen} go={go} navStyle={t.navStyle} navLabels={t.navLabels} />}
            {account && <AccountSheet onClose={() => setAccount(false)} onSaved={() => setIdV(v => v + 1)}
              onLogout={() => { ME.guest = false; ME.provider = null; setScreen('welcome'); }} showToast={showToast} />}
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
        <TweakRadio label="สีโต๊ะ (Felt)" value={t.felt} options={['green', 'violet', 'slate', 'crimson']} onChange={v => setTweak('felt', v)} />

        <TweakSection label="นำทาง · Navigation" />
        <TweakRadio label="แถบเมนู" value={t.navStyle} options={['float', 'bar']} onChange={v => setTweak('navStyle', v)} />
        <TweakToggle label="แสดงป้ายชื่อ" value={t.navLabels} onChange={v => setTweak('navLabels', v)} />

        <TweakSection label="ทางลัด · Jump to" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <TweakButton label="👋 Welcome" onClick={() => go('welcome')} />
          <TweakButton label="🏠 Home" onClick={() => go('home')} />
          <TweakButton label="🚪 Lobby" onClick={() => go('lobby')} />
          <TweakButton label="🛡️ Game" onClick={() => go('game')} />
          <TweakButton label="🏆 Result" onClick={() => go('result', { winner: 'good', reason: 'quests', results: ['success', 'fail', 'success', 'success', null] })} />
        </div>
      </TweaksPanel>
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById('device-scaler')).render(<App />);
