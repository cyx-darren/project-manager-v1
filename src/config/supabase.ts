import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase'

// Environment variable validation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable')
}

// Create Supabase client with TypeScript support
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
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
    const { error } = await supabase.from('projects').select('id').limit(1)
    if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist, which is expected
      throw error
    }
    return { success: true, message: 'Supabase connection successful' }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, message: `Supabase connection failed: ${errorMessage}` }
  }
} 