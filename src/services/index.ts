// Export all services
export { projectService } from './projectService'
export { taskService, subtaskService, TaskError, TaskPermissionError } from './taskService'
export { permissionService } from './permissionService'
export { workspaceService } from './workspaceService'
export { collaborationService } from './collaborationService'
export { realtimeService } from './realtimeService'
export { conflictResolutionService } from './conflictResolutionService'

// User Management Components
export { UserInvitationForm } from '../components/user-management/UserInvitationForm'
export { UserRoleManager } from '../components/user-management/UserRoleManager'
export { UserDirectory } from '../components/user-management/UserDirectory'
export { InvitationManager } from '../components/user-management/InvitationManager'
export { UserManagementDemo } from '../components/user-management/UserManagementDemo'

// Document Sharing Components
export { ShareButton } from '../components/document-sharing/ShareButton'
export { ShareModal } from '../components/document-sharing/ShareModal'
export { ShareAnalytics } from '../components/document-sharing/ShareAnalytics'
export { DocumentSharingDemo } from '../components/document-sharing/DocumentSharingDemo'

// Document Sharing Service
export { documentSharingService } from './documentSharingService'

// Re-export types for convenience
export type {
  Project,
  ProjectInsert,
  ProjectUpdate,
  ProjectWithMembers,
  ProjectWithTasks,
  Task,
  TaskInsert,
  TaskUpdate,
  TaskWithSubtasks,
  Subtask,
  SubtaskInsert,
  SubtaskUpdate,
  ProjectMember,
  ProjectMemberInsert,
  ProjectMemberUpdate,
  ApiResponse,
  PaginatedResponse,
  MemberRole,
  TaskStatus,
  PriorityLevel,
  ProjectStatus
} from '../types/supabase'

// Export permission types
export type {
  Permission,
  ProjectPermission,
  GlobalPermission,
  ProjectRole,
  TeamRole,
  PermissionContext,
  PermissionResult,
  WithPermissionProps
} from '../types/permissions'
export { PermissionError } from '../types/permissions'

// Export Supabase client and utilities
export { supabase, getCurrentUser, getAuthenticatedClient, testSupabaseConnection } from '../config/supabase' 