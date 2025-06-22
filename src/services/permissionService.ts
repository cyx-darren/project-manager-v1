import { supabase } from '../config/supabase'
import type { 
  Permission, 
  ProjectPermission, 
  GlobalPermission, 
  ProjectRole,
  PermissionContext,
  PermissionResult
} from '../types/permissions'
import { PermissionError } from '../types/permissions'
import { 
  PROJECT_ROLE_PERMISSIONS, 
  hasRolePermission,
  isProjectPermission,
  isGlobalPermission
} from '../types/permissions'

// Local global role permissions (simplified for our current schema)
const GLOBAL_ROLE_PERMISSIONS: Record<string, GlobalPermission[]> = {
  'system_admin': ['system.admin', 'user.manage', 'project.create'],
  'project_owner': ['project.create'],
  'user': ['project.create'] // For now, all users can create projects
}
import type { ApiResponse } from '../types/supabase'

// Cache for user permissions to avoid repeated database calls
interface PermissionCache {
  [key: string]: {
    permissions: Permission[]
    projectRoles: Record<string, ProjectRole>
    globalRole?: string
    expiresAt: number
  }
}

class PermissionService {
  private cache: PermissionCache = {}
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

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
   * Get user's role in a specific project
   */
  async getUserProjectRole(projectId: string, userId: string): Promise<ProjectRole | null> {
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

      return data.role as ProjectRole
    } catch (error) {
      console.error('Error getting user project role:', error)
      return null
    }
  }

  /**
   * Get user's global role (from user profile or system settings)
   * For now, we'll use a simple approach - check if user owns any projects
   */
  async getUserGlobalRole(userId: string): Promise<string | null> {
    try {
      // For now, we'll determine global role based on project ownership
      // In a real system, you'd have a proper user roles table
      const { data: ownedProjects, error } = await supabase
        .from('projects')
        .select('id')
        .eq('owner_id', userId)
        .limit(1)

      if (error) {
        console.error('Error getting user global role:', error)
        return 'user' // Default role
      }

      // If user owns any projects, they can create projects
      // Otherwise, they're a regular user
      return ownedProjects && ownedProjects.length > 0 ? 'project_owner' : 'user'
    } catch (error) {
      console.error('Error getting user global role:', error)
      return 'user'
    }
  }

  /**
   * Get all permissions for a user in a specific project context
   */
  async getUserPermissions(userId: string, projectId?: string): Promise<Permission[]> {
    const cacheKey = `${userId}_${projectId || 'global'}`
    const cached = this.cache[cacheKey]

    // Return cached permissions if still valid
    if (cached && cached.expiresAt > Date.now()) {
      return cached.permissions
    }

    try {
      const permissions: Permission[] = []

      // Get global permissions
      const globalRole = await this.getUserGlobalRole(userId)
      if (globalRole && GLOBAL_ROLE_PERMISSIONS[globalRole]) {
        permissions.push(...GLOBAL_ROLE_PERMISSIONS[globalRole])
      }

      // Get project-specific permissions
      if (projectId) {
        const projectRole = await this.getUserProjectRole(projectId, userId)
        if (projectRole && PROJECT_ROLE_PERMISSIONS[projectRole]) {
          permissions.push(...PROJECT_ROLE_PERMISSIONS[projectRole])
        }
      }

      // Cache the result
      this.cache[cacheKey] = {
        permissions,
        projectRoles: projectId ? { [projectId]: await this.getUserProjectRole(projectId, userId) || 'viewer' } : {},
        globalRole: globalRole || undefined,
        expiresAt: Date.now() + this.CACHE_DURATION
      }

      return permissions
    } catch (error) {
      console.error('Error getting user permissions:', error)
      return []
    }
  }

  /**
   * Check if user has a specific permission
   */
  async hasPermission(
    userId: string, 
    permission: Permission, 
    context?: PermissionContext
  ): Promise<PermissionResult> {
    try {
      const userPermissions = await this.getUserPermissions(userId, context?.projectId)
      const hasPermission = userPermissions.includes(permission)

      if (hasPermission) {
        return { hasPermission: true }
      }

      // If no permission, provide helpful error information
      let reason = `Missing permission: ${permission}`
      let requiredRole: ProjectRole | undefined

      if (isProjectPermission(permission) && context?.projectId) {
        // Find the minimum role that has this permission
        for (const [role, rolePermissions] of Object.entries(PROJECT_ROLE_PERMISSIONS)) {
          if (rolePermissions.includes(permission)) {
            requiredRole = role as ProjectRole
            break
          }
        }
        
        const currentRole = await this.getUserProjectRole(context.projectId, userId)
        reason = `Permission '${permission}' requires role '${requiredRole}', but user has role '${currentRole || 'none'}'`
      }

      return {
        hasPermission: false,
        reason,
        requiredRole
      }
    } catch (error) {
      console.error('Error checking permission:', error)
      return {
        hasPermission: false,
        reason: 'Error checking permission'
          }
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
        if (hasRolePermission(role, permission)) {
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
   * Get permission summary for a user in a project
   */
  async getPermissionSummary(userId: string, projectId?: string): Promise<{
    role: ProjectRole | string | null
    permissions: Permission[]
    canManage: string[]
  }> {
    try {
      let role: ProjectRole | string | null = null
      
      if (projectId) {
        role = await this.getUserProjectRole(projectId, userId)
      } else {
        role = await this.getUserGlobalRole(userId)
      }

      const permissions = await this.getUserPermissions(userId, projectId)
      
      // Determine what the user can manage
      const canManage: string[] = []
      if (permissions.includes('team.invite')) canManage.push('invite users')
      if (permissions.includes('team.remove')) canManage.push('remove users')
      if (permissions.includes('team.role.change')) canManage.push('change roles')
      if (permissions.includes('project.edit')) canManage.push('edit project')
      if (permissions.includes('project.delete')) canManage.push('delete project')

      return {
        role,
        permissions,
        canManage
      }
    } catch (error) {
      console.error('Error getting permission summary:', error)
      return {
        role: null,
        permissions: [],
        canManage: []
      }
    }
  }
}

// Export singleton instance
export const permissionService = new PermissionService()

// Export the class for testing
export { PermissionService } 