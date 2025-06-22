import React from 'react'
import { usePermission, useAnyPermission, useProjectRole } from '../../hooks/usePermissions'
import type { 
  Permission, 
  ProjectRole,
  PermissionContext,
  WithPermissionProps
} from '../../types/permissions'
import LoadingSpinner from '../LoadingSpinner'

interface PermissionGuardProps extends WithPermissionProps {
  // Permission-based access
  requiredPermission?: Permission
  requiredPermissions?: Permission[] // Requires ALL permissions
  anyPermissions?: Permission[] // Requires ANY permission
  
  // Role-based access
  requiredRole?: ProjectRole
  minimumRole?: ProjectRole // User must have this role or higher
  
  // Context
  projectId?: string
  context?: PermissionContext
  
  // Rendering options
  children: React.ReactNode
  fallback?: React.ReactNode
  loadingComponent?: React.ReactNode
  showReason?: boolean
  
  // Behavior options
  hideOnNoPermission?: boolean // If true, renders nothing instead of fallback
  invertLogic?: boolean // If true, shows content when permission is NOT met
}

/**
 * Permission Guard Component
 * 
 * Conditionally renders children based on user permissions or roles.
 * Supports multiple permission checking strategies and provides loading states.
 */
const PermissionGuard: React.FC<PermissionGuardProps> = ({
  requiredPermission,
  requiredPermissions,
  anyPermissions,
  requiredRole,
  minimumRole,
  projectId,
  context,
  children,
  fallback = null,
  loadingComponent,
  showReason = false,
  hideOnNoPermission = false,
  invertLogic = false
}) => {
  // Determine the context to use
  const permissionContext: PermissionContext = context || { projectId }

  // Permission checks
  const singlePermissionCheck = usePermission(
    requiredPermission!, 
    requiredPermission ? permissionContext : undefined
  )
  
  const anyPermissionCheck = useAnyPermission(
    anyPermissions || [], 
    anyPermissions ? permissionContext : undefined
  )

  // Role checks
  const projectRoleCheck = useProjectRole(projectId)

  // Determine loading state
  const isLoading = (
    (requiredPermission && singlePermissionCheck.loading) ||
    (anyPermissions && anyPermissionCheck.loading) ||
    (projectId && (requiredRole || minimumRole) && projectRoleCheck.loading)
  )

  // Show loading component if still checking permissions
  if (isLoading) {
    return loadingComponent ? <>{loadingComponent}</> : <LoadingSpinner size="sm" />
  }

  // Helper function to check role hierarchy
  const checkRoleHierarchy = (userRole: ProjectRole | null, minRole: ProjectRole): boolean => {
    if (!userRole) return false
    
    const roleHierarchy: Record<ProjectRole, number> = {
      owner: 4,
      admin: 3,
      member: 2,
      viewer: 1
    }
    
    return roleHierarchy[userRole] >= roleHierarchy[minRole]
  }

  // Determine if user has required access
  let hasAccess = true
  let reason = ''

  // Check single permission
  if (requiredPermission) {
    hasAccess = hasAccess && singlePermissionCheck.hasPermission
    if (!singlePermissionCheck.hasPermission) {
      reason = singlePermissionCheck.reason || `Missing permission: ${requiredPermission}`
    }
  }

  // Check multiple permissions (ALL required)
  if (requiredPermissions && requiredPermissions.length > 0) {
    for (const permission of requiredPermissions) {
      const check = usePermission(permission, permissionContext)
      if (!check.hasPermission) {
        hasAccess = false
        reason = check.reason || `Missing permission: ${permission}`
        break
      }
    }
  }

  // Check any permissions (ANY required)
  if (anyPermissions && anyPermissions.length > 0) {
    hasAccess = hasAccess && anyPermissionCheck.hasPermission
    if (!anyPermissionCheck.hasPermission) {
      reason = anyPermissionCheck.reason || `Missing any of permissions: ${anyPermissions.join(', ')}`
    }
  }

  // Check required role
  if (requiredRole) {
    const userHasRole = projectRoleCheck.role === requiredRole
    hasAccess = hasAccess && userHasRole
    if (!userHasRole) {
      reason = `Required role: ${requiredRole}, current role: ${projectRoleCheck.role || 'none'}`
    }
  }

  // Check minimum role
  if (minimumRole) {
    const userMeetsMinimum = checkRoleHierarchy(projectRoleCheck.role, minimumRole)
    hasAccess = hasAccess && userMeetsMinimum
    if (!userMeetsMinimum) {
      reason = `Minimum role required: ${minimumRole}, current role: ${projectRoleCheck.role || 'none'}`
    }
  }

  // Apply invert logic if specified
  if (invertLogic) {
    hasAccess = !hasAccess
  }

  // Render based on access
  if (hasAccess) {
    return <>{children}</>
  }

  // No access - determine what to show
  if (hideOnNoPermission) {
    return null
  }

  // Show fallback with optional reason
  if (showReason && reason) {
    return (
      <div className="text-sm text-gray-500 italic p-2 bg-gray-50 rounded border">
        Access denied: {reason}
      </div>
    )
  }

  return <>{fallback}</>
}

