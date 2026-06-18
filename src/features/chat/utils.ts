// Chat presentation helpers.

/** Format an epoch-ms timestamp as a short 24h time (e.g. "14:05"). */
export function formatChatTime(ts: number): string {
  try {
    return new Date(ts).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}
