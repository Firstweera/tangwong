// router.jsx — maps the current screen id to its page element
import HomePage from '../pages/HomePage.jsx';
import LobbyPage from '../pages/LobbyPage.jsx';
import GamePage from '../pages/GamePage.jsx';
import ResultPage from '../pages/ResultPage.jsx';
import { GamesPage } from '../pages/GamesPage.jsx';
import { FriendsPage } from '../pages/FriendsPage.jsx';
import { ProfilePage } from '../pages/ProfilePage.jsx';

// ctx carries the shared handlers/state every page may need.
export function renderScreen(screen, ctx) {
  const { go, showToast, payload, lobbyLayout } = ctx;
  switch (screen) {
    case 'home':    return <HomePage go={go} showToast={showToast} />;
    case 'games':   return <GamesPage go={go} showToast={showToast} />;
    case 'friends': return <FriendsPage go={go} showToast={showToast} />;
    case 'profile': return <ProfilePage go={go} showToast={showToast} />;
    case 'lobby':   return <LobbyPage go={go} layout={lobbyLayout} showToast={showToast} />;
    case 'game':    return <GamePage go={go} showToast={showToast} />;
    case 'result':  return <ResultPage go={go} payload={payload} showToast={showToast} />;
    default:        return <HomePage go={go} showToast={showToast} />;
  }
}
