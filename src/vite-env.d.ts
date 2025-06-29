/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_BASE_URL: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
  readonly VITE_ENABLE_ANALYTICS: string
  readonly VITE_ENABLE_TASK_AI: string
  readonly VITE_ENABLE_REAL_TIME: string
  readonly VITE_ENABLE_NOTIFICATIONS: string
  readonly VITE_ENABLE_DARK_MODE: string
  readonly VITE_ENABLE_TEAM_FEATURES: string
  readonly NODE_ENV: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
