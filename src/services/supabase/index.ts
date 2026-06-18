// Supabase backend — barrel. Auth + profiles (Phase 4.5.1) and room + chat
// services (Phase 4.5.2). Game services arrive in a later phase.
export { supabase, isSupabaseEnabled, useSupabaseTransport } from './client';
export { ensureSession, onAuthChange, isAnonymous, linkGoogle } from './auth';
export { fetchProfile, upsertProfile } from './profiles';
export type { ProfileRow } from './profiles';
export * as roomService from './rooms';
export * as chatService from './chat';
