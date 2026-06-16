import type { ReactNode } from 'react';

export interface SystemMessageProps {
  children: ReactNode;
}

/**
 * SystemMessage — centred system notice in a chat stream ("Mint joined",
 * "Round started"). Game-agnostic; the engine emits these later.
 */
export function SystemMessage({ children }: SystemMessageProps) {
  return <div className="bubble bubble-sys" role="status">{children}</div>;
}
