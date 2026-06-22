// router.jsx — maps the current screen id to its page element
import WelcomePage from '../pages/WelcomePage.jsx';
import HomePage from '../pages/HomePage.jsx';
import LobbyPage from '../pages/LobbyPage.jsx';
import GamePage from '../pages/GamePage.jsx';
import ResultPage from '../pages/ResultPage.jsx';
import DesignSpecPage from '../pages/DesignSpecPage.jsx';
import { GamesPage } from '../pages/GamesPage.jsx';
import { FriendsPage } from '../pages/FriendsPage.jsx';
import { ProfilePage } from '../pages/ProfilePage.jsx';

// ctx carries the shared handlers/state every page may need.
export function renderScreen(screen, ctx) {
  const {
    go, showToast, payload, lobbyLayout,
    guest, player,
    currentRoom, lastRoom,
    createRoom, joinRoom, leaveRoom, rejoinRoom, clearLastRoom, updateRoomSettings,
    openCreateRoom, openEditProfile,
    completeGuestOnboarding, onOAuth,
  } = ctx;
  switch (screen) {
    case 'welcome': return <WelcomePage onGuest={completeGuestOnboarding} onOAuth={onOAuth} />;
    case 'home':    return <HomePage go={go} showToast={showToast} player={player} lastRoom={lastRoom}
                              openCreateRoom={openCreateRoom} joinRoom={joinRoom} rejoinRoom={rejoinRoom}
                              clearLastRoom={clearLastRoom} openEditProfile={openEditProfile} />;
    case 'games':   return <GamesPage go={go} showToast={showToast} />;
    case 'friends': return <FriendsPage go={go} showToast={showToast} />;
    case 'profile': return <ProfilePage go={go} showToast={showToast} guest={guest} player={player}
                              openEditProfile={openEditProfile} />;
    case 'lobby':   return <LobbyPage go={go} layout={lobbyLayout} showToast={showToast}
                              room={currentRoom} player={player} onLeave={leaveRoom} onUpdateSettings={updateRoomSettings} />;
    case 'game':    return <GamePage go={go} showToast={showToast} currentRoom={currentRoom} player={player} />;
    case 'result':  return <ResultPage go={go} payload={payload} showToast={showToast} player={player} />;
    case 'design-spec': return <DesignSpecPage go={go} />;
    default:        return <HomePage go={go} showToast={showToast} player={player} lastRoom={lastRoom}
                              openCreateRoom={openCreateRoom} joinRoom={joinRoom} rejoinRoom={rejoinRoom}
                              clearLastRoom={clearLastRoom} openEditProfile={openEditProfile} />;
  }
}
