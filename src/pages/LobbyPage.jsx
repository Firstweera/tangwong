// LobbyPage.jsx — room lobby, composed from reusable lobby + game components.
// Room state (players, ready, settings) is synced live via useRealtimeRoom.
import { useEffect, useRef, useState } from 'react';
import { Icon } from '../components/ui';
import {
  LobbyHeader, RoomCodeDisplay, GameSelector,
  PlayerList, PlayerGrid, PlayerCircle, LobbyFooter, ChatPanel,
  AddBotTile, AddBotButton,
} from '../features/lobby';
import { RulesSheet } from '../features/games/ui';
import { getGameRules } from '../features/games';
import { RoomSettingsSheet } from '../features/room/components/RoomSettingsSheet.tsx';
import { PlayerActionsMenu } from '../features/room/components/PlayerActionsMenu.tsx';
import { useRealtimeRoom } from '../features/room/hooks/useRealtimeRoom.ts';
import { useChat, useUnreadChat } from '../features/chat';
import { PLAYERS, GAMES } from '../data';

// Default room for dev jump-to shortcuts (TweaksPanel "Lobby" button)
const DEMO_ROOM = {
  id: 'demo',
  code: '4F2K9',
  name: 'ห้องของแพรวา',
  maxPlayers: 7,
  isPublic: true,
  gameId: 'avalon',
  hostId: 'p4',
  players: PLAYERS,
  status: 'waiting',
  inviteLink: 'https://tangwong.app/join/4F2K9',
  createdAt: 0,
};

