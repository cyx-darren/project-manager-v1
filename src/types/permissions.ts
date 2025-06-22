// Permission Types and Enums for Project Management System
import React from 'react'

// Role types based on our database schema
export type ProjectRole = 'owner' | 'admin' | 'member' | 'viewer'
export type TeamRole = 'owner' | 'admin' | 'member'

// Comprehensive permission types for different aspects of the system
export type ProjectPermission = 
  // Project management
  | 'project.view'
  | 'project.edit'
  | 'project.delete'
  | 'project.archive'
  | 'project.restore'
  | 'project.settings'
  
  // Task management
  | 'task.view'
  | 'task.create'
  | 'task.edit'
  | 'task.delete'
  | 'task.assign'
  | 'task.status.change'
  | 'task.priority.change'
  
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

// Global permissions for system-wide features
export type GlobalPermission = 
  | 'system.admin'
  | 'user.manage'
  | 'project.create'

// Combined permission type
export type Permission = ProjectPermission | GlobalPermission

// Role to permission mapping
export const PROJECT_ROLE_PERMISSIONS: Record<ProjectRole, ProjectPermission[]> = {
  owner: [
    // All permissions for project owners
    'project.view', 'project.edit', 'project.delete', 'project.archive', 'project.restore', 'project.settings',
    'task.view', 'task.create', 'task.edit', 'task.delete', 'task.assign', 'task.status.change', 'task.priority.change',
    'team.view', 'team.invite', 'team.remove', 'team.role.change',
    'comment.view', 'comment.create', 'comment.edit', 'comment.delete',
    'attachment.view', 'attachment.upload', 'attachment.delete',
    'analytics.view', 'report.generate'
  ],
  admin: [
    // Admin permissions (everything except delete project and some settings)
    'project.view', 'project.edit', 'project.archive', 'project.restore', 'project.settings',
    'task.view', 'task.create', 'task.edit', 'task.delete', 'task.assign', 'task.status.change', 'task.priority.change',
    'team.view', 'team.invite', 'team.remove', 'team.role.change',
    'comment.view', 'comment.create', 'comment.edit', 'comment.delete',
    'attachment.view', 'attachment.upload', 'attachment.delete',
    'analytics.view', 'report.generate'
  ],
  member: [
    // Member permissions (can contribute but limited management)
    'project.view',
    'task.view', 'task.create', 'task.edit', 'task.assign', 'task.status.change', 'task.priority.change',
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

// Global role permissions (for system-wide roles)
export const GLOBAL_ROLE_PERMISSIONS: Record<string, GlobalPermission[]> = {
  'system_admin': ['system.admin', 'user.manage', 'project.create'],
  'user': ['project.create']
}

// Permission context interface
export interface PermissionContext {
  projectId?: string
  taskId?: string
  userId?: string
}

// Permission check result interface
export interface PermissionResult {
  hasPermission: boolean
  reason?: string
  requiredRole?: ProjectRole
}

// Utility type for permission-aware component props
export interface WithPermissionProps {
  requiredPermission?: Permission
  requiredRole?: ProjectRole
  projectId?: string
  fallback?: React.ReactNode
  children?: React.ReactNode
}

// Permission error types
export class PermissionError extends Error {
  public code: string
  public requiredPermission?: Permission
  public userRole?: ProjectRole
  
  constructor(
    message: string, 
    code: string = 'PERMISSION_DENIED',
    requiredPermission?: Permission,
    userRole?: ProjectRole
  ) {
    super(message)
    this.name = 'PermissionError'
    this.code = code
    this.requiredPermission = requiredPermission
    this.userRole = userRole
  }
}

// Helper type guards
export const isProjectPermission = (permission: Permission): permission is ProjectPermission => {
  return permission.includes('.')
}

export const isGlobalPermission = (permission: Permission): permission is GlobalPermission => {
  return ['system.admin', 'user.manage', 'project.create'].includes(permission)
}

// Permission utility functions
export const getPermissionsForRole = (role: ProjectRole): ProjectPermission[] => {
  return PROJECT_ROLE_PERMISSIONS[role] || []
}

export const hasRolePermission = (role: ProjectRole, permission: ProjectPermission): boolean => {
  return getPermissionsForRole(role).includes(permission)
}

export const getHighestRole = (roles: ProjectRole[]): ProjectRole => {
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