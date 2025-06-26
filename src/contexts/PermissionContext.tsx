import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from './AuthContext'
import { permissionService } from '../services/permissionService'
import type { 
  Permission, 
  ProjectRole,
  WorkspaceRole,
  PermissionContext as PermissionContextType,
  PermissionResult
} from '../types/permissions'

interface PermissionState {
  permissions: Permission[]
  projectRoles: Map<string, ProjectRole | null>
  workspaceRoles: Map<string, WorkspaceRole | null>
  globalRole: string | null
  loading: boolean
  error: string | null
}

interface PermissionContextValue {
  // State
  permissions: Permission[]
  loading: boolean
  error: string | null
  
  // Permission checking
  hasPermission: (permission: Permission, context?: PermissionContextType) => Promise<boolean>
  hasAnyPermission: (permissions: Permission[], context?: PermissionContextType) => Promise<boolean>
  hasAllPermissions: (permissions: Permission[], context?: PermissionContextType) => Promise<boolean>
  
  // Role management
  getProjectRole: (projectId: string) => Promise<ProjectRole | null>
  getWorkspaceRole: (workspaceId: string) => Promise<WorkspaceRole | null>
  getGlobalRole: () => Promise<string | null>
  
  // Cache management
  refreshPermissions: (projectId?: string) => Promise<void>
  clearCache: () => void
  
  // Convenience methods
  isProjectOwner: (projectId: string) => Promise<boolean>
  isProjectAdmin: (projectId: string) => Promise<boolean>
  canManageProject: (projectId: string) => Promise<boolean>
  canManageUsers: (projectId: string) => Promise<boolean>
}

const PermissionContext = createContext<PermissionContextValue | undefined>(undefined)

export const usePermissionContext = () => {
  const context = useContext(PermissionContext)
  if (context === undefined) {
    throw new Error('usePermissionContext must be used within a PermissionProvider')
  }
  return context
}

interface PermissionProviderProps {
  children: React.ReactNode
}

