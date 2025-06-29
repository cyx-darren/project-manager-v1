import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { usePermissionContext } from '../contexts/PermissionContext'
import { permissionService } from '../services/permissionService'
import type { 
  Permission, 
  ProjectRole,
  WorkspaceRole,
  PermissionContext,
  PermissionResult
} from '../types/permissions'

/**
 * Main hook for permission management - uses context when available
 */
export const usePermissions = () => {
  const context = usePermissionContext()
  return context
}

/**
 * Hook to check if the current user has a specific permission
 */
export const usePermission = (
  permission: Permission, 
  context?: PermissionContext
) => {
  const { user } = useAuth()
  const [result, setResult] = useState<PermissionResult>({ hasPermission: false })
  const [loading, setLoading] = useState(true)

  const checkPermission = useCallback(async () => {
    if (!user?.id) {
      setResult({ hasPermission: false, reason: 'User not authenticated' })
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const permissionResult = await permissionService.hasPermission(
        permission, 
        context
      )
      setResult(permissionResult)
    } catch (error) {
      console.error('Error checking permission:', error)
      setResult({ 
        hasPermission: false, 
        reason: 'Error checking permission' 
      })
    } finally {
      setLoading(false)
    }
  }, [user?.id, permission, context?.projectId, context?.taskId, context?.userId])

  useEffect(() => {
    checkPermission()
  }, [checkPermission])

  return {
    hasPermission: result.hasPermission,
    reason: result.reason,
    requiredRole: result.requiredRole,
    loading,
    refetch: checkPermission
  }
}

/**
 * Hook to check if the current user has any of the specified permissions
 */
export const useAnyPermission = (
  permissions: Permission[], 
  context?: PermissionContext
) => {
  const { user } = useAuth()
  const [result, setResult] = useState<PermissionResult>({ hasPermission: false })
  const [loading, setLoading] = useState(true)

  // Memoize permissions array to prevent infinite loops
  const memoizedPermissions = useMemo(() => permissions, [permissions.join(',')]);

  const checkPermissions = useCallback(async () => {
    if (!user?.id) {
      setResult({ hasPermission: false, reason: 'User not authenticated' })
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const permissionResult = await permissionService.hasAnyPermission(
        user.id,
        memoizedPermissions, 
        context
      )
      setResult(permissionResult)
    } catch (error) {
      console.error('Error checking permissions:', error)
      setResult({ 
        hasPermission: false, 
        reason: 'Error checking permissions' 
      })
    } finally {
      setLoading(false)
    }
  }, [user?.id, memoizedPermissions, context?.projectId, context?.taskId, context?.userId])

  useEffect(() => {
    checkPermissions()
  }, [checkPermissions])

  return {
    hasPermission: result.hasPermission,
    reason: result.reason,
    loading,
    refetch: checkPermissions
  }
}

/**
 * Hook to get the user's role in a specific project
 */
export const useProjectRole = (projectId?: string) => {
  const { user } = useAuth()
  const [role, setRole] = useState<ProjectRole | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchRole = useCallback(async () => {
    if (!user?.id || !projectId) {
      setRole(null)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const userRole = await permissionService.getUserProjectRole(projectId, user.id)
      setRole(userRole)
    } catch (error) {
      console.error('Error fetching project role:', error)
      setRole(null)
    } finally {
      setLoading(false)
    }
  }, [user?.id, projectId])

  useEffect(() => {
    fetchRole()
  }, [fetchRole])

  return {
    role,
    loading,
    refetch: fetchRole,
    isOwner: role === 'owner',
    isAdmin: role === 'admin',
    isMember: role === 'member',
    isViewer: role === 'viewer'
  }
}

/**
 * Hook to get the user's role in a specific workspace
 */
