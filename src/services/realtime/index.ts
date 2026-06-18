// Realtime services — transport-agnostic room/chat sync (cross-tab today,
// Socket.io-ready). See channel.ts and types.ts.
export { createChannel } from './channel';
export type { CrossTabChannel } from './channel';
export type {
  SyncedRoom, RealtimeRoomMessage, RealtimeChatMessage, RealtimeService,
} from './types';