export const PermissionProvider: React.FC<PermissionProviderProps> = ({ children }) => {
  const { user } = useAuth()
  
  const [state, setState] = useState<PermissionState>({
    permissions: [],
    projectRoles: new Map(),
    workspaceRoles: new Map(),
    globalRole: null,
    loading: false,
    error: null
  })

  // Permission checking with caching
  const hasPermission = useCallback(async (
    permission: Permission, 
    context?: PermissionContextType
  ): Promise<boolean> => {
    if (!user?.id) return false
    
    try {
      const result = await permissionService.hasPermission(user.id, permission, context)
      return result.hasPermission
    } catch (error) {
      console.error('Error checking permission:', error)
      return false
    }
  }, [user?.id])

  const hasAnyPermission = useCallback(async (
    permissions: Permission[], 
    context?: PermissionContextType
  ): Promise<boolean> => {
    if (!user?.id) return false
    
    try {
      const result = await permissionService.hasAnyPermission(user.id, permissions, context)
      return result.hasPermission
    } catch (error) {
      console.error('Error checking permissions:', error)
      return false
    }
  }, [user?.id])

  const hasAllPermissions = useCallback(async (
    permissions: Permission[], 
    context?: PermissionContextType
  ): Promise<boolean> => {
    if (!user?.id) return false
    
    try {
      const results = await permissionService.hasPermissions(user.id, permissions, context)
      // Convert results object to array and check all permissions
      return permissions.every(permission => results[permission]?.hasPermission === true)
    } catch (error) {
      console.error('Error checking permissions:', error)
      return false
    }
  }, [user?.id])

  // Role management with caching
  const getProjectRole = useCallback(async (projectId: string): Promise<ProjectRole | null> => {
    if (!user?.id) return null
    
    // Check cache first
    if (state.projectRoles.has(projectId)) {
      return state.projectRoles.get(projectId) || null
    }
    
    try {
      const role = await permissionService.getUserProjectRole(projectId, user.id)
      
      // Update cache
      setState(prev => ({
        ...prev,
        projectRoles: new Map(prev.projectRoles.set(projectId, role))
      }))
      
      return role
    } catch (error) {
      console.error('Error fetching project role:', error)
      return null
    }
  }, [user?.id, state.projectRoles])

  const getWorkspaceRole = useCallback(async (workspaceId: string): Promise<WorkspaceRole | null> => {
    if (!user?.id) return null
    
    // Check cache first
    if (state.workspaceRoles.has(workspaceId)) {
      return state.workspaceRoles.get(workspaceId) || null
    }
    
    try {
      const role = await permissionService.getUserWorkspaceRole(workspaceId, user.id)
      
      // Update cache
      setState(prev => ({
        ...prev,
        workspaceRoles: new Map(prev.workspaceRoles.set(workspaceId, role))
      }))
      
      return role
    } catch (error) {
      console.error('Error fetching workspace role:', error)
      return null
    }
  }, [user?.id, state.workspaceRoles])

  const getGlobalRole = useCallback(async (): Promise<string | null> => {
    if (!user?.id) return null
    
    // Check cache first
    if (state.globalRole !== null) {
      return state.globalRole
    }
    
    try {
      const role = await permissionService.getUserGlobalRole(user.id)
      
      // Update cache
      setState(prev => ({
        ...prev,
        globalRole: role
      }))
      
      return role
    } catch (error) {
      // Suppress error logging for missing profiles table (expected during development)
      if (error instanceof Error && !error.message.includes('relation "public.profiles" does not exist')) {
        console.error('Error fetching global role:', error)
      }
      return 'user' // Return default role instead of null
    }
  }, [user?.id, state.globalRole])

  // Cache management
  const refreshPermissions = useCallback(async (projectId?: string) => {
    if (!user?.id) return
    
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      // Clear relevant cache
      if (projectId) {
        setState(prev => ({
          ...prev,
          projectRoles: new Map(prev.projectRoles).set(projectId, null)
        }))
      } else {
        // Clear all cache
        setState(prev => ({
          ...prev,
          projectRoles: new Map(),
          workspaceRoles: new Map(),
          globalRole: null
        }))
      }
      
      // Refresh permissions from service cache
      permissionService.clearCache(user.id)
      
    } catch (error) {
      console.error('Error refreshing permissions:', error)
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to refresh permissions' 
      }))
    } finally {
      setState(prev => ({ ...prev, loading: false }))
    }
  }, [user?.id])

  const clearCache = useCallback(() => {
    setState(prev => ({
      ...prev,
      projectRoles: new Map(),
      workspaceRoles: new Map(),
      globalRole: null,
      permissions: []
    }))
    
    if (user?.id) {
      permissionService.clearCache(user.id)
    }
  }, [user?.id])

  // Convenience methods
  const isProjectOwner = useCallback(async (projectId: string): Promise<boolean> => {
    const role = await getProjectRole(projectId)
    return role === 'owner'
  }, [getProjectRole])

  const isProjectAdmin = useCallback(async (projectId: string): Promise<boolean> => {
    const role = await getProjectRole(projectId)
    return role === 'admin' || role === 'owner'
  }, [getProjectRole])

  const canManageProject = useCallback(async (projectId: string): Promise<boolean> => {
    return await hasPermission('project.edit', { projectId })
  }, [hasPermission])

  const canManageUsers = useCallback(async (projectId: string): Promise<boolean> => {
    return await hasAnyPermission(['team.invite', 'team.remove', 'team.role.change'], { projectId })
  }, [hasAnyPermission])

  // Clear cache when user changes
  useEffect(() => {
    if (!user) {
      clearCache()
    }
  }, [user, clearCache])

  const contextValue = useMemo<PermissionContextValue>(() => ({
    permissions: state.permissions,
    loading: state.loading,
    error: state.error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getProjectRole,
    getWorkspaceRole,
    getGlobalRole,
    refreshPermissions,
    clearCache,
    isProjectOwner,
    isProjectAdmin,
    canManageProject,
    canManageUsers
  }), [
    state.permissions,
    state.loading,
    state.error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getProjectRole,
    getWorkspaceRole,
    getGlobalRole,
    refreshPermissions,
    clearCache,
    isProjectOwner,
    isProjectAdmin,
    canManageProject,
    canManageUsers
  ])

  return (
    <PermissionContext.Provider value={contextValue}>
      {children}
    </PermissionContext.Provider>
  )
}

export default PermissionContext 