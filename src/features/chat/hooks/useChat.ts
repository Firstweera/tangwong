import { useState, useCallback, useEffect, useRef } from 'react';
import type { ChatMessage } from '@/types';
import { createChannel } from '@/services/realtime';
import type { CrossTabChannel, RealtimeChatMessage } from '@/services/realtime';
import { useSupabaseTransport, chatService } from '@/services/supabase';
import {
  loadMessages, saveMessages, clearMessages,
  createUserMessage, createSystemMessage,
} from '../stores/chatStorage';

export interface UseChatReturn {
  messages: ChatMessage[];
  /** Append a message from the current player. No-ops on empty text. */
  sendMessage: (text: string) => void;
  /** Append a system notice (joins, ready, round start, …). */
  sendSystem: (text: string) => void;
  /** Toggle the current player's reaction with `emoji` on a message. */
  toggleReaction: (messageId: string, emoji: string) => void;
  clear: () => void;
}

/**
 * useChat — room chat. Transport is selected by `useSupabaseTransport`: Supabase
 * (chat_messages table + realtime) or cross-tab (localStorage + BroadcastChannel).
 * `roomId` is the room's id in both cases; `code` is needed only for host-authored
 * system messages over Supabase RPC.
 */
export function useChat(roomId: string, meId: string, code?: string): UseChatReturn {
  // Build-time transport flag — branch is stable across renders (hooks-safe).
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useSupabaseTransport ? useSupabaseChat(roomId, meId, code) : useCrossTabChat(roomId, meId);
}

// ─── Supabase transport (Phase 4.5.2) ───────────────────────────────────────

// A real rooms.id is a UUID; the optimistic seed uses a local `room_…` id. Chat
// keys off rooms.id (a uuid column), so we must wait for the synced UUID before
// touching the chat_messages table — otherwise Postgres rejects the seed id (400)
// and send_system fails because the room doesn't exist server-side yet.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function useSupabaseChat(roomId: string, meId: string, code?: string): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const ready = UUID_RE.test(roomId);

  const refresh = useCallback(() => {
    if (!ready) return;
    void chatService.fetchMessages(roomId).then(setMessages);
  }, [roomId, ready]);

  useEffect(() => {
    if (!ready) return;
    refresh();
    const unsub = chatService.subscribeChat(roomId, refresh);
    return unsub;
  }, [roomId, ready, refresh]);

  const sendMessage = useCallback((text: string) => {
    if (!ready) return;
    void chatService.sendMessage(roomId, meId, text).then(refresh);
  }, [roomId, meId, ready, refresh]);
  const sendSystem = useCallback((text: string) => {
    if (!ready || !code) return;
    void chatService.sendSystem(code, text).then(refresh);
  }, [code, ready, refresh]);
  const toggleReaction = useCallback((messageId: string, emoji: string) => {
    if (!ready) return;
    void chatService.toggleReaction(messageId, emoji).then(refresh);
  }, [ready, refresh]);
  const clear = useCallback(() => {}, []); // server chat isn't locally clearable

  return { messages, sendMessage, sendSystem, toggleReaction, clear };
}

// ─── Cross-tab transport (localStorage + BroadcastChannel) ───────────────────

function useCrossTabChat(roomId: string, meId: string): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadMessages(roomId));
  // Latest messages, for mutators that compute the next list without a stale closure.
  const ref = useRef(messages);
  ref.current = messages;
  const channelRef = useRef<CrossTabChannel<RealtimeChatMessage> | null>(null);

  useEffect(() => {
    setMessages(loadMessages(roomId));

    const channel = createChannel<RealtimeChatMessage>(`tw_chat:${roomId}`);
    channelRef.current = channel;
    const reload = () => setMessages(loadMessages(roomId));
    const unsub = channel.subscribe(reload);

    const onStorage = (e: StorageEvent) => { if (e.key === `tw_chat_${roomId}`) reload(); };
    window.addEventListener('storage', onStorage);

    return () => {
      unsub();
      channel.close();
      channelRef.current = null;
      window.removeEventListener('storage', onStorage);
    };
  }, [roomId]);

  // Persist + publish a new message list to this and other tabs.
  const commit = useCallback((next: ChatMessage[]) => {
    saveMessages(roomId, next);
    setMessages(next);
    channelRef.current?.post({ type: 'chat:update' });
  }, [roomId]);

  const sendMessage = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    commit([...ref.current, createUserMessage(meId, trimmed)]);
  }, [commit, meId]);

  const sendSystem = useCallback((text: string) => {
    commit([...ref.current, createSystemMessage(text)]);
  }, [commit]);

  const toggleReaction = useCallback((messageId: string, emoji: string) => {
    const next = ref.current.map(m => {
      if (m.id !== messageId) return m;
      const reactions = [...m.reactions];
      const idx = reactions.findIndex(r => r.emoji === emoji);
      if (idx === -1) {
        reactions.push({ emoji, by: [meId] });
      } else {
        const r = reactions[idx];
        const nextBy = r.by.includes(meId)
          ? r.by.filter(id => id !== meId)
          : [...r.by, meId];
        if (nextBy.length === 0) reactions.splice(idx, 1);
        else reactions[idx] = { ...r, by: nextBy };
      }
      return { ...m, reactions };
    });
    commit(next);
  }, [commit, meId]);

  const clear = useCallback(() => {
    clearMessages(roomId);
    commit([]);
  }, [commit, roomId]);

  return { messages, sendMessage, sendSystem, toggleReaction, clear };
}