export default PermissionGuard

/**
 * Convenient wrapper components for common use cases
 */

interface ProjectPermissionGuardProps {
  projectId: string
  permission: Permission
  children: React.ReactNode
  fallback?: React.ReactNode
  showReason?: boolean
}

export const ProjectPermissionGuard: React.FC<ProjectPermissionGuardProps> = ({
  projectId,
  permission,
  children,
  fallback,
  showReason
}) => (
  <PermissionGuard
    requiredPermission={permission}
    projectId={projectId}
    fallback={fallback}
    showReason={showReason}
  >
    {children}
  </PermissionGuard>
)

interface RoleGuardProps {
  projectId?: string
  requiredRole?: ProjectRole
  minimumRole?: ProjectRole
  children: React.ReactNode
  fallback?: React.ReactNode
  showReason?: boolean
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  projectId,
  requiredRole,
  minimumRole,
  children,
  fallback,
  showReason
}) => (
  <PermissionGuard
    projectId={projectId}
    requiredRole={requiredRole}
    minimumRole={minimumRole}
    fallback={fallback}
    showReason={showReason}
  >
    {children}
  </PermissionGuard>
)

interface AdminOnlyProps {
  projectId?: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export const AdminOnly: React.FC<AdminOnlyProps> = ({
  projectId,
  children,
  fallback = <div className="text-gray-500">Admin access required</div>
}) => (
  <PermissionGuard
    projectId={projectId}
    minimumRole="admin"
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
)

interface OwnerOnlyProps {
  projectId?: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export const OwnerOnly: React.FC<OwnerOnlyProps> = ({
  projectId,
  children,
  fallback = <div className="text-gray-500">Owner access required</div>
}) => (
  <PermissionGuard
    projectId={projectId}
    requiredRole="owner"
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
)

/**
 * Higher-Order Component for permission-based access
 */
export const withPermission = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  permission: Permission,
  projectIdProp?: keyof P,
  fallback?: React.ReactNode
) => {
  const WithPermissionComponent: React.FC<P> = (props) => {
    const projectId = projectIdProp ? (props[projectIdProp] as string) : undefined

    return (
      <PermissionGuard
        requiredPermission={permission}
        projectId={projectId}
        fallback={fallback}
      >
        <WrappedComponent {...props} />
      </PermissionGuard>
    )
  }

  WithPermissionComponent.displayName = `withPermission(${WrappedComponent.displayName || WrappedComponent.name})`
  
  return WithPermissionComponent
}

/**
 * Higher-Order Component for role-based access
 */
export const withRole = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  minimumRole: ProjectRole,
  projectIdProp?: keyof P,
  fallback?: React.ReactNode
) => {
  const WithRoleComponent: React.FC<P> = (props) => {
    const projectId = projectIdProp ? (props[projectIdProp] as string) : undefined

    return (
      <PermissionGuard
        minimumRole={minimumRole}
        projectId={projectId}
        fallback={fallback}
      >
        <WrappedComponent {...props} />
      </PermissionGuard>
    )
  }

  WithRoleComponent.displayName = `withRole(${WrappedComponent.displayName || WrappedComponent.name})`
  
  return WithRoleComponent
} 