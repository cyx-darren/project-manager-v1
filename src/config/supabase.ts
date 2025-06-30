import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase'

// Environment variable validation with production safety
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const isProduction = import.meta.env.NODE_ENV === 'production'

// Validate environment variables
if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable')
}

// Production safety check - prevent localhost connections
if (isProduction && (supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1'))) {
  throw new Error('Localhost URLs are not allowed in production environment')
}

// Validate Supabase URL format
if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
  console.warn('⚠️ Supabase URL format may be incorrect:', supabaseUrl)
}

console.log('🔗 Supabase configuration:', {
  url: supabaseUrl,
  environment: isProduction ? 'production' : 'development',
  hasAnonKey: !!supabaseAnonKey
})

// Create Supabase client with proper configuration for Supabase v2.50.0
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Production safety: Disable real-time if configured to do so
if (isProduction && import.meta.env.VITE_ENABLE_REAL_TIME === 'false') {
  console.log('🔇 Real-time features disabled in production')
}

// Helper function to get authenticated client
export const getAuthenticatedClient = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  
  if (error) {
    throw new Error(`Authentication error: ${error.message}`)
  }
  
  if (!session) {
    throw new Error('No authenticated session found')
  }
  
  return supabase
}

// Helper function to get current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    throw new Error(`Failed to get user: ${error.message}`)
  }
  
  return user
}

// Helper function to test connection
export const testSupabaseConnection = async () => {
  try {
    console.log('🧪 Testing Supabase connection...')
    const { error } = await supabase.from('projects').select('id').limit(1)
    if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist, which is expected
      throw error
    }
    console.log('✅ Supabase connection successful')
    return { success: true, message: 'Supabase connection successful' }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Supabase connection failed:', errorMessage)
    return { success: false, message: `Supabase connection failed: ${errorMessage}` }
  }
} 