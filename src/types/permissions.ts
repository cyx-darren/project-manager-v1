// Permission Types and Enums for Project Management System
import React from 'react'

// Role types based on our database schema
export type ProjectRole = 'owner' | 'admin' | 'member' | 'viewer'
export type TeamRole = 'owner' | 'admin' | 'member'
export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer'

// Enhanced permission types aligned with database schema
export type ProjectPermission = 
  // Project management
  | 'project.view'
  | 'project.edit'
  | 'project.delete'
  | 'project.archive'
  | 'project.restore'
  | 'project.settings'
  | 'project.share'
  
  // Task management
  | 'task.view'
  | 'task.create'
  | 'task.edit'
  | 'task.delete'
  | 'task.assign'
  | 'task.status.change'
  | 'task.priority.change'
  | 'task.comment'
  
  // Team management
  | 'team.view'
  | 'team.invite'
  | 'team.remove'
  | 'team.role.change'
  
  // Comments and collaboration
  | 'comment.view'
  | 'comment.create'
  | 'comment.edit'
  | 'comment.delete'
  
  // Attachments
  | 'attachment.view'
  | 'attachment.upload'
  | 'attachment.delete'
  
  // Analytics and reporting
  | 'analytics.view'
  | 'report.generate'

// Workspace-level permissions
export type WorkspacePermission = 
  | 'workspace.view'
  | 'workspace.edit'
  | 'workspace.delete'
  | 'workspace.settings'
  | 'workspace.invite'
  | 'workspace.remove_member'
  | 'workspace.manage_roles'
  | 'workspace.create_projects'
  | 'workspace.manage_projects'

// Global permissions for system-wide features
export type GlobalPermission = 
  | 'system.admin'
  | 'user.manage'
  | 'workspace.create'

// Combined permission type
export type Permission = ProjectPermission | WorkspacePermission | GlobalPermission

// Enhanced permission context with workspace support
export interface PermissionContext {
  workspaceId?: string
  projectId?: string
  taskId?: string
  userId?: string
}

// Permission check result interface
export interface PermissionResult {
  hasPermission: boolean
  reason?: string
  requiredRole?: ProjectRole | WorkspaceRole
  source?: 'role' | 'custom' | 'inherited'
}

// Custom permission interface for user-specific overrides
export interface CustomPermission {
  userId: string
  permission: Permission
  context: PermissionContext
  granted: boolean
  grantedBy: string
  grantedAt: Date
}

// Utility type for permission-aware component props
export interface WithPermissionProps {
  requiredPermission?: Permission
  requiredRole?: ProjectRole | WorkspaceRole
  projectId?: string
  workspaceId?: string
  fallback?: React.ReactNode
  children?: React.ReactNode
}

// Permission error types
export class PermissionError extends Error {
  public code: string
  public requiredPermission?: Permission
  public userRole?: ProjectRole | WorkspaceRole
  
  constructor(
    message: string, 
    code: string = 'PERMISSION_DENIED',
    requiredPermission?: Permission,
    userRole?: ProjectRole | WorkspaceRole
  ) {
    super(message)
    this.name = 'PermissionError'
    this.code = code
    this.requiredPermission = requiredPermission
    this.userRole = userRole
  }
}

// Role to permission mapping for projects
export const PROJECT_ROLE_PERMISSIONS: Record<ProjectRole, ProjectPermission[]> = {
  owner: [
    // All permissions for project owners
    'project.view', 'project.edit', 'project.delete', 'project.archive', 'project.restore', 'project.settings', 'project.share',
    'task.view', 'task.create', 'task.edit', 'task.delete', 'task.assign', 'task.status.change', 'task.priority.change', 'task.comment',
    'team.view', 'team.invite', 'team.remove', 'team.role.change',
    'comment.view', 'comment.create', 'comment.edit', 'comment.delete',
    'attachment.view', 'attachment.upload', 'attachment.delete',
    'analytics.view', 'report.generate'
  ],
  admin: [
    // Admin permissions (everything except delete project)
    'project.view', 'project.edit', 'project.archive', 'project.restore', 'project.settings', 'project.share',
    'task.view', 'task.create', 'task.edit', 'task.delete', 'task.assign', 'task.status.change', 'task.priority.change', 'task.comment',
    'team.view', 'team.invite', 'team.remove', 'team.role.change',
    'comment.view', 'comment.create', 'comment.edit', 'comment.delete',
    'attachment.view', 'attachment.upload', 'attachment.delete',
    'analytics.view', 'report.generate'
  ],
  member: [
    // Member permissions (can contribute but limited management)
    'project.view', 'project.share',
    'task.view', 'task.create', 'task.edit', 'task.assign', 'task.status.change', 'task.priority.change', 'task.comment',
    'team.view',
    'comment.view', 'comment.create', 'comment.edit',
    'attachment.view', 'attachment.upload',
    'analytics.view'
  ],
  viewer: [
    // Viewer permissions (read-only access)
    'project.view',
    'task.view',
    'team.view',
    'comment.view',
    'attachment.view',
    'analytics.view'
  ]
}

