// Supabase chat service — room chat backed by the chat_messages table. Members
// insert their own user messages directly (RLS-checked); reactions and system
// notices go through RPC. Realtime postgres changes notify subscribers. The
// Supabase half of Phase 4.5.2; useChat picks this or the cross-tab store.
import { supabase } from './client';
import type { ChatMessage, ChatReaction } from '@/types';

interface ChatRow {
  id: string; room_id: string; player_id: string | null;
  kind: string; text: string; reactions: ChatReaction[]; created_at: string;
}

const MAX = 200;

function toMessage(row: ChatRow): ChatMessage {
  return {
    id: row.id,
    kind: row.kind === 'system' ? 'system' : 'user',
    who: row.player_id ?? '',
    text: row.text,
    ts: Date.parse(row.created_at),
    reactions: row.reactions ?? [],
  };
}

/** roomId here is the rooms.id (uuid); chat is keyed by it. */
export async function fetchMessages(roomId: string): Promise<ChatMessage[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('chat_messages').select('*')
    .eq('room_id', roomId).order('created_at', { ascending: true }).limit(MAX);
  return ((data ?? []) as ChatRow[]).map(toMessage);
}

export async function sendMessage(roomId: string, meId: string, text: string): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed || !supabase) return;
  await supabase.from('chat_messages').insert({
    room_id: roomId, player_id: meId, kind: 'user', text: trimmed,
  });
}

/** System notices are host-authored via RPC; needs the room code, not id. */
export async function sendSystem(code: string, text: string): Promise<void> {
  await supabase?.rpc('send_system', { p_code: code, p_text: text });
}

export async function toggleReaction(messageId: string, emoji: string): Promise<void> {
  await supabase?.rpc('toggle_reaction', { p_message: messageId, p_emoji: emoji });
}

export function subscribeChat(roomId: string, onChange: () => void): () => void {
  const client = supabase;
  if (!client) return () => {};
  const channel = client
    .channel(`chat:${roomId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${roomId}` }, onChange)
    .subscribe();
  return () => { client.removeChannel(channel); };
}
