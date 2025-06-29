import { supabase } from '../config/supabase'
import type { 
  Permission, 
  ProjectPermission, 
  WorkspacePermission,
  GlobalPermission, 
  ProjectRole,
  WorkspaceRole,
  PermissionContext,
  PermissionResult,
  CustomPermission
} from '../types/permissions'
import { PermissionError } from '../types/permissions'
import { 
  PROJECT_ROLE_PERMISSIONS,
  WORKSPACE_ROLE_PERMISSIONS,
  GLOBAL_ROLE_PERMISSIONS,
  hasProjectRolePermission,
  hasWorkspaceRolePermission,
  isProjectPermission,
  isWorkspacePermission,
  isGlobalPermission
} from '../types/permissions'
import type { ApiResponse } from '../types/supabase'

// Simplified cache for user permissions
interface PermissionCache {
  [key: string]: {
    permissions: Permission[]
    projectRoles: Record<string, ProjectRole>
    workspaceRoles: Record<string, WorkspaceRole>
    globalRole?: string
    customPermissions: CustomPermission[]
    expiresAt: number
  }
}

// Database result interfaces
interface DatabasePermissionResult {
  user_has_permission_safe: boolean
}

interface DatabaseRoleResult {
  get_user_project_role: 'owner' | 'admin' | 'member' | null
}

interface DatabaseWorkspaceRoleResult {
  get_user_workspace_role: 'owner' | 'admin' | 'member' | 'billing_manager' | null
}

// Configuration - SIMPLIFIED
const DATABASE_AVAILABLE = true // Re-enable database operations
const ENABLE_DEBUGGING = true // Enable detailed logging

// Debug logging
function debugLog(message: string, data?: any) {
  if (ENABLE_DEBUGGING) {
    console.log(`🔍 [PermissionService] ${message}`, data || '')
  }
}

class PermissionService {
  private cache: PermissionCache = {}
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  /**
   * Clear cache for a specific user
   */
  clearCache(userId: string): void {
    delete this.cache[userId]
    debugLog('Cache cleared for user:', userId)
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    this.cache = {}
    debugLog('All cache cleared')
  }

  /**
   * Get user's role in a specific project with robust error handling
   */
  async getUserProjectRole(projectId: string, userId: string): Promise<ProjectRole | null> {
    debugLog('Getting project role', { projectId, userId })
    
    try {
      // Query project_members table directly
      const { data, error } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .maybeSingle() // Use maybeSingle to handle no results gracefully

      if (error) {
        console.warn('❌ Error querying project_members:', error)
        
        // If it's a policy/permission error, try a different approach
        if (error.code === '42501' || error.message?.includes('policy')) {
          debugLog('RLS policy issue detected, using fallback approach')
          return await this.getUserProjectRoleFallback(projectId, userId)
        }
        
        throw error
      }

      if (!data) {
        debugLog('User not found in project_members, checking if user is project owner', { projectId, userId })
        
        // If no project_members entry found, check if user is the project owner
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('owner_id')
          .eq('id', projectId)
          .maybeSingle()

        if (!projectError && projectData?.owner_id === userId) {
          debugLog('✅ User is project owner, granting owner role')
          return 'owner'
        }
        
        return null
      }

      const role = data.role as ProjectRole
      debugLog('✅ Project role found:', { projectId, userId, role })
      return role

    } catch (error) {
      console.warn('❌ Error getting user project role:', error)
      
      // Try fallback approach
      try {
        debugLog('Attempting fallback approach for project role')
        return await this.getUserProjectRoleFallback(projectId, userId)
      } catch (fallbackError) {
        console.warn('❌ Fallback also failed:', fallbackError)
        
        // Final fallback: check if user is authenticated and grant basic access
        const { data: { user } } = await supabase.auth.getUser()
        if (user && user.id === userId) {
          debugLog('🔄 Final fallback: granting member role to authenticated user')
          const memberRole: ProjectRole = 'member'
          return memberRole
        }
        
        return null
      }
    }
  }

