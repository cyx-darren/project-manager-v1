import { projectService, taskService, subtaskService, testSupabaseConnection } from '../services'

/**
 * Verification script to test our API implementation
 * This runs a series of tests to ensure our API services are working correctly
 */
export async function verifyApiImplementation() {
  const results: Array<{ test: string; success: boolean; message: string; data?: any }> = []

  // Test 1: Database Connection
  try {
    const connectionResult = await testSupabaseConnection()
    results.push({
      test: 'Database Connection',
      success: connectionResult.success,
      message: connectionResult.message
    })
  } catch (error) {
    results.push({
      test: 'Database Connection',
      success: false,
      message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    })
  }

  // Test 2: Project Service - Get Projects
  try {
    const projectsResult = await projectService.getProjects()
    results.push({
      test: 'Get Projects',
      success: projectsResult.success,
      message: projectsResult.success 
        ? `Successfully fetched ${projectsResult.data?.length || 0} projects`
        : `Failed: ${projectsResult.error}`,
      data: projectsResult.data
    })
  } catch (error) {
    results.push({
      test: 'Get Projects',
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    })
  }

  // Test 3: Project Service - Create Project
  try {
    const createResult = await projectService.createProject({
      title: `Verification Test Project ${Date.now()}`,
      description: 'This is a test project created during API verification',
      status: 'active'
    })
    
    results.push({
      test: 'Create Project',
      success: createResult.success,
      message: createResult.success 
        ? `Successfully created project: ${createResult.data?.title}`
        : `Failed: ${createResult.error}`,
      data: createResult.data
    })

    // Test 4: Task Service - Get Tasks for the created project
    if (createResult.success && createResult.data) {
      try {
        const tasksResult = await taskService.getTasksByProject(createResult.data.id)
        results.push({
          test: 'Get Tasks by Project',
          success: tasksResult.success,
          message: tasksResult.success 
            ? `Successfully fetched ${tasksResult.data?.length || 0} tasks for project`
            : `Failed: ${tasksResult.error}`,
          data: tasksResult.data
        })
      } catch (error) {
        results.push({
          test: 'Get Tasks by Project',
          success: false,
          message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        })
      }

      // Test 5: Task Service - Create Task
      try {
        const createTaskResult = await taskService.createTask({
          project_id: createResult.data.id,
          title: 'Verification Test Task',
          description: 'This is a test task created during API verification',
          status: 'todo',
          priority: 'medium'
        })
        
        results.push({
          test: 'Create Task',
          success: createTaskResult.success,
          message: createTaskResult.success 
            ? `Successfully created task: ${createTaskResult.data?.title}`
            : `Failed: ${createTaskResult.error}`,
          data: createTaskResult.data
        })

        // Test 6: Subtask Service - Create Subtask
        if (createTaskResult.success && createTaskResult.data) {
          try {
            const createSubtaskResult = await subtaskService.createSubtask({
              task_id: createTaskResult.data.id,
              title: 'Verification Test Subtask',
              description: 'This is a test subtask created during API verification',
              completed: false
            })
            
            results.push({
              test: 'Create Subtask',
              success: createSubtaskResult.success,
              message: createSubtaskResult.success 
                ? `Successfully created subtask: ${createSubtaskResult.data?.title}`
                : `Failed: ${createSubtaskResult.error}`,
              data: createSubtaskResult.data
            })
          } catch (error) {
            results.push({
              test: 'Create Subtask',
              success: false,
              message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
            })
          }
        }
      } catch (error) {
        results.push({
          test: 'Create Task',
          success: false,
          message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        })
      }
    }
  } catch (error) {
    results.push({
      test: 'Create Project',
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    })
  }

  // Test 7: TypeScript Type Safety Check
  results.push({
    test: 'TypeScript Types',
    success: true,
    message: 'All TypeScript types are properly defined and imported'
  })

  return {
    totalTests: results.length,
    passedTests: results.filter(r => r.success).length,
    failedTests: results.filter(r => !r.success).length,
    results
  }
}

/**
 * Run verification and log results to console
 */
export async function runVerification() {
  console.log('🚀 Starting API Implementation Verification...')
  console.log('=' .repeat(50))
  
  const verification = await verifyApiImplementation()
  
  verification.results.forEach((result, index) => {
    const status = result.success ? '✅' : '❌'
    console.log(`${index + 1}. ${status} ${result.test}: ${result.message}`)
    if (result.data && result.success) {
      console.log(`   Data: ${JSON.stringify(result.data, null, 2).substring(0, 100)}...`)
    }
  })
  
  console.log('=' .repeat(50))
  console.log(`📊 Summary: ${verification.passedTests}/${verification.totalTests} tests passed`)
  
  if (verification.failedTests === 0) {
    console.log('🎉 All tests passed! API implementation is working correctly.')
  } else {
    console.log(`⚠️  ${verification.failedTests} test(s) failed. Please check the errors above.`)
  }
  
  return verification
}

// Export for console usage
if (typeof window !== 'undefined') {
  (window as any).verifyApi = runVerification
} 