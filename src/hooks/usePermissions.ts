import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { permissionService } from '../services/permissionService'
import type { 
  Permission, 
  ProjectPermission, 
  ProjectRole,
  PermissionContext,
  PermissionResult
} from '../types/permissions'

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
        user.id, 
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
      const userPermissions = await permissionService.getUserPermissions(user.id, projectId)
      setPermissions(userPermissions)
    } catch (error) {
      console.error('Error fetching user permissions:', error)
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
 * Hook to check if the current user can manage another user in a project
 */
export const useCanManageUser = (
  targetUserId?: string, 
  projectId?: string, 
  action: 'promote' | 'demote' | 'remove' = 'remove'
) => {
  const { user } = useAuth()
  const [canManage, setCanManage] = useState(false)
  const [loading, setLoading] = useState(true)
  const [reason, setReason] = useState<string>()

  const checkManagePermission = useCallback(async () => {
    if (!user?.id || !targetUserId || !projectId) {
      setCanManage(false)
      setReason('Missing required parameters')
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const result = await permissionService.canManageUser(
        user.id, 
        targetUserId, 
        projectId, 
        action
      )
      setCanManage(result.hasPermission)
      setReason(result.reason)
    } catch (error) {
      console.error('Error checking manage permission:', error)
      setCanManage(false)
      setReason('Error checking permission')
    } finally {
      setLoading(false)
    }
  }, [user?.id, targetUserId, projectId, action])

  useEffect(() => {
    checkManagePermission()
  }, [checkManagePermission])

  return {
    canManage,
    reason,
    loading,
    refetch: checkManagePermission
  }
}

/**
 * Hook to get a permission summary for the current user
 */
export const usePermissionSummary = (projectId?: string) => {
  const { user } = useAuth()
  const [summary, setSummary] = useState<{
    role: ProjectRole | string | null
    permissions: Permission[]
    canManage: string[]
  }>({
    role: null,
    permissions: [],
    canManage: []
  })
  const [loading, setLoading] = useState(true)

  const fetchSummary = useCallback(async () => {
    if (!user?.id) {
      setSummary({ role: null, permissions: [], canManage: [] })
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const permissionSummary = await permissionService.getPermissionSummary(user.id, projectId)
      setSummary(permissionSummary)
    } catch (error) {
      console.error('Error fetching permission summary:', error)
      setSummary({ role: null, permissions: [], canManage: [] })
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
 * Utility hook for common project permissions
 */
export const useProjectPermissions = (projectId?: string) => {
  const { permissions, loading } = useUserPermissions(projectId)

  return useMemo(() => {
    const hasPermission = (permission: Permission) => permissions.includes(permission);
    
    return {
      // Project management
      canViewProject: hasPermission('project.view'),
      canEditProject: hasPermission('project.edit'),
      canDeleteProject: hasPermission('project.delete'),
      canArchiveProject: hasPermission('project.archive'),
      
      // Task management
      canViewTasks: hasPermission('task.view'),
      canCreateTasks: hasPermission('task.create'),
      canEditTasks: hasPermission('task.edit'),
      canDeleteTasks: hasPermission('task.delete'),
      canAssignTasks: hasPermission('task.assign'),
      
      // Team management
      canViewTeam: hasPermission('team.view'),
      canInviteMembers: hasPermission('team.invite'),
      canRemoveMembers: hasPermission('team.remove'),
      canChangeRoles: hasPermission('team.role.change'),
      
      // Comments and collaboration
      canViewComments: hasPermission('comment.view'),
      canCreateComments: hasPermission('comment.create'),
      canEditComments: hasPermission('comment.edit'),
      canDeleteComments: hasPermission('comment.delete'),
      
      // Analytics
      canViewAnalytics: hasPermission('analytics.view'),
      canGenerateReports: hasPermission('report.generate'),
      
      // Loading state
      loading
    };
  }, [permissions, loading])
}

/**
 * Hook to clear permission cache when needed
 */
export const usePermissionCache = () => {
  const { user } = useAuth()

  const clearUserCache = useCallback(() => {
    if (user?.id) {
      permissionService.clearCache(user.id)
    }
  }, [user?.id])

  const clearAllCache = useCallback(() => {
    permissionService.clearAllCache()
  }, [])

  return {
    clearUserCache,
    clearAllCache
  }
} 