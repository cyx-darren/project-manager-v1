import { collaborationService } from '../services'

/**
 * Test collaboration API endpoints
 */
export const runCollaborationTests = async () => {
  console.log('🤝 Starting Collaboration API tests...')
  
  try {
    // Test 1: Get recent activity (should work for authenticated users)
    console.log('1. Testing get recent activity...')
    const activityResult = await collaborationService.getRecentActivity(5)
    console.log(`   ${activityResult.success ? '✅' : '❌'} Get recent activity: ${activityResult.error || 'Success'}`)
    
    if (activityResult.success && activityResult.data) {
      console.log(`   📊 Found ${activityResult.data.length} recent activities`)
    }

    // Test 2: Test error handling with invalid data
    console.log('2. Testing error handling...')
    const invalidCommentResult = await collaborationService.getComments('invalid_type', 'invalid_id')
    console.log(`   ${!invalidCommentResult.success ? '✅' : '❌'} Error handling: ${invalidCommentResult.error || 'Should have failed'}`)

    // Test 3: Test basic activity logging (if we have a valid project)
    console.log('3. Testing activity logging...')
    try {
      // This will likely fail due to permissions, but we can test the structure
      const logResult = await collaborationService.logActivity({
        user_id: 'test-user',
        project_id: 'test-project',
        entity_type: 'test',
        entity_id: 'test-entity',
        action: 'created',
        details: { test: true }
      })
      console.log(`   ${logResult.success ? '✅' : '❌'} Activity logging: ${logResult.error || 'Success'}`)
    } catch (error) {
      console.log(`   ⚠️ Activity logging: Expected error - ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    console.log('🎉 Collaboration API tests completed!')
    return { success: true, message: 'Collaboration tests completed' }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Collaboration test failed:', errorMessage)
    return { success: false, message: errorMessage }
  }
}

/**
 * Test specific collaboration features with real data
 */
export const testCollaborationFeatures = async (projectId?: string) => {
  console.log('🧪 Testing collaboration features with real data...')
  
  if (!projectId) {
    console.log('❌ No project ID provided for testing')
    return { success: false, message: 'Project ID required for feature testing' }
  }

  try {
    // Test project activity
    console.log('1. Testing project activity...')
    const activityResult = await collaborationService.getProjectActivity(projectId, 1, 10)
    console.log(`   ${activityResult.success ? '✅' : '❌'} Project activity: ${activityResult.error || `Found ${activityResult.data?.length || 0} activities`}`)

    // Test project invitations (if user has permission)
    console.log('2. Testing project invitations...')
    const invitationsResult = await collaborationService.getProjectInvitations(projectId)
    console.log(`   ${invitationsResult.success ? '✅' : '❌'} Project invitations: ${invitationsResult.error || `Found ${invitationsResult.data?.length || 0} invitations`}`)

    // Test comments for project
    console.log('3. Testing project comments...')
    const commentsResult = await collaborationService.getComments('project', projectId)
    console.log(`   ${commentsResult.success ? '✅' : '❌'} Project comments: ${commentsResult.error || `Found ${commentsResult.data?.length || 0} comments`}`)

    // Test attachments for project
    console.log('4. Testing project attachments...')
    const attachmentsResult = await collaborationService.getAttachments('project', projectId)
    console.log(`   ${attachmentsResult.success ? '✅' : '❌'} Project attachments: ${attachmentsResult.error || `Found ${attachmentsResult.data?.length || 0} attachments`}`)

    return { success: true, message: 'Feature tests completed' }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Feature test failed:', errorMessage)
    return { success: false, message: errorMessage }
  }
} 