export default function LobbyPage({ go, layout, showToast, room, player, onLeave, onUpdateSettings }) {
  const seedRoom = room ?? DEMO_ROOM;

  // ─── Realtime room (Epic 4) — live players, ready, settings across tabs ─────
  const handleRemoved = () => {
    showToast('คุณถูกเชิญออกจากห้อง', '👋');
    if (onLeave) onLeave(); else go('home');
  };
  const {
    room: liveRoom, players, meId, isReady, readyCount, setReady, updateSettings, addBot, kick, transferHost, leave,
  } = useRealtimeRoom(
    seedRoom,
    player ?? { id: meId, name: 'คุณ', en: 'You', mascot: 'fox', online: true },
    { onRemoved: handleRemoved },
  );

  const currentGame = GAMES.find(g => g.id === liveRoom.gameId) ?? GAMES[0];
  const meReady = !!liveRoom.ready[meId];
  const allReady = players.length > 0 && readyCount === players.length;
  const isHost = liveRoom.hostId === meId;
  const minPlayers = currentGame.minPlayers ?? 1;
  const enough = players.length >= minPlayers;
  const atMax = players.length >= liveRoom.maxPlayers;
  const canStart = isHost && enough && allReady;

  const handleKick = (p) => {
    kick(p.id);
    showToast(p.bot ? `นำ ${p.name} ออกแล้ว` : `เชิญ ${p.name} ออกจากห้องแล้ว`, p.bot ? '🤖' : '👋');
  };
  const handleTransferHost = (p) => {
    transferHost(p.id);
    showToast(`โอนสิทธิ์เจ้าของห้องให้ ${p.name} แล้ว`, '👑');
  };
  const handleAddBot = () => {
    if (atMax) { showToast('ห้องเต็มแล้ว', '⚠️'); return; }
    addBot();
    showToast('เพิ่มบอทแล้ว', '🤖');
  };

  // Host-only actions menu for every player except the host and yourself.
  const renderPlayerActions = isHost
    ? (p) => (p.id !== liveRoom.hostId && p.id !== meId
        ? <PlayerActionsMenu playerName={p.name} isBot={p.bot} onTransferHost={() => handleTransferHost(p)} onKick={() => handleKick(p)} />
        : null)
    : undefined;
  const handleStart = () => {
    if (!canStart) return;
    go('game');
  };

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const hasRules = !!getGameRules(currentGame.id);

  // ─── Local chat (Epic 3), now synced across tabs via the shared room id ─────
  const { messages, sendMessage, sendSystem, toggleReaction } = useChat(liveRoom.id, meId, liveRoom.code);
  const unreadChatCount = useUnreadChat(messages, meId, chatOpen);

  // The host seeds a welcome notice once, after the room has synced server-side
  // (a UUID id, not the optimistic `room_…` seed) and the chat loads empty.
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(liveRoom.id);
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current || !isUuid || !isHost) return;
    seeded.current = true;
    if (messages.length === 0) sendSystem(`ยินดีต้อนรับสู่ ${liveRoom.name}`);
  }, [isUuid, isHost, messages.length, sendSystem, liveRoom.name]);

  // Everyone follows the host into the match. When the host presses Start, the
  // game-start Edge Function flips rooms.status to 'in-game'; the realtime room
  // subscription delivers that to every client, so non-host players (and anyone
  // rejoining an already-started room) navigate into the game here. The host has
  // already navigated via handleStart (which is what triggers game-start).
  useEffect(() => {
    if (liveRoom.status === 'in-game') go('game');
  }, [liveRoom.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleMe = () => setReady(!meReady);

  const handleBack = () => {
    leave();
    if (onLeave) onLeave();
    else go('home');
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(liveRoom.code).catch(() => {});
    showToast('คัดลอกรหัสห้องแล้ว', '📋');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: liveRoom.name, text: `เข้าร่วมห้อง ${liveRoom.name}`, url: liveRoom.inviteLink }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(liveRoom.inviteLink).catch(() => {});
      showToast('คัดลอกลิงก์เชิญแล้ว', '🔗');
    }
  };

  const handleSaveSettings = (settings) => {
    updateSettings(settings);          // broadcast to every client in the room
    if (onUpdateSettings) onUpdateSettings(settings); // keep App's seed in sync
    showToast('อัปเดตห้องแล้ว', '✅');
  };

  return (
    <div className="screen screen-anim">
      <div className="scroll" style={{ paddingBottom: 150 }}>
        <LobbyHeader
          title={liveRoom.name}
          subtitle={`${players.length} คน · ${liveRoom.isPublic ? 'ห้องสาธารณะ' : 'ห้องส่วนตัว'}`}
          onBack={handleBack}
          onSettings={() => setSettingsOpen(true)}
        />

        {/* room code */}
        <div className="pad-x" style={{ marginTop: 12 }}>
          <RoomCodeDisplay code={liveRoom.code} onCopy={handleCopy} onShare={handleShare} />
        </div>

        {/* voice channel — coming soon */}
        <div className="pad-x" style={{ marginTop: 10 }}>
          <div className="card row between" style={{ padding: '10px 14px' }}>
            <div className="row gap10" style={{ opacity: 0.5 }}>
              <div className="row center" style={{ width: 34, height: 34, borderRadius: 11, background: 'var(--surface-3)', color: 'var(--muted)', position: 'relative' }}>
                <Icon name="mic" size={17} />
                <span style={{ position: 'absolute', width: 24, height: 2, borderRadius: 2, background: 'var(--muted)', transform: 'rotate(-45deg)' }} />
              </div>
              <div className="col" style={{ gap: 1 }}>
                <span className="th" style={{ fontSize: 13.5, fontWeight: 700 }}>ห้องเสียง · Voice</span>
                <span className="tiny" style={{ fontWeight: 600 }}>คุยกันด้วยเสียงระหว่างเล่น</span>
              </div>
            </div>
            <span className="th row gap6" style={{ alignItems: 'center', fontSize: 11, fontWeight: 800, padding: '5px 10px', borderRadius: 9, background: 'var(--surface-3)', color: 'var(--muted)', border: '1px solid var(--border)', flexShrink: 0 }}>
              <span style={{ fontSize: 12 }}>🔜</span> เร็วๆ นี้
            </span>
          </div>
        </div>

        {/* selected game */}
        <div className="pad-x" style={{ marginTop: 18 }}>
          <GameSelector game={currentGame} onChange={() => setSettingsOpen(true)} onRules={hasRules ? () => setRulesOpen(true) : undefined} />
        </div>

        {/* players */}
        <div className="pad-x" style={{ marginTop: 20 }}>
          <div className="row between" style={{ marginBottom: 12 }}>
            <h2 className="th h2" style={{ fontSize: 18 }}>ผู้เล่น <span style={{ color: enough ? 'var(--muted)' : 'var(--accent)', fontWeight: 700 }}>{players.length}/{liveRoom.maxPlayers}</span></h2>
            <span className="chip" style={{ background: allReady ? 'rgba(52,209,126,0.14)' : 'var(--surface-2)', color: allReady ? '#34D17E' : 'var(--muted)', border: allReady ? 'none' : '1px solid var(--border)' }}>{readyCount}/{players.length} พร้อม</span>
          </div>

          {!enough && (
            <div className="row gap8 rise" style={{ alignItems: 'center', marginBottom: 12, padding: '9px 12px', borderRadius: 12, background: 'rgba(255,159,67,0.12)', border: '1px solid rgba(255,159,67,0.28)' }}>
              <span style={{ fontSize: 15 }}>👥</span>
              <span className="th tiny" style={{ fontWeight: 700, color: 'var(--accent)' }}>ต้องการอีก {minPlayers - players.length} คนจึงจะเริ่มได้ — เพิ่มบอทเพื่อเติมที่นั่ง</span>
            </div>
          )}

          {layout === 'list'   ? <PlayerList   players={players} isReady={isReady} hostId={liveRoom.hostId} meId={meId} renderActions={renderPlayerActions} /> :
           layout === 'circle' ? <PlayerCircle players={players} isReady={isReady} hostId={liveRoom.hostId} meId={meId} readyCount={readyCount} renderActions={renderPlayerActions} /> :
                                 <PlayerGrid   players={players} isReady={isReady} hostId={liveRoom.hostId} meId={meId} renderActions={renderPlayerActions}
                                   extra={isHost ? <AddBotTile onClick={handleAddBot} disabled={atMax} /> : null} />}

          {/* add bot below list / circle layouts (grid uses an inline tile) */}
          {isHost && layout !== 'grid' && <AddBotButton onClick={handleAddBot} disabled={atMax} />}
        </div>
      </div>

      {/* floating chat button — opens the lobby chat */}
      {!chatOpen && (
        <button
          aria-label={unreadChatCount > 0 ? `เปิดแชต มี ${unreadChatCount} ข้อความใหม่` : 'เปิดแชต'}
          onClick={() => setChatOpen(true)}
          className="row center chat-icon-wrap"
          style={{ position: 'absolute', right: 16, bottom: 132, zIndex: 40, width: 52, height: 52, borderRadius: 17, background: 'var(--grad)', color: '#fff', boxShadow: '0 8px 22px rgba(0,0,0,0.28)' }}
        >
          <Icon name="chat" size={22} />
          {unreadChatCount > 0 && (
            <span className="chat-unread-badge" aria-hidden="true">
              {unreadChatCount > 99 ? '99+' : unreadChatCount}
            </span>
          )}
        </button>
      )}

      <LobbyFooter meReady={meReady} onToggleReady={toggleMe} onStart={handleStart} allReady={allReady} isHost={isHost} minPlayers={minPlayers} playerCount={players.length} readyCount={readyCount} />

      {/* Local chat panel (Epic 3 · synced in Epic 4) */}
      {chatOpen && (
        <ChatPanel
          messages={messages}
          players={players}
          meId={meId}
          onSend={sendMessage}
          onReact={toggleReaction}
          onClose={() => setChatOpen(false)}
        />
      )}

      {/* Rules sheet (engine-derived) */}
      {rulesOpen && <RulesSheet game={currentGame} onClose={() => setRulesOpen(false)} />}

      {/* Room settings sheet */}
      <RoomSettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        room={liveRoom}
        onSave={handleSaveSettings}
      />
    </div>
  );
}