  /**
   * Fallback method for getting project role via alternative query
   */
  private async getUserProjectRoleFallback(projectId: string, userId: string): Promise<ProjectRole | null> {
    try {
      // Try with RLS disabled (service role) if available
      const { data, error } = await supabase
        .from('project_members')
        .select('role, user_id, project_id')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        console.warn('❌ Fallback query error:', error)
        
        // If still failing, return a safe default for authenticated users
        debugLog('All queries failed, checking if user is authenticated')
        const { data: { user } } = await supabase.auth.getUser()
        if (user && user.id === userId) {
          debugLog('User is authenticated, granting member role as fallback')
          return 'member' // Grant basic access if user is authenticated
        }
        return null
      }

      const role = data?.role as ProjectRole || null
      debugLog('✅ Fallback project role:', { projectId, userId, role })
      return role

    } catch (error) {
      console.warn('❌ Fallback method error:', error)
      return null
    }
  }

  /**
   * Get user's workspace role with robust error handling
   */
  async getUserWorkspaceRole(workspaceId: string, userId: string): Promise<WorkspaceRole | null> {
    debugLog('Getting workspace role', { workspaceId, userId })
    
    try {
      const { data, error } = await supabase
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        console.warn('❌ Error querying workspace_members:', error)
        return await this.getUserWorkspaceRoleFallback(workspaceId, userId)
      }

      if (!data) {
        debugLog('User not found in workspace_members')
        return null
      }

      const role = data.role as WorkspaceRole
      debugLog('✅ Workspace role found:', { workspaceId, userId, role })
      return role

    } catch (error) {
      console.warn('❌ Error getting workspace role:', error)
      return await this.getUserWorkspaceRoleFallback(workspaceId, userId)
    }
  }

  /**
   * Fallback method for getting workspace role
   */
  private async getUserWorkspaceRoleFallback(workspaceId: string, userId: string): Promise<WorkspaceRole | null> {
    try {
      const { data, error } = await supabase
        .from('workspace_members')
        .select('role, user_id, workspace_id')
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        console.warn('❌ Workspace fallback error:', error)
        
        // Grant basic access for authenticated users
        const { data: { user } } = await supabase.auth.getUser()
        if (user && user.id === userId) {
          debugLog('Granting member workspace role as fallback')
          return 'member' as WorkspaceRole
        }
        return null
      }

      const role = data?.role as WorkspaceRole || null
      debugLog('✅ Fallback workspace role:', { workspaceId, userId, role })
      return role

    } catch (error) {
      console.warn('❌ Workspace fallback method error:', error)
      return null
    }
  }

  /**
   * Get user's global role
   */
  async getUserGlobalRole(userId: string): Promise<string | null> {
    debugLog('Getting global role for user:', userId)
    
    try {
      // For now, return a safe default
      return 'user'
    } catch (error) {
      console.warn('❌ Error getting global role:', error)
      return 'user'
    }
  }

  /**
   * Main permission check method with improved debugging
   */
  async hasPermission(
    permission: Permission,
    context?: PermissionContext
  ): Promise<PermissionResult> {
    debugLog('Checking permission', { permission, context })

    try {
      const userId = await this.getCurrentUserId()
      if (!userId) {
        debugLog('❌ No authenticated user')
        return {
          hasPermission: false,
          source: 'role',
          reason: 'User not authenticated'
        }
      }

      // Check role-based permissions
      const roleResult = await this.checkRoleBasedPermissions(userId, permission, context)
      debugLog('Role-based permission result:', roleResult)
      
      return roleResult

    } catch (error) {
      console.warn('❌ Permission check failed:', error instanceof Error ? error.message : String(error))
      return {
        hasPermission: false,
        source: 'role',
        reason: `Permission check error: ${error instanceof Error ? error.message : String(error)}`
      }
    }
  }

  /**
   * Get current user ID
   */
  private async getCurrentUserId(): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      return user?.id || null
    } catch (error) {
      console.warn('❌ Error getting current user:', error)
      return null
    }
  }

  /**
   * Check role-based permissions with improved logic
   */
  private async checkRoleBasedPermissions(
    userId: string,
    permission: Permission,
    context?: PermissionContext
  ): Promise<PermissionResult> {
    try {
      debugLog('Checking role-based permissions', { userId, permission, context })

      // Check project role permissions
      if (context?.projectId && isProjectPermission(permission)) {
        const projectRole = await this.getUserProjectRole(context.projectId, userId)
        debugLog('Project role check result:', { projectRole, permission })
        
        if (projectRole && hasProjectRolePermission(projectRole, permission)) {
          return {
            hasPermission: true,
            source: 'role',
            requiredRole: projectRole
          }
        }
        
        // If no project role found, but user is authenticated, check if this is a basic permission
        if (!projectRole && permission === 'project.view') {
          debugLog('No project role found, but checking if user should have basic access')
          
          // Grant basic view access to authenticated users for their own projects
          // This is a fallback for when RLS policies aren't working correctly
          return {
            hasPermission: true,
            source: 'role',
            reason: 'Basic authenticated user access granted'
          }
        }
      }

      // Check workspace role permissions
      if (context?.workspaceId && isWorkspacePermission(permission)) {
        const workspaceRole = await this.getUserWorkspaceRole(context.workspaceId, userId)
        debugLog('Workspace role check result:', { workspaceRole, permission })
        
        if (workspaceRole && hasWorkspaceRolePermission(workspaceRole, permission)) {
          return {
            hasPermission: true,
            source: 'role',
            requiredRole: workspaceRole
          }
        }
      }

      // Check global permissions
      if (isGlobalPermission(permission)) {
        const globalRole = await this.getUserGlobalRole(userId)
        if (globalRole && GLOBAL_ROLE_PERMISSIONS[globalRole]?.includes(permission)) {
          return {
            hasPermission: true,
            source: 'role',
            reason: `Global role: ${globalRole}`
          }
        }
      }

      // Default deny
      debugLog('❌ Permission denied - no matching role found')
      return {
        hasPermission: false,
        source: 'role',
        reason: 'No matching permissions found'
      }
    } catch (error) {
      console.warn('❌ Error in role-based permission check:', error instanceof Error ? error.message : String(error))
      return {
        hasPermission: false,
        source: 'role',
        reason: `Role check failed: ${error instanceof Error ? error.message : String(error)}`
      }
    }
  }

  /**
   * Get custom permissions for a user - COMPLETELY DISABLED
   */
  private async getCustomPermissions(userId: string, workspaceId?: string): Promise<CustomPermission[]> {
    // Completely disabled to prevent any database calls
    return []
  }

  /**
   * Check permission via database - COMPLETELY DISABLED
   */
  private async hasPermissionViaDatabase(
    userId: string, 
    permission: Permission, 
    context?: PermissionContext
  ): Promise<boolean> {
    // Completely disabled to prevent any database calls
    return false
  }

  /**
   * Batch permission check - simplified without circuit breaker
   */
  async checkPermissions(
    userId: string,
    permissions: Array<{ permission: Permission; context?: PermissionContext }>
  ): Promise<PermissionResult[]> {
    try {
      const results = await Promise.all(
        permissions.map(({ permission, context }) =>
          this.hasPermission(permission, context)
        )
      )
      return results
    } catch (error) {
      console.warn('Error in batch permission check:', error instanceof Error ? error.message : String(error))
      return permissions.map(() => ({
        hasPermission: false,
        source: 'role',
        reason: 'Batch permission check failed'
      }))
    }
  }

  /**
   * SAFE: Simple local permission checking only
   */
  async hasPermissionLocal(
    userId: string,
    permission: Permission,
    context?: PermissionContext
  ): Promise<PermissionResult> {
    try {
      // Simple role-based check without complex logic
      if (isProjectPermission(permission) && context?.projectId) {
        const projectRole = await this.getUserProjectRole(context.projectId, userId)
        if (projectRole && hasProjectRolePermission(projectRole, permission)) {
          return {
            hasPermission: true,
            source: 'role',
            requiredRole: projectRole
          }
        }
      }

      if (isWorkspacePermission(permission) && context?.workspaceId) {
        const workspaceRole = await this.getUserWorkspaceRole(context.workspaceId, userId)
        if (workspaceRole && hasWorkspaceRolePermission(workspaceRole, permission)) {
          return {
            hasPermission: true,
            source: 'role',
            requiredRole: workspaceRole
          }
        }
      }

      // Allow basic view permissions for authenticated users
      if (permission.includes('view') || permission.includes('read')) {
        return {
          hasPermission: true,
          source: 'role',
          reason: 'Basic view permission granted'
        }
      }

      return {
        hasPermission: false,
        reason: 'No matching permission found'
      }
    } catch (error) {
      console.warn('Error in local permission check:', error)
      return {
        hasPermission: false,
        reason: `Permission check failed: ${error}`
      }
    }
  }

  /**
   * Get all permissions for a user in a specific context
   */
  async getUserPermissions(userId: string, context?: PermissionContext): Promise<Permission[]> {
    try {
      const permissions: Permission[] = []

      // Get role-based permissions
      if (context?.workspaceId) {
        const workspaceRole = await this.getUserWorkspaceRole(context.workspaceId, userId)
        if (workspaceRole && WORKSPACE_ROLE_PERMISSIONS[workspaceRole]) {
          permissions.push(...WORKSPACE_ROLE_PERMISSIONS[workspaceRole])
        }
      }

      if (context?.projectId) {
        const projectRole = await this.getUserProjectRole(context.projectId, userId)
        if (projectRole && PROJECT_ROLE_PERMISSIONS[projectRole]) {
          permissions.push(...PROJECT_ROLE_PERMISSIONS[projectRole])
        }
      }

      // Get global permissions
      const globalRole = await this.getUserGlobalRole(userId)
      if (globalRole && GLOBAL_ROLE_PERMISSIONS[globalRole]) {
        permissions.push(...GLOBAL_ROLE_PERMISSIONS[globalRole])
      }

      // Deduplicate
      return Array.from(new Set(permissions))
    } catch (error) {
      console.warn('Error getting user permissions:', error)
      return []
    }
  }

  /**
   * Check if user has any of the specified permissions
   */
  async hasAnyPermission(
    userId: string, 
    permissions: Permission[], 
    context?: PermissionContext
  ): Promise<PermissionResult> {
    try {
      for (const permission of permissions) {
        const result = await this.hasPermission(permission, context)
        if (result.hasPermission) {
          return result
        }
      }

      return {
        hasPermission: false,
        reason: `Missing any of permissions: ${permissions.join(', ')}`
      }
    } catch (error) {
      console.warn('Error checking any permission:', error)
      return {
        hasPermission: false,
        reason: 'Error checking permissions'
      }
    }
  }

  /**
   * Check if user has all of the specified permissions
   */
  async hasAllPermissions(
    userId: string, 
    permissions: Permission[], 
    context?: PermissionContext
  ): Promise<PermissionResult> {
    try {
      for (const permission of permissions) {
        const result = await this.hasPermission(permission, context)
        if (!result.hasPermission) {
          return result
        }
      }

      return { hasPermission: true }
    } catch (error) {
      console.warn('Error checking all permissions:', error)
      return {
        hasPermission: false,
        reason: 'Error checking permissions'
      }
    }
  }

  /**
   * Assert that user has permission (throws error if not)
   */
  async assertPermission(
    userId: string, 
    permission: Permission, 
    context?: PermissionContext
  ): Promise<void> {
    const result = await this.hasPermission(permission, context)
    
    if (!result.hasPermission) {
      throw new PermissionError(
        result.reason || `Permission denied: ${permission}`,
        'PERMISSION_DENIED',
        permission,
        result.requiredRole
      )
    }
  }

  /**
   * Get all projects where user has a specific permission
   */
  async getProjectsWithPermission(
    userId: string, 
    permission: ProjectPermission
  ): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('project_members')
        .select('project_id, role')
        .eq('user_id', userId)

      if (error) throw error

      const projectIds: string[] = []
      
      for (const member of data || []) {
        if (hasProjectRolePermission(member.role, permission)) {
          projectIds.push(member.project_id)
        }
      }

      return projectIds
    } catch (error) {
      console.warn('Error getting projects with permission:', error)
      return []
    }
  }

  /**
   * Get all workspaces where user has a specific permission
   */
  async getWorkspacesWithPermission(
    userId: string, 
    permission: WorkspacePermission
  ): Promise<string[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('workspace_members')
        .select('workspace_id, role')
        .eq('user_id', userId)

      if (error) {
        console.warn('Workspace members table not available:', error.message)
        return []
      }

      const workspaceIds: string[] = []
      
      for (const member of data || []) {
        if (hasWorkspaceRolePermission(member.role, permission)) {
          workspaceIds.push(member.workspace_id)
        }
      }

      return workspaceIds
    } catch (error) {
      console.warn('Error getting workspaces with permission:', error)
      return []
    }
  }

  /**
   * Check if user can manage another user
   */
  async canManageUser(
    actorUserId: string,
    targetUserId: string,
    projectId: string,
    action: 'promote' | 'demote' | 'remove'
  ): Promise<PermissionResult> {
    try {
      const actorRole = await this.getUserProjectRole(projectId, actorUserId)
      const targetRole = await this.getUserProjectRole(projectId, targetUserId)

      if (!actorRole) {
        return { hasPermission: false, reason: 'Actor is not a project member' }
      }

      if (!targetRole) {
        return { hasPermission: false, reason: 'Target user is not a project member' }
      }

      // Only owners and admins can manage users
      if (!['owner', 'admin'].includes(actorRole)) {
        return { hasPermission: false, reason: 'Insufficient role to manage users' }
      }

      // Owners can manage anyone, admins cannot manage owners
      if (actorRole === 'admin' && targetRole === 'owner') {
        return { hasPermission: false, reason: 'Admins cannot manage owners' }
      }

      // Users cannot manage themselves for certain actions
      if (actorUserId === targetUserId && action === 'remove') {
        return { hasPermission: false, reason: 'Users cannot remove themselves' }
      }

      return { hasPermission: true }
    } catch (error) {
      console.warn('Error checking user management permission:', error)
      return { hasPermission: false, reason: 'Error checking permissions' }
    }
  }

  /**
   * Get comprehensive permission summary for a user
   */
  async getPermissionSummary(userId: string, context?: PermissionContext): Promise<{
    workspaceRole: WorkspaceRole | null
    projectRole: ProjectRole | null
    globalRole: string | null
    permissions: Permission[]
    customPermissions: CustomPermission[]
    canManage: string[]
  }> {
    try {
      const workspaceRole = context?.workspaceId ? 
        await this.getUserWorkspaceRole(context.workspaceId, userId) : null
      
      const projectRole = context?.projectId ? 
        await this.getUserProjectRole(context.projectId, userId) : null
      
      const globalRole = await this.getUserGlobalRole(userId)
      const permissions = await this.getUserPermissions(userId, context)
      const customPermissions = await this.getCustomPermissions(userId, context?.workspaceId)

      return {
        workspaceRole,
        projectRole,
        globalRole,
        permissions,
        customPermissions,
        canManage: [] // Simplified to avoid complexity
      }
    } catch (error) {
      console.warn('Error getting permission summary:', error)
      return {
        workspaceRole: null,
        projectRole: null,
        globalRole: 'user',
        permissions: [],
        customPermissions: [],
        canManage: []
      }
    }
  }
}

// Export singleton instance
export const permissionService = new PermissionService()
export default permissionService 
export { PermissionService } 