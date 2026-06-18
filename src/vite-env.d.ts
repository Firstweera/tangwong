/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Supabase project URL (Project Settings → API). */
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase anon/public key. */
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** Phase 4.5.2 transport switch: 'true' → Supabase, else cross-tab. */
  readonly VITE_USE_SUPABASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
