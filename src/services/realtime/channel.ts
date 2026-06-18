// Cross-tab channel — a thin BroadcastChannel wrapper used as the realtime
// transport for the prototype. Same-origin browser tabs share one channel per
// name, giving genuine multi-client sync (open two tabs to test) with no server.
//
// This is the seam the production Socket.io transport replaces: swap the
// implementation behind `createChannel` (or provide a SocketRealtimeService that
// satisfies the same shape) and callers stay unchanged.

export interface CrossTabChannel<TMessage = unknown> {
  /** Broadcast a message to every other tab subscribed to this channel name. */
  post: (message: TMessage) => void;
  /** Subscribe to messages; returns an unsubscribe fn. */
  subscribe: (handler: (message: TMessage) => void) => () => void;
  close: () => void;
}

const SUPPORTED = typeof BroadcastChannel !== 'undefined';

/**
 * Create a named cross-tab channel. Falls back to a no-op channel when
 * BroadcastChannel is unavailable (the localStorage `storage` event still
 * provides a sync path in that case).
 */
export function createChannel<TMessage = unknown>(name: string): CrossTabChannel<TMessage> {
  if (!SUPPORTED) {
    return { post: () => {}, subscribe: () => () => {}, close: () => {} };
  }

  const bc = new BroadcastChannel(name);
  return {
    post: (message) => {
      try { bc.postMessage(message); } catch { /* channel closing */ }
    },
    subscribe: (handler) => {
      const listener = (e: MessageEvent) => handler(e.data as TMessage);
      bc.addEventListener('message', listener);
      return () => bc.removeEventListener('message', listener);
    },
    close: () => {
      try { bc.close(); } catch { /* already closed */ }
    },
  };
}
