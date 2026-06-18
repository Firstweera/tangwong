// Chat persistence — localStorage scoped per room, mirroring the guestStorage
// pattern. Ephemeral by nature, but persisting keeps a refreshed/reconnected
// player's conversation intact (reconnection-friendly). Swapped for Socket.io
// transport in Epic 4 without touching callers.
import type { ChatMessage } from '@/types';

const STORAGE_PREFIX = 'tw_chat_';
// Cap stored history so a long-running room can't blow the localStorage quota.
const MAX_MESSAGES = 200;

function storageKey(roomId: string): string {
  return `${STORAGE_PREFIX}${roomId}`;
}

export function generateMessageId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = 'msg_';
  for (let i = 0; i < 10; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

export function createUserMessage(who: string, text: string): ChatMessage {
  return { id: generateMessageId(), kind: 'user', who, text, ts: Date.now(), reactions: [] };
}

export function createSystemMessage(text: string): ChatMessage {
  return { id: generateMessageId(), kind: 'system', who: '', text, ts: Date.now(), reactions: [] };
}

export function loadMessages(roomId: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(storageKey(roomId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as ChatMessage[];
    }
  } catch {
    // localStorage unavailable or corrupt — start with an empty room
  }
  return [];
}

export function saveMessages(roomId: string, messages: ChatMessage[]): void {
  try {
    const trimmed = messages.slice(-MAX_MESSAGES);
    localStorage.setItem(storageKey(roomId), JSON.stringify(trimmed));
  } catch {
    // ignore write errors (private browsing, storage full)
  }
}

export function clearMessages(roomId: string): void {
  try {
    localStorage.removeItem(storageKey(roomId));
  } catch {
    // ignore
  }
}
