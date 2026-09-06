/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "true" = no backend/AI calls (hosted demo). Defaults to true in production builds. */
  readonly VITE_DEMO_MODE?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_SUPABASE_PROJECT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
