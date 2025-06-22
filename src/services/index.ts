// Export all services
export { projectService, ProjectError, ProjectPermissionError } from './projectService'
export { taskService, subtaskService, TaskError, TaskPermissionError } from './taskService'
export { permissionService } from './permissionService'

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