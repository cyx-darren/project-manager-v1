import type { ReactNode } from 'react'
import { useAuth, useRole, useAuthorization } from '../../contexts/AuthContext'
import type { Permission } from '../../types/permissions'

interface RoleGuardProps {
  children: ReactNode
  requiredRole?: 'admin' | 'member' | 'guest'
  requiredPermissions?: Permission[]
  requireAll?: boolean // Whether to require ALL permissions or ANY permission
  fallback?: ReactNode
}

/**
 * RoleGuard component for role-based access control
 * Renders children only if user meets role/permission requirements
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  requiredRole,
  requiredPermissions = [],
  requireAll = true,
  fallback = null
}) => {
  const { user, hasRole, hasAllPermissions, hasAnyPermission } = useAuth()

  // Check if user is authenticated
  if (!user) {
    return <>{fallback}</>
  }

  // Check role requirement
  if (requiredRole && !hasRole(requiredRole)) {
    return <>{fallback}</>
  }

  // Check permission requirements
  if (requiredPermissions.length > 0) {
    const hasRequiredPermissions = requireAll 
      ? hasAllPermissions(requiredPermissions)
      : hasAnyPermission(requiredPermissions)
    
    if (!hasRequiredPermissions) {
      return <>{fallback}</>
    }
  }

  return <>{children}</>
}

interface AdminOnlyProps {
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Convenience component for admin-only content
 */
export const AdminOnly: React.FC<AdminOnlyProps> = ({ children, fallback }) => (
  <RoleGuard requiredRole="admin" fallback={fallback}>
    {children}
  </RoleGuard>
)

interface MemberOrAboveProps {
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Convenience component for member or admin content
 */
export const MemberOrAbove: React.FC<MemberOrAboveProps> = ({ children, fallback }) => {
  const role = useRole()
  
  if (role === 'guest') {
    return <>{fallback}</>
  }
  
  return <>{children}</>
}

interface PermissionGuardProps {
  children: ReactNode
  permissions: Permission[]
  requireAll?: boolean
  fallback?: ReactNode
}

/**
 * Component for permission-based access control
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permissions,
  requireAll = true,
  fallback = null
}) => {
  const { hasAllPermissions, hasAnyPermission } = useAuth()
  
  const canAccess = requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions)
  
  return canAccess ? <>{children}</> : <>{fallback}</>
}

// Access denied component
export const AccessDenied: React.FC<{ message?: string }> = ({ 
  message = "You don't have permission to access this content." 
}) => (
  <div className="flex items-center justify-center p-8">
    <div className="text-center">
      <div className="text-6xl mb-4">🔒</div>
      <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
      <p className="text-gray-600">{message}</p>
    </div>
  </div>
)

// User role badge component
export const UserRoleBadge: React.FC = () => {
  const role = useRole()
  const { user } = useAuth()
  
  if (!user || !role) return null
  
  const roleColors = {
    admin: 'bg-red-100 text-red-800',
    member: 'bg-blue-100 text-blue-800',
    guest: 'bg-gray-100 text-gray-800'
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[role] || 'bg-gray-100 text-gray-800'}`}>
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </span>
  )
} 