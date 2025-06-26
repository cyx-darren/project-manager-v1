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

// Enhanced cache for user permissions with workspace support
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

// Database function result types
interface DatabasePermissionResult {
  user_has_permission: boolean
}

interface DatabaseRoleResult {
  get_user_project_role: 'owner' | 'admin' | 'member' | null
}

interface DatabaseWorkspaceRoleResult {
  get_user_workspace_role: 'owner' | 'admin' | 'member' | 'billing_manager' | null
}

class PermissionService {
  private cache: PermissionCache = {}
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
  private readonly DATABASE_AVAILABLE = false // Temporarily disable database functions until they're fixed

  /**
   * Clear the permission cache for a user
   */
  clearCache(userId: string): void {
    delete this.cache[userId]
  }

  /**
   * Clear all permission caches
   */
  clearAllCache(): void {
    this.cache = {}
  }

  /**
   * Get user's role in a specific project using database function
   */
  async getUserProjectRole(projectId: string, userId: string): Promise<ProjectRole | null> {
    try {
      if (this.DATABASE_AVAILABLE) {
        // Use the database function from Task 9.1
        const { data, error } = await supabase.rpc('get_user_project_role' as any, {
          project_uuid: projectId,
          user_uuid: userId
        }) as { data: 'owner' | 'admin' | 'member' | null, error: any }

        if (error) {
          console.error('Database function error:', error)
          // Fall back to direct table query
          return this.getUserProjectRoleFallback(projectId, userId)
        }

        return data as ProjectRole
      } else {
        return this.getUserProjectRoleFallback(projectId, userId)
      }
    } catch (error) {
      console.error('Error getting user project role:', error)
      return this.getUserProjectRoleFallback(projectId, userId)
    }
  }

  /**
   * Fallback method for getting project role via direct table query
   */
  private async getUserProjectRoleFallback(projectId: string, userId: string): Promise<ProjectRole | null> {
    try {
      const { data, error } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - user is not a member
          return null
        }
        throw error
      }

