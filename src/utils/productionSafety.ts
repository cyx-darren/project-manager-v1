/**
 * Production Safety Utilities
 * 
 * This module provides utilities to ensure the app behaves correctly in production
 * and prevents localhost connections or development-only features from running.
 */

// Environment detection
export const isProduction = (): boolean => {
  return import.meta.env.NODE_ENV === 'production'
}

export const isDevelopment = (): boolean => {
  return import.meta.env.NODE_ENV === 'development'
}

// Feature flags for production safety
export const PRODUCTION_FEATURES = {
  REALTIME_ENABLED: import.meta.env.VITE_ENABLE_REAL_TIME !== 'false' && !isProduction(),
  ANALYTICS_ENABLED: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  NOTIFICATIONS_ENABLED: import.meta.env.VITE_ENABLE_NOTIFICATIONS !== 'false',
  TASK_AI_ENABLED: import.meta.env.VITE_ENABLE_TASK_AI === 'true' && !isProduction(),
  DEBUG_LOGGING: isDevelopment(),
}

// Validate that no localhost URLs are being used in production
export const validateProductionUrls = (): void => {
  if (!isProduction()) return

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const baseUrl = import.meta.env.VITE_BASE_URL

  // Check for localhost in critical URLs
  const localhostPatterns = ['localhost', '127.0.0.1', '::1']
  
  if (supabaseUrl && localhostPatterns.some(pattern => supabaseUrl.includes(pattern))) {
    throw new Error(`Production environment cannot use localhost URLs. Found: ${supabaseUrl}`)
  }

  if (baseUrl && localhostPatterns.some(pattern => baseUrl.includes(pattern))) {
    throw new Error(`Production environment cannot use localhost URLs. Found: ${baseUrl}`)
  }

  console.log('✅ Production URL validation passed')
}

// Safe console logging that only works in development
export const safeLog = (message: string, ...args: any[]): void => {
  if (PRODUCTION_FEATURES.DEBUG_LOGGING) {
    console.log(`[DEBUG] ${message}`, ...args)
  }
}

export const safeError = (message: string, ...args: any[]): void => {
  if (PRODUCTION_FEATURES.DEBUG_LOGGING) {
    console.error(`[ERROR] ${message}`, ...args)
  } else {
    // In production, just log errors to console without debug info
    console.error(message)
  }
}

export const safeWarn = (message: string, ...args: any[]): void => {
  if (PRODUCTION_FEATURES.DEBUG_LOGGING) {
    console.warn(`[WARN] ${message}`, ...args)
  } else {
    console.warn(message)
  }
}

// Disable features that might cause localhost connections in production
export const isFeatureEnabled = (feature: keyof typeof PRODUCTION_FEATURES): boolean => {
  return PRODUCTION_FEATURES[feature]
}

// Safe real-time subscription wrapper
export const safeRealtimeSubscription = (callback: () => void): void => {
  if (PRODUCTION_FEATURES.REALTIME_ENABLED) {
    safeLog('🔗 Enabling real-time features')
    callback()
  } else {
    safeLog('🔇 Real-time features disabled in production')
  }
}

// Environment variable validation
export const validateEnvironmentVariables = (): void => {
  const requiredVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY'
  ]

  const missing: string[] = []

  requiredVars.forEach(varName => {
    if (!import.meta.env[varName]) {
      missing.push(varName)
    }
  })

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  // Validate Supabase URL format
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  if (supabaseUrl && !supabaseUrl.match(/^https:\/\/[a-z0-9]+\.supabase\.co$/)) {
    safeWarn('Supabase URL format may be incorrect:', supabaseUrl)
  }

  // Production-specific validation
  if (isProduction()) {
    validateProductionUrls()
    
    // Warn about missing optional production variables
    const optionalProdVars = ['VITE_BASE_URL', 'VITE_APP_NAME']
    optionalProdVars.forEach(varName => {
      if (!import.meta.env[varName]) {
        safeWarn(`Missing optional production variable: ${varName}`)
      }
    })
  }

  console.log('✅ Environment variables validated')
}

// Initialize production safety checks
export const initializeProductionSafety = (): void => {
  try {
    validateEnvironmentVariables()
    
    if (isProduction()) {
      console.log('🔒 Production mode enabled')
      console.log('🔇 Real-time features:', PRODUCTION_FEATURES.REALTIME_ENABLED ? 'enabled' : 'disabled')
      console.log('📊 Analytics:', PRODUCTION_FEATURES.ANALYTICS_ENABLED ? 'enabled' : 'disabled')
    } else {
      console.log('🔧 Development mode enabled')
    }
  } catch (error) {
    console.error('❌ Production safety initialization failed:', error)
    throw error
  }
} 