// Role to permission mapping for workspaces
export const WORKSPACE_ROLE_PERMISSIONS: Record<WorkspaceRole, WorkspacePermission[]> = {
  owner: [
    // All workspace permissions
    'workspace.view', 'workspace.edit', 'workspace.delete', 'workspace.settings',
    'workspace.invite', 'workspace.remove_member', 'workspace.manage_roles',
    'workspace.create_projects', 'workspace.manage_projects'
  ],
  admin: [
    // Admin permissions (everything except delete workspace)
    'workspace.view', 'workspace.edit', 'workspace.settings',
    'workspace.invite', 'workspace.remove_member', 'workspace.manage_roles',
    'workspace.create_projects', 'workspace.manage_projects'
  ],
  member: [
    // Member permissions (can contribute but limited management)
    'workspace.view',
    'workspace.create_projects'
  ],
  viewer: [
    // Viewer permissions (read-only access)
    'workspace.view'
  ]
}

// Global role permissions (for system-wide roles)
export const GLOBAL_ROLE_PERMISSIONS: Record<string, GlobalPermission[]> = {
  'system_admin': ['system.admin', 'user.manage', 'workspace.create'],
  'user': ['workspace.create']
}

// Helper type guards
export const isProjectPermission = (permission: Permission): permission is ProjectPermission => {
  return permission.startsWith('project.') || permission.startsWith('task.') || 
         permission.startsWith('team.') || permission.startsWith('comment.') ||
         permission.startsWith('attachment.') || permission.startsWith('analytics.') ||
         permission.startsWith('report.')
}

export const isWorkspacePermission = (permission: Permission): permission is WorkspacePermission => {
  return permission.startsWith('workspace.')
}

export const isGlobalPermission = (permission: Permission): permission is GlobalPermission => {
  return ['system.admin', 'user.manage', 'workspace.create'].includes(permission)
}

// Permission utility functions
export const getPermissionsForProjectRole = (role: ProjectRole): ProjectPermission[] => {
  return PROJECT_ROLE_PERMISSIONS[role] || []
}

export const getPermissionsForWorkspaceRole = (role: WorkspaceRole): WorkspacePermission[] => {
  return WORKSPACE_ROLE_PERMISSIONS[role] || []
}

export const hasProjectRolePermission = (role: ProjectRole, permission: ProjectPermission): boolean => {
  return getPermissionsForProjectRole(role).includes(permission)
}

export const hasWorkspaceRolePermission = (role: WorkspaceRole, permission: WorkspacePermission): boolean => {
  return getPermissionsForWorkspaceRole(role).includes(permission)
}

// Legacy function for backward compatibility
export const getPermissionsForRole = (role: ProjectRole): ProjectPermission[] => {
  return getPermissionsForProjectRole(role)
}

export const hasRolePermission = (role: ProjectRole, permission: ProjectPermission): boolean => {
  return hasProjectRolePermission(role, permission)
}

export const getHighestProjectRole = (roles: ProjectRole[]): ProjectRole => {
  const roleHierarchy: Record<ProjectRole, number> = {
    owner: 4,
    admin: 3,
    member: 2,
    viewer: 1
  }
  
  return roles.reduce((highest, current) => {
    return roleHierarchy[current] > roleHierarchy[highest] ? current : highest
  }, 'viewer')
}

export const getHighestWorkspaceRole = (roles: WorkspaceRole[]): WorkspaceRole => {
  const roleHierarchy: Record<WorkspaceRole, number> = {
    owner: 4,
    admin: 3,
    member: 2,
    viewer: 1
  }
  
  return roles.reduce((highest, current) => {
    return roleHierarchy[current] > roleHierarchy[highest] ? current : highest
  }, 'viewer')
}

export const canRolePerformAction = (
  userRole: ProjectRole, 
  targetRole: ProjectRole, 
  action: 'promote' | 'demote' | 'remove'
): boolean => {
  const roleHierarchy: Record<ProjectRole, number> = {
    owner: 4,
    admin: 3,
    member: 2,
    viewer: 1
  }
  
  const userLevel = roleHierarchy[userRole]
  const targetLevel = roleHierarchy[targetRole]
  
  // Owners can do anything to anyone (except other owners for some actions)
  if (userRole === 'owner') {
    if (action === 'remove' && targetRole === 'owner') return false
    return true
  }
  
  // Admins can manage members and viewers
  if (userRole === 'admin') {
    return targetLevel < roleHierarchy.admin
  }
  
  // Members and viewers cannot manage others
  return false
}

export const canWorkspaceRolePerformAction = (
  userRole: WorkspaceRole, 
  targetRole: WorkspaceRole, 
  action: 'promote' | 'demote' | 'remove'
): boolean => {
  const roleHierarchy: Record<WorkspaceRole, number> = {
    owner: 4,
    admin: 3,
    member: 2,
    viewer: 1
  }
  
  const userLevel = roleHierarchy[userRole]
  const targetLevel = roleHierarchy[targetRole]
  
  // Owners can do anything to anyone (except other owners for some actions)
  if (userRole === 'owner') {
    if (action === 'remove' && targetRole === 'owner') return false
    return true
  }
  
  // Admins can manage members and viewers
  if (userRole === 'admin') {
    return targetLevel < roleHierarchy.admin
  }
  
  // Members and viewers cannot manage others
  return false
} 