      return data?.role as ProjectRole || null
    } catch (error) {
      console.error('Error in project role fallback:', error)
      return null
    }
  }

  /**
   * Get user's role in a specific workspace using database function
   */
  async getUserWorkspaceRole(workspaceId: string, userId: string): Promise<WorkspaceRole | null> {
    try {
      if (this.DATABASE_AVAILABLE) {
        // Use the database function from Task 9.1
        const { data, error } = await supabase.rpc('get_user_workspace_role' as any, {
          p_workspace_id: workspaceId,
          p_user_id: userId
        }) as { data: 'owner' | 'admin' | 'member' | 'billing_manager' | null, error: any }

        if (error) {
          console.error('Database function error:', error)
          return this.getUserWorkspaceRoleFallback(workspaceId, userId)
        }

        return data as WorkspaceRole
      } else {
        return this.getUserWorkspaceRoleFallback(workspaceId, userId)
      }
    } catch (error) {
      console.error('Error getting user workspace role:', error)
      return this.getUserWorkspaceRoleFallback(workspaceId, userId)
    }
  }

  /**
   * Fallback method for getting workspace role via direct table query
   */
  private async getUserWorkspaceRoleFallback(workspaceId: string, userId: string): Promise<WorkspaceRole | null> {
    try {
      // Use type assertion since workspace_members table is not in current types
      const { data, error } = await (supabase as any)
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - user is not a member
          return null
        }
        console.error('Workspace members table not available yet:', error)
        return null
      }

      return data?.role as WorkspaceRole || null
    } catch (error) {
      console.error('Error in workspace role fallback:', error)
      return null
    }
  }

  /**
   * Get user's global role (from user profile or system settings)
   */
  async getUserGlobalRole(userId: string): Promise<string | null> {
    try {
      // Try to get from profiles table with role column
      // Use type assertion since profiles table may not be in current types
      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()

      if (error) {
        // If profiles table doesn't exist or user not found, return default role
        if (error.code === '42P01' || error.code === 'PGRST116') {
          // Table doesn't exist or no rows returned - return default role
          return 'user'
        }
        console.error('Error getting global role from profiles:', error)
        return 'user' // Default role
      }

      return data?.role || 'user'
    } catch (error) {
      console.error('Error getting user global role:', error)
      return 'user'
    }
  }

  /**
   * Get custom permissions for a user in a specific context
   */
  async getCustomPermissions(userId: string, context?: PermissionContext): Promise<CustomPermission[]> {
    try {
      // Query custom_permissions table if available
      // Use type assertion since custom_permissions table is not in current types
      const query = (supabase as any)
        .from('custom_permissions')
        .select('*')
        .eq('user_id', userId)

      // Add context filters if provided
      if (context?.workspaceId) {
        query.eq('workspace_id', context.workspaceId)
      }
      if (context?.projectId) {
        query.eq('project_id', context.projectId)
      }
      if (context?.taskId) {
        query.eq('task_id', context.taskId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Custom permissions table not available yet:', error)
        return []
      }

      return data?.map((row: any) => ({
        userId: row.user_id,
        permission: row.permission as Permission,
        granted: row.granted,
        context: {
          workspaceId: row.workspace_id,
          projectId: row.project_id,
          taskId: row.task_id
        },
        grantedBy: row.granted_by,
        grantedAt: new Date(row.granted_at)
      })) || []
    } catch (error) {
      console.error('Error getting custom permissions:', error)
      return []
    }
  }

  /**
   * Check permission using database function with fallback
   */
  async hasPermissionViaDatabase(
    userId: string,
    permission: Permission,
    context?: PermissionContext
  ): Promise<PermissionResult> {
    try {
      if (this.DATABASE_AVAILABLE) {
        // Determine context type and ID for the database function
        let contextType: string
        let contextId: string | null = null

        if (context?.taskId) {
          contextType = 'task'
          contextId = context.taskId
        } else if (context?.projectId) {
          contextType = 'project'
          contextId = context.projectId
        } else if (context?.workspaceId) {
          contextType = 'workspace'
          contextId = context.workspaceId
        } else {
          contextType = 'global'
        }

        // Use the database function from Task 9.1
        const { data, error } = await supabase.rpc('user_has_permission' as any, {
          p_user_id: userId,
          p_permission_action: permission,
          p_context_type: contextType,
          p_context_id: contextId
        }) as { data: boolean, error: any }

        if (error) {
          console.error('Database permission check error:', error)
          // Fall back to local permission checking
          return this.hasPermissionLocal(userId, permission, context)
        }

        return {
          hasPermission: data,
          source: 'role',
          reason: data ? 
            'Permission granted via database function' : 
            'Permission denied via database function'
        }
      } else {
        return this.hasPermissionLocal(userId, permission, context)
      }
    } catch (error) {
      console.error('Error checking permission via database:', error)
      // Fallback to local permission checking
      return this.hasPermissionLocal(userId, permission, context)
    }
  }

  /**
   * Local permission checking (fallback method)
   */
  async hasPermissionLocal(
    userId: string,
    permission: Permission,
    context?: PermissionContext
  ): Promise<PermissionResult> {
    try {
      // Check custom permissions first
      const customPermissions = await this.getCustomPermissions(userId, context)
      const customPermission = customPermissions.find(cp => 
        cp.permission === permission &&
        cp.context.workspaceId === context?.workspaceId &&
        cp.context.projectId === context?.projectId &&
        cp.context.taskId === context?.taskId
      )

      if (customPermission) {
        return {
          hasPermission: customPermission.granted,
          source: 'custom',
          reason: customPermission.granted ? 
            'Granted via custom permission' : 
            'Denied via custom permission'
        }
      }

      // Check role-based permissions
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

      if (isGlobalPermission(permission)) {
        const globalRole = await this.getUserGlobalRole(userId)
        if (globalRole && GLOBAL_ROLE_PERMISSIONS[globalRole]?.includes(permission)) {
          return {
            hasPermission: true,
            source: 'role'
          }
        }
      }

      return {
        hasPermission: false,
        reason: 'No matching role or custom permission found'
      }
    } catch (error) {
      console.error('Error in local permission check:', error)
      return {
        hasPermission: false,
        reason: `Permission check failed: ${error}`
      }
    }
  }

  /**
   * Main permission checking method with caching
   */
  async hasPermission(
    userId: string,
    permission: Permission,
    context?: PermissionContext
  ): Promise<PermissionResult> {
    try {
      // Generate cache key
      const cacheKey = `${userId}-${permission}-${JSON.stringify(context || {})}`
      
      // Check cache first (for performance)
      const cached = this.cache[userId]
      if (cached && cached.expiresAt > Date.now()) {
        // Use cached data for quick local check
        return this.hasPermissionLocal(userId, permission, context)
      }

      // Use database function for fresh permission check
      return this.hasPermissionViaDatabase(userId, permission, context)
    } catch (error) {
      console.error('Error in hasPermission:', error)
      return {
        hasPermission: false,
        reason: `Permission check failed: ${error}`
      }
    }
  }

  /**
   * Check multiple permissions at once
   */
  async hasPermissions(
    userId: string,
    permissions: Permission[],
    context?: PermissionContext
  ): Promise<Record<Permission, PermissionResult>> {
    const results: Record<Permission, PermissionResult> = {} as any

    // Check permissions in parallel for better performance
    await Promise.all(
      permissions.map(async (permission) => {
        results[permission] = await this.hasPermission(userId, permission, context)
      })
    )

    return results
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

      // Get custom permissions
      const customPermissions = await this.getCustomPermissions(userId, context)
      const grantedCustomPermissions = customPermissions
        .filter(cp => cp.granted)
        .map(cp => cp.permission)

      // Combine and deduplicate
      const combinedPermissions = [...permissions, ...grantedCustomPermissions]
      const allPermissions = Array.from(new Set(combinedPermissions))

      return allPermissions
    } catch (error) {
      console.error('Error getting user permissions:', error)
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
        const result = await this.hasPermission(userId, permission, context)
        if (result.hasPermission) {
          return result
        }
      }

      return {
        hasPermission: false,
        reason: `Missing any of permissions: ${permissions.join(', ')}`
      }
    } catch (error) {
      console.error('Error checking any permission:', error)
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
        const result = await this.hasPermission(userId, permission, context)
        if (!result.hasPermission) {
          return result
        }
      }

      return { hasPermission: true }
    } catch (error) {
      console.error('Error checking all permissions:', error)
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
    const result = await this.hasPermission(userId, permission, context)
    
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
      // Get all projects where user is a member
      const { data: memberships, error } = await supabase
        .from('project_members')
        .select('project_id, role')
        .eq('user_id', userId)

      if (error) {
        throw error
      }

      // Filter projects where user has the required permission
      const projectsWithPermission: string[] = []
      
      for (const membership of memberships || []) {
        const role = membership.role as ProjectRole
        if (hasProjectRolePermission(role, permission)) {
          projectsWithPermission.push(membership.project_id)
        }
      }

      return projectsWithPermission
    } catch (error) {
      console.error('Error getting projects with permission:', error)
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
      // For now, return empty array since workspace_members table may not be available
      // This will be implemented when the database schema is fully migrated
      return []
    } catch (error) {
      console.error('Error getting workspaces with permission:', error)
      return []
    }
  }

  /**
   * Check if user can perform an action on another user in a project
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
        return {
          hasPermission: false,
          reason: 'Actor is not a member of this project'
        }
      }

      if (!targetRole) {
        return {
          hasPermission: false,
          reason: 'Target user is not a member of this project'
        }
      }

      // Import the utility function from permissions types
      const { canRolePerformAction } = await import('../types/permissions')
      const canPerform = canRolePerformAction(actorRole, targetRole, action)

      return {
        hasPermission: canPerform,
        reason: canPerform ? undefined : `Role '${actorRole}' cannot ${action} user with role '${targetRole}'`
      }
    } catch (error) {
      console.error('Error checking user management permission:', error)
      return {
        hasPermission: false,
        reason: 'Error checking user management permission'
      }
    }
  }

  /**
   * Get permission summary for a user in a context
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
      let workspaceRole: WorkspaceRole | null = null
      let projectRole: ProjectRole | null = null
      
      if (context?.workspaceId) {
        workspaceRole = await this.getUserWorkspaceRole(context.workspaceId, userId)
      }
      
      if (context?.projectId) {
        projectRole = await this.getUserProjectRole(context.projectId, userId)
      }

      const globalRole = await this.getUserGlobalRole(userId)
      const permissions = await this.getUserPermissions(userId, context)
      const customPermissions = await this.getCustomPermissions(userId, context)
      
      // Determine what the user can manage
      const canManage: string[] = []
      if (permissions.includes('team.invite')) canManage.push('invite users')
      if (permissions.includes('team.remove')) canManage.push('remove users')
      if (permissions.includes('team.role.change')) canManage.push('change roles')
      if (permissions.includes('project.edit')) canManage.push('edit project')
      if (permissions.includes('project.delete')) canManage.push('delete project')
      if (permissions.includes('workspace.edit')) canManage.push('edit workspace')
      if (permissions.includes('workspace.manage_roles')) canManage.push('manage workspace roles')

      return {
        workspaceRole,
        projectRole,
        globalRole,
        permissions,
        customPermissions,
        canManage
      }
    } catch (error) {
      console.error('Error getting permission summary:', error)
      return {
        workspaceRole: null,
        projectRole: null,
        globalRole: null,
        permissions: [],
        customPermissions: [],
        canManage: []
      }
    }
  }
}

// Export singleton instance
export const permissionService = new PermissionService()

// Export the class for testing
export { PermissionService } 