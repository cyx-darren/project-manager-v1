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
if (!supabaseUrl.match(/^https:\/\/[a-z0-9]+\.supabase\.co$/)) {
  console.warn('Supabase URL format may be incorrect:', supabaseUrl)
}

console.log('🔗 Supabase Configuration:', {
  url: supabaseUrl,
  keyLength: supabaseAnonKey.length,
  environment: import.meta.env.NODE_ENV || 'development'
})

// Create Supabase client with TypeScript support
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Disable localhost redirects in production
    redirectTo: isProduction ? undefined : 'http://localhost:5173'
  },
  // Disable realtime in production if causing issues
  realtime: {
    params: {
      eventsPerSecond: isProduction ? 5 : 10
    }
  }
})

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