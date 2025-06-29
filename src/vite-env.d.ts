interface ImportMetaEnv {
  // Standard Vite environment variables
  readonly DEV: boolean
  readonly PROD: boolean
  readonly MODE: string
  readonly BASE_URL: string
  readonly SSR: boolean
  
  // Project-specific environment variables
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
  
  // Index signature for dynamic access
  readonly [key: string]: any
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