export const useWorkspaceRole = (workspaceId?: string) => {
  const { user } = useAuth()
  const [role, setRole] = useState<WorkspaceRole | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchRole = useCallback(async () => {
    if (!user?.id || !workspaceId) {
      setRole(null)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const userRole = await permissionService.getUserWorkspaceRole(workspaceId, user.id)
      setRole(userRole)
    } catch (error) {
      console.error('Error fetching workspace role:', error)
      setRole(null)
    } finally {
      setLoading(false)
    }
  }, [user?.id, workspaceId])

  useEffect(() => {
    fetchRole()
  }, [fetchRole])

  return {
    role,
    loading,
    refetch: fetchRole,
    isOwner: role === 'owner',
    isAdmin: role === 'admin',
    isMember: role === 'member'
  }
}

/**
 * Hook to get all permissions for the current user in a project context
 */
export const useUserPermissions = (projectId?: string) => {
  const { user } = useAuth()
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPermissions = useCallback(async () => {
    if (!user?.id) {
      setPermissions([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const userPermissions = await permissionService.getUserPermissions(user.id, projectId ? { projectId } : undefined)
      setPermissions(userPermissions)
    } catch (error) {
      // Suppress error logging for missing profiles table (expected during development)
      if (error instanceof Error && !error.message.includes('relation "public.profiles" does not exist')) {
        console.error('Error fetching user permissions:', error)
      }
      setPermissions([])
    } finally {
      setLoading(false)
    }
  }, [user?.id, projectId])

  useEffect(() => {
    fetchPermissions()
  }, [fetchPermissions])

  // Memoized permission checkers
  const hasPermission = useCallback((permission: Permission) => {
    return permissions.includes(permission)
  }, [permissions])

  const hasAnyPermission = useCallback((requiredPermissions: Permission[]) => {
    return requiredPermissions.some(permission => permissions.includes(permission))
  }, [permissions])

  const hasAllPermissions = useCallback((requiredPermissions: Permission[]) => {
    return requiredPermissions.every(permission => permissions.includes(permission))
  }, [permissions])

  return {
    permissions,
    loading,
    refetch: fetchPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions
  }
}

/**
 * Hook to check if user can manage another user
 */
export const useCanManageUser = (
  targetUserId?: string, 
  projectId?: string, 
  action: 'promote' | 'demote' | 'remove' = 'remove'
) => {
  const { user } = useAuth()
  const [canManage, setCanManage] = useState(false)
  const [loading, setLoading] = useState(true)

  const checkManagePermission = useCallback(async () => {
    if (!user?.id || !targetUserId) {
      setCanManage(false)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      let permission: Permission
      switch (action) {
        case 'promote':
          permission = 'team.role.change'
          break
        case 'demote':
          permission = 'team.role.change'
          break
        case 'remove':
          permission = 'team.remove'
          break
        default:
          permission = 'team.remove'
      }

      const result = await permissionService.hasPermission(
        permission, 
        projectId ? { projectId } : undefined
      )
      
      setCanManage(result.hasPermission)
    } catch (error) {
      console.error('Error checking manage permission:', error)
      setCanManage(false)
    } finally {
      setLoading(false)
    }
  }, [user?.id, targetUserId, projectId, action])

  useEffect(() => {
    checkManagePermission()
  }, [checkManagePermission])

  return {
    canManage,
    loading,
    refetch: checkManagePermission
  }
}

/**
 * Hook to get a comprehensive permission summary for a user
 */
export const usePermissionSummary = (projectId?: string) => {
  const { user } = useAuth()
  const [summary, setSummary] = useState<{
    projectRole: ProjectRole | null
    permissions: Permission[]
    canEdit: boolean
    canDelete: boolean
    canInvite: boolean
    canManageTeam: boolean
  }>({
    projectRole: null,
    permissions: [],
    canEdit: false,
    canDelete: false,
    canInvite: false,
    canManageTeam: false
  })
  const [loading, setLoading] = useState(true)

  const fetchSummary = useCallback(async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const [projectRole, permissions] = await Promise.all([
        projectId ? permissionService.getUserProjectRole(projectId, user.id) : Promise.resolve(null),
        permissionService.getUserPermissions(user.id, projectId ? { projectId } : undefined)
      ])

      const context = projectId ? { projectId } : undefined
      const [canEdit, canDelete, canInvite, canManageTeam] = await Promise.all([
        permissionService.hasPermission('project.edit', context),
        permissionService.hasPermission('project.delete', context),
        permissionService.hasPermission('team.invite', context),
        permissionService.hasPermission('team.role.change', context)
      ])

      setSummary({
        projectRole,
        permissions,
        canEdit: canEdit.hasPermission,
        canDelete: canDelete.hasPermission,
        canInvite: canInvite.hasPermission,
        canManageTeam: canManageTeam.hasPermission
      })
    } catch (error) {
      console.error('Error fetching permission summary:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id, projectId])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  return {
    ...summary,
    loading,
    refetch: fetchSummary
  }
}

/**
 * Hook for project-specific permissions
 */
export const useProjectPermissions = (projectId?: string) => {
  const { permissions, loading } = useUserPermissions(projectId)
  
  return {
    permissions,
    loading,
    hasPermission: (permission: Permission) => permissions.includes(permission),
    canEdit: permissions.includes('project.edit'),
    canDelete: permissions.includes('project.delete'),
    canInvite: permissions.includes('team.invite'),
    canManageTeam: permissions.includes('team.role.change'),
    canViewTasks: permissions.includes('task.view'),
    canCreateTasks: permissions.includes('task.create'),
    canEditTasks: permissions.includes('task.edit'),
    canDeleteTasks: permissions.includes('task.delete')
  }
}

/**
 * Hook for workspace-specific permissions
 */
export const useWorkspacePermissions = (workspaceId?: string) => {
  const { user } = useAuth()
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPermissions = useCallback(async () => {
    if (!user?.id || !workspaceId) {
      setPermissions([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const userPermissions = await permissionService.getUserPermissions(user.id, undefined)
      setPermissions(userPermissions)
    } catch (error) {
      console.error('Error fetching workspace permissions:', error)
      setPermissions([])
    } finally {
      setLoading(false)
    }
  }, [user?.id, workspaceId])

  useEffect(() => {
    fetchPermissions()
  }, [fetchPermissions])

  return {
    permissions,
    loading,
    hasPermission: (permission: Permission) => permissions.includes(permission),
    canCreateProjects: permissions.includes('workspace.create_projects'),
    canManageWorkspace: permissions.includes('workspace.edit'),
    canInviteUsers: permissions.includes('team.invite'),
    canManageUsers: permissions.includes('team.role.change')
  }
}

/**
 * Hook to check if user is admin
 */
export const useIsAdmin = (projectId?: string) => {
  const { role } = useProjectRole(projectId)
  return {
    isAdmin: role === 'admin' || role === 'owner',
    isOwner: role === 'owner',
    role
  }
}

/**
 * Hook to check if user can manage users
 */
export const useCanManageUsers = (projectId?: string) => {
  const { hasPermission } = usePermission('team.role.change', projectId ? { projectId } : undefined)
  return hasPermission
}

/**
 * Hook to preload common permissions for performance
 */
export const usePreloadCommonPermissions = (projectId?: string) => {
  const { user } = useAuth()

  useEffect(() => {
    if (!user?.id) return

    const preloadPermissions = async () => {
      const commonPermissions: Permission[] = [
        'task.view',
        'task.create', 
        'task.edit',
        'project.edit',
        'team.invite'
      ]

      const context = projectId ? { projectId } : undefined
      
      // Preload in parallel
      await Promise.all(
        commonPermissions.map(permission => 
          permissionService.hasPermission(permission, context)
        )
      )
    }

    preloadPermissions().catch(console.error)
  }, [user?.id, projectId])
} 