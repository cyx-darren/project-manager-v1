import { createClient } from '@supabase/supabase-js'

// Environment variable validation
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable')
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Helper function to test connection
export const testSupabaseConnection = async () => {
  try {
    const { error } = await supabase.from('_test').select('*').limit(1)
    if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist, which is expected
      throw error
    }
    return { success: true, message: 'Supabase connection successful' }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, message: `Supabase connection failed: ${errorMessage}` }
  }
} 