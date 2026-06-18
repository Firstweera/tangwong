import type { ReactNode } from 'react';
import { formatChatTime } from '@/features/chat';

export interface SystemMessageProps {
  children: ReactNode;
  /** Epoch-ms timestamp; appends a short time when provided. */
  ts?: number;
}

/**
 * SystemMessage — centred system notice in a chat stream ("Mint joined",
 * "Round started"). Game-agnostic; the engine emits these later.
 */
export function SystemMessage({ children, ts }: SystemMessageProps) {
  return (
    <div className="bubble bubble-sys" role="status">
      {children}
      {ts != null && <span className="tiny" style={{ color: 'var(--muted)', marginLeft: 6 }}>{formatChatTime(ts)}</span>}
    </div>
  );
}
