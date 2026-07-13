import { useEffect, useState } from 'react';
import type { ChatMessage } from '@/types';

/** Counts new user messages received while the chat panel is closed. */
export function useUnreadChat(messages: ChatMessage[], meId: string, isOpen: boolean): number {
  const [seenThrough, setSeenThrough] = useState(() => Date.now());

  useEffect(() => {
    if (!isOpen) return;
    const latestTimestamp = messages.reduce((latest, message) => Math.max(latest, message.ts), 0);
    setSeenThrough(Math.max(Date.now(), latestTimestamp));
  }, [isOpen, messages]);

  if (isOpen) return 0;
  return messages.filter(
    (message) => message.kind === 'user' && message.who !== meId && message.ts > seenThrough,
  ).length;
}
