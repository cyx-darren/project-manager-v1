import { testSupabaseConnection } from '../config/supabase.js'

/**
 * Test Supabase connection and log results
 * This function can be called during development to verify the setup
 */
export const runSupabaseConnectionTest = async () => {
  console.log('🔍 Testing Supabase connection...')
  
  try {
    const result = await testSupabaseConnection()
    
    if (result.success) {
      console.log('✅ Supabase connection test passed:', result.message)
      return true
    } else {
      console.error('❌ Supabase connection test failed:', result.message)
      return false
    }
  } catch (error) {
    console.error('❌ Supabase connection test error:', error.message)
    return false
  }
}

// Auto-run test in development mode
if (import.meta.env.DEV) {
  runSupabaseConnectionTest()
} 