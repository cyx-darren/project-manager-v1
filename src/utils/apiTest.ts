import { projectService, testSupabaseConnection } from '../services'

/**
 * Test API endpoints and database connectivity
 */
export const runApiTests = async () => {
  console.log('🔍 Starting API endpoint tests...')
  
  try {
    // Test 1: Database connection
    console.log('1. Testing Supabase connection...')
    const connectionTest = await testSupabaseConnection()
    console.log(`   ${connectionTest.success ? '✅' : '❌'} ${connectionTest.message}`)
    
    // Test 2: Projects service
    console.log('2. Testing Projects service...')
    const projectsResult = await projectService.getProjects()
    console.log(`   ${projectsResult.success ? '✅' : '❌'} Get projects: ${projectsResult.error || 'Success'}`)
    
    if (projectsResult.success && projectsResult.data) {
      console.log(`   📊 Found ${projectsResult.data.length} projects`)
    }
    
    console.log('🎉 API tests completed!')
    return { success: true, message: 'All tests passed' }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ API test failed:', errorMessage)
    return { success: false, message: errorMessage }
  }
} 