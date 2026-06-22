// Supabase backend — barrel. Auth + profiles (Phase 4.5.1), room + chat
// services (Phase 4.5.2), and game read/action transport (Phase 4.5.3).
export { supabase, isSupabaseEnabled, useSupabaseTransport } from './client';
export { ensureSession, onAuthChange, isAnonymous, linkGoogle } from './auth';
export { fetchProfile, upsertProfile } from './profiles';
export type { ProfileRow } from './profiles';
export * as roomService from './rooms';
export * as chatService from './chat';
export * as gameService from './game';
