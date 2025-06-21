import type { ReactNode } from 'react'
import { useProject, useProjectRole } from '../../contexts/ProjectContext'
import type { ProjectPermission, ProjectAction } from '../../contexts/ProjectContext'
import type { MemberRole } from '../../services/teamService'
import { AccessDenied } from './RoleGuard'

interface ProjectRoleGuardProps {
  children: ReactNode
  requiredRole?: MemberRole
  requiredPermissions?: ProjectPermission[]
  requiredActions?: ProjectAction[]
  requireAll?: boolean // Whether to require ALL permissions/actions or ANY
  fallback?: ReactNode
  requireProject?: boolean // Whether to require a current project to be set
}

/**
 * ProjectRoleGuard component for project-specific role-based access control
 * Renders children only if user meets project role/permission requirements
 */
export const ProjectRoleGuard: React.FC<ProjectRoleGuardProps> = ({
  children,
  requiredRole,
  requiredPermissions = [],
  requiredActions = [],
  requireAll = true,
  fallback = null,
  requireProject = true
}) => {
  const { 
    currentProject, 
    userRoleInProject, 
    hasProjectRole, 
    hasProjectPermission, 
    canPerformAction 
  } = useProject()

  // Check if project is required but not set
  if (requireProject && !currentProject) {
    return <>{fallback || <AccessDenied message="Please select a project to access this content." />}</>
  }

  // Check if user has a role in the project
  if (requireProject && !userRoleInProject) {
    return <>{fallback || <AccessDenied message="You are not a member of this project." />}</>
  }

  // Check role requirement
  if (requiredRole && !hasProjectRole(requiredRole)) {
    return <>{fallback || <AccessDenied message={`${requiredRole} role required for this project.`} />}</>
  }

  // Check permission requirements
  if (requiredPermissions.length > 0) {
    const hasRequiredPermissions = requireAll 
      ? requiredPermissions.every(permission => hasProjectPermission(permission))
      : requiredPermissions.some(permission => hasProjectPermission(permission))
    
    if (!hasRequiredPermissions) {
      return <>{fallback || <AccessDenied message="Insufficient permissions for this project action." />}</>
    }
  }

  // Check action requirements
  if (requiredActions.length > 0) {
    const canPerformRequiredActions = requireAll 
      ? requiredActions.every(action => canPerformAction(action))
      : requiredActions.some(action => canPerformAction(action))
    
    if (!canPerformRequiredActions) {
      return <>{fallback || <AccessDenied message="You cannot perform this action in this project." />}</>
    }
  }

  return <>{children}</>
}

interface ProjectOwnerOnlyProps {
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Convenience component for project owner-only content
 */
export const ProjectOwnerOnly: React.FC<ProjectOwnerOnlyProps> = ({ children, fallback }) => (
  <ProjectRoleGuard requiredRole="owner" fallback={fallback}>
    {children}
  </ProjectRoleGuard>
)

interface ProjectAdminOrAboveProps {
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Convenience component for project admin or owner content
 */
export const ProjectAdminOrAbove: React.FC<ProjectAdminOrAboveProps> = ({ children, fallback }) => (
  <ProjectRoleGuard requiredRole="admin" fallback={fallback}>
    {children}
  </ProjectRoleGuard>
)

interface ProjectMemberOrAboveProps {
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Convenience component for project member, admin, or owner content
 */
export const ProjectMemberOrAbove: React.FC<ProjectMemberOrAboveProps> = ({ children, fallback }) => (
  <ProjectRoleGuard requiredRole="member" fallback={fallback}>
    {children}
  </ProjectRoleGuard>
)

interface CanManageMembersProps {
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Convenience component for member management permissions
 */
export const CanManageMembers: React.FC<CanManageMembersProps> = ({ children, fallback }) => (
  <ProjectRoleGuard requiredActions={['invite_members']} fallback={fallback}>
    {children}
  </ProjectRoleGuard>
)

interface CanManageTasksProps {
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Convenience component for task management permissions
 */
export const CanManageTasks: React.FC<CanManageTasksProps> = ({ children, fallback }) => (
  <ProjectRoleGuard requiredPermissions={['create_tasks', 'edit_tasks']} requireAll={false} fallback={fallback}>
    {children}
  </ProjectRoleGuard>
)

// Project role badge component
export const ProjectRoleBadge: React.FC<{ className?: string }> = ({ className = '' }) => {
  const role = useProjectRole()
  const { currentProject } = useProject()
  
  if (!role || !currentProject) return null
  
  const roleColors = {
    owner: 'bg-purple-100 text-purple-800 border-purple-200',
    admin: 'bg-red-100 text-red-800 border-red-200',
    member: 'bg-blue-100 text-blue-800 border-blue-200'
  }
  
  const roleIcons = {
    owner: '👑',
    admin: '⚡',
    member: '👤'
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${roleColors[role]} ${className}`}>
      <span className="mr-1">{roleIcons[role]}</span>
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </span>
  )
}

// Project permission display component
export const ProjectPermissionsList: React.FC = () => {
  const { userRoleInProject, hasProjectPermission } = useProject()
  
  if (!userRoleInProject) return null
  
  const allPermissions: ProjectPermission[] = [
    'view_project', 'edit_project', 'delete_project',
    'manage_members', 'assign_tasks', 'create_tasks', 'edit_tasks', 'delete_tasks'
  ]
  
  const userPermissions = allPermissions.filter(permission => hasProjectPermission(permission))
  
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-gray-700">Your Project Permissions:</h4>
      <div className="flex flex-wrap gap-1">
        {userPermissions.map(permission => (
          <span 
            key={permission} 
            className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-800"
          >
            ✓ {permission.replace('_', ' ')}
          </span>
        ))}
      </div>
    </div>
  )
} 