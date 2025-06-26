// Permission Service Foundation Test
import { permissionService } from '../services/permissionService'
import type { 
  Permission, 
  ProjectPermission, 
  WorkspacePermission,
  PermissionContext
} from '../types/permissions'

/**
 * Test the permission service foundation
 */
export const testPermissionServiceFoundation = async () => {
  console.log('🔐 Testing Permission Service Foundation...')
  
  const testUserId = 'test-user-123'
  const testProjectId = 'test-project-456'
  const testWorkspaceId = 'test-workspace-789'
  
  const results = {
    basicPermissionCheck: false,
    projectPermissionCheck: false,
    workspacePermissionCheck: false,
    permissionSummary: false,
    cacheTest: false,
    errors: [] as string[]
  }

  try {
    // Test 1: Basic permission check
    console.log('Testing basic permission check...')
    const basicResult = await permissionService.hasPermission(
      testUserId, 
      'workspace.create'
    )
    results.basicPermissionCheck = typeof basicResult.hasPermission === 'boolean'
    console.log(`✅ Basic permission check: ${results.basicPermissionCheck}`)

    // Test 2: Project context permission check
    console.log('Testing project permission check...')
    const projectContext: PermissionContext = { projectId: testProjectId }
    const projectResult = await permissionService.hasPermission(
      testUserId,
      'project.view',
      projectContext
    )
    results.projectPermissionCheck = typeof projectResult.hasPermission === 'boolean'
    console.log(`✅ Project permission check: ${results.projectPermissionCheck}`)

    // Test 3: Workspace context permission check
    console.log('Testing workspace permission check...')
    const workspaceContext: PermissionContext = { workspaceId: testWorkspaceId }
    const workspaceResult = await permissionService.hasPermission(
      testUserId,
      'workspace.view',
      workspaceContext
    )
    results.workspacePermissionCheck = typeof workspaceResult.hasPermission === 'boolean'
    console.log(`✅ Workspace permission check: ${results.workspacePermissionCheck}`)

    // Test 4: Permission summary
    console.log('Testing permission summary...')
    const summary = await permissionService.getPermissionSummary(testUserId, {
      projectId: testProjectId,
      workspaceId: testWorkspaceId
    })
    results.permissionSummary = Array.isArray(summary.permissions) && 
                                Array.isArray(summary.canManage)
    console.log(`✅ Permission summary: ${results.permissionSummary}`)

    // Test 5: Cache functionality
    console.log('Testing cache functionality...')
    const permissions1 = await permissionService.getUserPermissions(testUserId)
    const permissions2 = await permissionService.getUserPermissions(testUserId)
    results.cacheTest = Array.isArray(permissions1) && Array.isArray(permissions2)
    console.log(`✅ Cache test: ${results.cacheTest}`)

    // Test cache clearing
    permissionService.clearCache(testUserId)
    permissionService.clearAllCache()
    console.log('✅ Cache clearing: working')

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    results.errors.push(errorMessage)
    console.error('❌ Test error:', errorMessage)
  }

  // Summary
  const allTestsPassed = results.basicPermissionCheck && 
                        results.projectPermissionCheck && 
                        results.workspacePermissionCheck && 
                        results.permissionSummary && 
                        results.cacheTest &&
                        results.errors.length === 0

  console.log('\n📊 Test Results Summary:')
  console.log('========================')
  console.log(`Basic Permission Check: ${results.basicPermissionCheck ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`Project Permission Check: ${results.projectPermissionCheck ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`Workspace Permission Check: ${results.workspacePermissionCheck ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`Permission Summary: ${results.permissionSummary ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`Cache Test: ${results.cacheTest ? '✅ PASS' : '❌ FAIL'}`)
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors Found:')
    results.errors.forEach(error => console.log(`  - ${error}`))
  }

  console.log(`\n${allTestsPassed ? '🎉 All tests passed!' : '⚠️  Some tests failed'}`)
  
  return {
    success: allTestsPassed,
    results,
    summary: {
      passed: Object.values(results).filter(r => r === true).length,
      failed: Object.values(results).filter(r => r === false).length,
      errors: results.errors.length
    }
  }
}

/**
 * Test permission type guards and utility functions
 */
export const testPermissionTypes = () => {
  console.log('\n🔍 Testing Permission Types and Utilities...')
  
  const {
    isProjectPermission,
    isWorkspacePermission,
    isGlobalPermission,
    getPermissionsForProjectRole,
    getPermissionsForWorkspaceRole,
    hasProjectRolePermission,
    hasWorkspaceRolePermission
  } = require('../types/permissions')

  const results = {
    typeGuards: false,
    projectRolePermissions: false,
    workspaceRolePermissions: false,
    errors: [] as string[]
  }

  try {
    // Test type guards
    const projectPerm: Permission = 'project.view'
    const workspacePerm: Permission = 'workspace.edit'
    const globalPerm: Permission = 'system.admin'

    results.typeGuards = isProjectPermission(projectPerm) &&
                        isWorkspacePermission(workspacePerm) &&
                        isGlobalPermission(globalPerm)
    console.log(`✅ Type guards: ${results.typeGuards}`)

    // Test project role permissions
    const ownerPerms = getPermissionsForProjectRole('owner')
    const memberPerms = getPermissionsForProjectRole('member')
    results.projectRolePermissions = Array.isArray(ownerPerms) && 
                                    Array.isArray(memberPerms) &&
                                    ownerPerms.length > memberPerms.length &&
                                    hasProjectRolePermission('owner', 'project.delete') &&
                                    !hasProjectRolePermission('viewer', 'project.delete')
    console.log(`✅ Project role permissions: ${results.projectRolePermissions}`)

    // Test workspace role permissions
    const workspaceOwnerPerms = getPermissionsForWorkspaceRole('owner')
    const workspaceMemberPerms = getPermissionsForWorkspaceRole('member')
    results.workspaceRolePermissions = Array.isArray(workspaceOwnerPerms) && 
                                      Array.isArray(workspaceMemberPerms) &&
                                      workspaceOwnerPerms.length > workspaceMemberPerms.length &&
                                      hasWorkspaceRolePermission('owner', 'workspace.delete') &&
                                      !hasWorkspaceRolePermission('viewer', 'workspace.delete')
    console.log(`✅ Workspace role permissions: ${results.workspaceRolePermissions}`)

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    results.errors.push(errorMessage)
    console.error('❌ Type test error:', errorMessage)
  }

  const allTestsPassed = results.typeGuards && 
                        results.projectRolePermissions && 
                        results.workspaceRolePermissions &&
                        results.errors.length === 0

  console.log(`\n${allTestsPassed ? '🎉 All type tests passed!' : '⚠️  Some type tests failed'}`)
  
  return {
    success: allTestsPassed,
    results
  }
}

/**
 * Run all permission foundation tests
 */
export const runAllPermissionTests = async () => {
  console.log('🚀 Running All Permission Foundation Tests...')
  console.log('==============================================\n')
  
  const serviceTest = await testPermissionServiceFoundation()
  const typeTest = testPermissionTypes()
  
  const overallSuccess = serviceTest.success && typeTest.success
  
  console.log('\n🏁 Final Results:')
  console.log('==================')
  console.log(`Service Tests: ${serviceTest.success ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`Type Tests: ${typeTest.success ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`Overall: ${overallSuccess ? '🎉 SUCCESS' : '⚠️  NEEDS ATTENTION'}`)
  
  return {
    success: overallSuccess,
    serviceTest,
    typeTest
  }
} 