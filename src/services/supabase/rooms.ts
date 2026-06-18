// Supabase room service — assembles the SyncedRoom snapshot from the rooms +
// room_players tables and exposes the same mutations as the cross-tab store, but
// async and server-authoritative (all writes go through RPC). Realtime postgres
// changes notify subscribers. This is the Supabase half of Phase 4.5.2; the
// useRealtimeRoom hook picks this or the cross-tab store via VITE_USE_SUPABASE.
import { supabase } from './client';
import type { Player, Room, RoomSettings } from '@/types';
import type { MascotKey } from '@/types';
import type { SyncedRoom } from '@/services/realtime';

interface RoomRow {
  id: string; code: string; name: string; game_id: string; host_id: string;
  max_players: number; is_public: boolean; status: string; invite_link: string;
  created_at: string;
}
interface RoomPlayerRow {
  room_id: string; player_id: string; nickname: string; mascot: string;
  is_ready: boolean; is_bot: boolean; last_seen: string; joined_at: string;
}

/** Build the domain SyncedRoom from a room row + its members. */
function assemble(room: RoomRow, members: RoomPlayerRow[]): SyncedRoom {
  const players: Player[] = members.map(m => ({
    id: m.player_id,
    name: m.nickname,
    en: m.nickname,
    mascot: m.mascot as MascotKey,
    online: true,
    bot: m.is_bot,
  }));
  const ready: Record<string, boolean> = {};
  const presence: Record<string, number> = {};
  for (const m of members) {
    ready[m.player_id] = m.is_ready;
    presence[m.player_id] = Date.parse(m.last_seen);
  }
  return {
    id: room.id,
    code: room.code,
    name: room.name,
    maxPlayers: room.max_players,
    isPublic: room.is_public,
    gameId: room.game_id,
    hostId: room.host_id,
    players,
    status: room.status as Room['status'],
    inviteLink: room.invite_link,
    createdAt: Date.parse(room.created_at),
    ready,
    presence,
  };
}

/** Fetch and assemble the current snapshot for a room code. */
export async function fetchRoom(code: string): Promise<SyncedRoom | null> {
  if (!supabase) return null;
  const { data: room, error: roomErr } = await supabase.from('rooms').select('*').eq('code', code).maybeSingle();
  if (roomErr) console.error('[fetchRoom] rooms error:', roomErr.message);
  if (!room) return null;
  const { data: members, error: membersErr } = await supabase
    .from('room_players').select('*').eq('room_id', (room as RoomRow).id).order('joined_at');
  if (membersErr) console.error('[fetchRoom] room_players error:', membersErr.message);
  return assemble(room as RoomRow, (members ?? []) as RoomPlayerRow[]);
}

/** Join (or create) the room, then return the fresh snapshot. */
export async function joinRoom(code: string, player: Player, seed: Room): Promise<SyncedRoom | null> {
  if (!supabase) return null;
  const { error } = await supabase.rpc('join_room', {
    p_code: code,
    p_seed: {
      name: seed.name, gameId: seed.gameId, maxPlayers: seed.maxPlayers,
      isPublic: seed.isPublic, inviteLink: seed.inviteLink,
      nickname: player.name, mascot: player.mascot,
    },
  });
  if (error) {
    console.error('[joinRoom] RPC error:', error.message, error.details, error.hint);
    return null;
  }
  return fetchRoom(code);
}

export async function setReady(code: string, ready: boolean): Promise<void> {
  await supabase?.rpc('set_ready', { p_code: code, p_ready: ready });
}
export async function touchPresence(code: string): Promise<void> {
  await supabase?.rpc('touch_presence', { p_code: code });
}
export async function updateSettings(code: string, settings: Partial<RoomSettings>): Promise<void> {
  await supabase?.rpc('update_settings', { p_code: code, p_settings: settings });
}
export async function kickPlayer(code: string, target: string): Promise<void> {
  await supabase?.rpc('kick_player', { p_code: code, p_target: target });
}
export async function transferHost(code: string, target: string): Promise<void> {
  await supabase?.rpc('transfer_host', { p_code: code, p_target: target });
}
export async function addBot(code: string, bot: Player): Promise<void> {
  await supabase?.rpc('add_bot', { p_code: code, p_bot: { id: bot.id, name: bot.name, mascot: bot.mascot } });
}
export async function leaveRoom(code: string): Promise<void> {
  await supabase?.rpc('leave_room', { p_code: code });
}

/** Subscribe to room + membership changes; returns an unsubscribe fn. */
export function subscribeRoom(roomId: string, onChange: () => void): () => void {
  const client = supabase;
  if (!client) return () => {};
  const channel = client
    .channel(`room:${roomId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'room_players', filter: `room_id=eq.${roomId}` }, onChange)
    .subscribe();
  return () => { client.removeChannel(channel); };
}
