// App.jsx — composition root: device scaler, theme/accent vars, shell + tweaks
import React, { useState, useEffect } from 'react';
import {
  useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakColor, TweakToggle, TweakButton,
} from '../devtools/TweaksPanel.jsx';
import { useToast } from '../components/ui';
import { TabBar, isMainTab } from './TabBar.jsx';
import { renderScreen } from './router.jsx';
import { buildRoom, buildRoomFromCode, parseInviteCode } from '../features/room/roomUtils.ts';
import { useGuest } from '../features/guest/hooks/useGuest.ts';
import { CreateRoomSheet } from '../features/room/components/CreateRoomSheet.tsx';
import { EditProfileSheet } from '../features/guest/components/EditProfileSheet.tsx';

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
  const [payload, setPayload] = useState(null);
  const [toastNode, showToast] = useToast();

  // ─── Guest identity ───────────────────────────────────────────────────────
  const { guest, player, updateGuest, ready } = useGuest();

  // First-run lands on Welcome (pick name + mascot); returning users skip it.
  const [screen, setScreen] = useState(() => (guest.onboarded ? 'home' : 'welcome'));

  const [editProfileOpen, setEditProfileOpen] = useState(false);

  // ─── Room state ─────────────────────────────────────────────────────────

  const [createOpen, setCreateOpen] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [lastRoom, setLastRoom] = useState(null);

  const go = (s, p = null) => { setPayload(p); setScreen(s); };

  // ─── Onboarding (Welcome) ─────────────────────────────────────────────────
  const completeGuestOnboarding = ({ mascot, name }) => {
    updateGuest({ mascot, nickname: name, onboarded: true });
    go('home');
  };
  const onOAuth = () => {
    // Real account sign-in arrives in Epic 9; preview it for now.
    showToast('การเข้าสู่ระบบด้วยบัญชีจะมาเร็วๆ นี้ — เล่นแบบ Guest ได้เลย', '🔜');
  };

  // A returning account (Supabase profile) resolves async; if we're still on
  // Welcome once it lands, skip straight to home.
  useEffect(() => {
    if (ready && guest.onboarded && screen === 'welcome') go('home');
  }, [ready, guest.onboarded, screen]);

  const createRoom = (settings) => {
    const room = buildRoom(settings, player);
    setCurrentRoom(room);
    go('lobby');
  };

  const joinRoom = (input) => {
    const code = parseInviteCode(input);
    if (code.length < 5) { showToast('ใส่รหัสห้องให้ครบ 5 ตัว', '🔑'); return; }
    const room = buildRoomFromCode(code, player);
    setCurrentRoom(room);
    go('lobby');
  };

  const leaveRoom = () => {
    if (currentRoom) setLastRoom(currentRoom);
    setCurrentRoom(null);
    go('home');
  };

  const rejoinRoom = () => {
    if (!lastRoom) return;
    setCurrentRoom(lastRoom);
    setLastRoom(null);
    go('lobby');
  };

  const updateRoomSettings = (settings) => {
    setCurrentRoom(r => r ? { ...r, ...settings } : r);
    showToast('อัปเดตห้องแล้ว', '✅');
  };

  const handleFabCreate = (settings) => {
    setCreateOpen(false);
    createRoom(settings);
  };

  const handleSaveProfile = (updates) => {
    updateGuest(updates);
    showToast('บันทึกโปรไฟล์แล้ว', '✅');
  };
  // ─────────────────────────────────────────────────────────────────────────

  const accentVars = {
    '--primary': t.accent[0],
    '--secondary': t.accent[1],
    '--grad': `linear-gradient(135deg, ${t.accent[0]} 0%, ${t.accent[1]} 115%)`,
    '--grad-soft': `linear-gradient(135deg, ${t.accent[0]}38, ${t.accent[1]}1f)`,
  };

  const screenEl = renderScreen(screen, {
    go, showToast, payload, lobbyLayout: t.lobbyLayout,
    guest, player,
    currentRoom, lastRoom,
    createRoom, joinRoom, leaveRoom, rejoinRoom, updateRoomSettings,
    openCreateRoom: () => setCreateOpen(true),
    openEditProfile: () => setEditProfileOpen(true),
    completeGuestOnboarding, onOAuth,
  });

  return (
    <React.Fragment>
      <div className="app" data-theme={t.theme} style={{ ...accentVars }}>
        <div className="screen" key={screen}>
          {screenEl}
        </div>
        {isMainTab(screen) && <TabBar screen={screen} go={go} navStyle={t.navStyle} navLabels={t.navLabels} onFabPress={() => setCreateOpen(true)} />}
        {toastNode}
        <CreateRoomSheet open={createOpen} onClose={() => setCreateOpen(false)} onCreateRoom={handleFabCreate} player={player} />
        <EditProfileSheet open={editProfileOpen} onClose={() => setEditProfileOpen(false)} guest={guest} onSave={handleSaveProfile} />
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
