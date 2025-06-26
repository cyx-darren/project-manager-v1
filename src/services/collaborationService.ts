import { supabase, getCurrentUser } from '../config/supabase'
import { permissionService } from './permissionService'
import type { 
  ProjectInvitation,
  ProjectInvitationInsert,
  Comment,
  CommentInsert,
  CommentUpdate,
  Attachment,
  AttachmentInsert,
  ActivityLog,
  ActivityLogInsert,
  ApiResponse,
  PaginatedResponse,
  MemberRole,
  ActivityAction
} from '../types/supabase'
import type { PermissionContext } from '../types/permissions'

// Custom error classes
export class CollaborationError extends Error {
  public code?: string
  
  constructor(message: string, code?: string) {
    super(message)
    this.name = 'CollaborationError'
    this.code = code
  }
}

export class CollaborationPermissionError extends Error {
  constructor(message: string = 'Insufficient permissions for collaboration operation') {
    super(message)
    this.name = 'CollaborationPermissionError'
  }
}

// Helper function to check collaboration permissions
async function checkCollaborationPermission(
  permission: 'project.view' | 'project.edit' | 'team.invite' | 'team.remove' | 'team.role.change' | 'task.comment' | 'attachment.upload',
  projectId?: string,
  workspaceId?: string
): Promise<void> {
  const user = await getCurrentUser()
  if (!user) {
    throw new CollaborationPermissionError('Must be authenticated to perform collaboration operations')
  }

  const context: PermissionContext = { projectId, workspaceId }
  const result = await permissionService.hasPermission(user.id, permission, context)
  
  if (!result.hasPermission) {
    throw new CollaborationPermissionError(`Insufficient permissions: ${permission}. Required role: ${result.requiredRole || 'member'}`)
  }
}

// Document sharing types
export interface ShareDocumentRequest {
  entityType: 'project' | 'task' | 'workspace'
  entityId: string
  permissions: 'view' | 'edit' | 'admin'
  expiresAt?: string
  message?: string
}

export interface SharedDocument {
  id: string
  entityType: string
  entityId: string
  permissions: string
  shareToken: string
  expiresAt: string | null
  createdBy: string
  createdAt: string
  accessCount: number
}

// User invitation types
export interface InviteUserRequest {
  email: string
  role: MemberRole
  projectId: string
  message?: string
  expiresInDays?: number
}

export interface InvitationWithDetails extends ProjectInvitation {
  project?: {
    id: string
    title: string
    description: string | null
  }
  inviter?: {
    id: string
    email: string
    full_name: string | null
  }
}

// Comment types
export interface CommentWithAuthor extends Comment {
  author: {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
  }
  replies?: CommentWithAuthor[]
}

// Activity types
export interface ActivityWithDetails extends ActivityLog {
  user?: {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
  }
  project?: {
    id: string
    title: string
  }
}

// Collaboration service implementation
export const collaborationService = {
  // ========== DOCUMENT SHARING ==========
  
  /**
   * Create a shareable link for a document/entity
   */
  async shareDocument(request: ShareDocumentRequest): Promise<ApiResponse<SharedDocument>> {
    try {
      // Check permission to share the entity
      await checkCollaborationPermission('team.invite', request.entityId)

      // Generate a unique share token
      const shareToken = crypto.randomUUID()
      const expiresAt = request.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days default

      // For now, we'll store this in a simple format in the comments table with a special entity_type
      const { data, error } = await supabase
        .from('comments')
        .insert({
          entity_type: 'shared_document',
          entity_id: request.entityId,
          content: JSON.stringify({
            entityType: request.entityType,
            permissions: request.permissions,
            shareToken,
            expiresAt,
            message: request.message,
            accessCount: 0
          }),
          user_id: (await getCurrentUser())!.id
        })
        .select()
        .single()

      if (error) {
        throw new CollaborationError(error.message, error.code)
      }

      const sharedDocument: SharedDocument = {
        id: data.id,
        entityType: request.entityType,
        entityId: request.entityId,
        permissions: request.permissions,
        shareToken,
        expiresAt,
        createdBy: data.user_id,
        createdAt: data.created_at!,
        accessCount: 0
      }

      return {
        data: sharedDocument,
        error: null,
        success: true
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to share document'
      return {
        data: null,
        error: message,
        success: false
      }
    }
  },

  /**
   * Get shared document by token
   */
  async getSharedDocument(shareToken: string): Promise<ApiResponse<SharedDocument>> {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('entity_type', 'shared_document')
        .like('content', `%${shareToken}%`)
        .single()

      if (error) {
        throw new CollaborationError('Invalid or expired share link', 'INVALID_TOKEN')
      }

      const content = JSON.parse(data.content)
      
      // Check if link has expired
      if (content.expiresAt && new Date(content.expiresAt) < new Date()) {
        throw new CollaborationError('Share link has expired', 'EXPIRED_TOKEN')
      }

      // Increment access count
      await supabase
        .from('comments')
        .update({
          content: JSON.stringify({
            ...content,
            accessCount: (content.accessCount || 0) + 1
          })
        })
        .eq('id', data.id)

      const sharedDocument: SharedDocument = {
        id: data.id,
        entityType: content.entityType,
        entityId: data.entity_id,
        permissions: content.permissions,
        shareToken: content.shareToken,
        expiresAt: content.expiresAt,
        createdBy: data.user_id,
        createdAt: data.created_at!,
        accessCount: content.accessCount + 1
      }

      return {
        data: sharedDocument,
        error: null,
        success: true
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to access shared document'
      return {
        data: null,
        error: message,
        success: false
      }
    }
  },

  /**
   * Revoke a shared document link
   */
  async revokeSharedDocument(shareId: string): Promise<ApiResponse<boolean>> {
    try {
      const user = await getCurrentUser()
      if (!user) {
        throw new CollaborationPermissionError('Must be authenticated')
      }

      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', shareId)
        .eq('user_id', user.id)
        .eq('entity_type', 'shared_document')

      if (error) {
        throw new CollaborationError(error.message, error.code)
      }

      return {
        data: true,
        error: null,
        success: true
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to revoke shared document'
      return {
        data: null,
        error: message,
        success: false
      }
    }
  },

  // ========== USER INVITATIONS ==========

  /**
   * Invite a user to a project
   */
  async inviteUser(request: InviteUserRequest): Promise<ApiResponse<ProjectInvitation>> {
    try {
      // Check permission to manage project members
      await checkCollaborationPermission('team.invite', request.projectId)

      const user = await getCurrentUser()
      if (!user) {
        throw new CollaborationPermissionError('Must be authenticated')
      }

      // Check for existing pending invitation
      const { data: existingInvitation } = await supabase
        .from('project_invitations')
        .select('id')
        .eq('project_id', request.projectId)
        .eq('email', request.email)
        .is('accepted_at', null)
        .single()

      if (existingInvitation) {
        throw new CollaborationError('User already has a pending invitation', 'PENDING_INVITATION')
      }

      // Generate invitation token
      const token = crypto.randomUUID()
      const expiresAt = new Date(Date.now() + (request.expiresInDays || 7) * 24 * 60 * 60 * 1000).toISOString()

      const { data, error } = await supabase
        .from('project_invitations')
        .insert({
          project_id: request.projectId,
          email: request.email,
          role: request.role,
          token,
          expires_at: expiresAt,
          invited_by: user.id
        })
        .select()
        .single()

      if (error) {
        throw new CollaborationError(error.message, error.code)
      }

      // Log activity
      await this.logActivity({
        user_id: user.id,
        project_id: request.projectId,
        entity_type: 'invitation',
        entity_id: data.id,
        action: 'invited',
        details: {
          email: request.email,
          role: request.role,
          message: request.message
        }
      })

      return {
        data,
        error: null,
        success: true
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to invite user'
      return {
        data: null,
        error: message,
        success: false
      }
    }
  },

  /**
   * Accept a project invitation
   */
  async acceptInvitation(token: string): Promise<ApiResponse<boolean>> {
    try {
      const user = await getCurrentUser()
      if (!user) {
        throw new CollaborationPermissionError('Must be authenticated')
      }

      // Get invitation
      const { data: invitation, error: inviteError } = await supabase
        .from('project_invitations')
        .select('*, projects(title)')
        .eq('token', token)
        .is('accepted_at', null)
        .single()

      if (inviteError || !invitation) {
        throw new CollaborationError('Invalid or expired invitation', 'INVALID_TOKEN')
      }

      // Check if invitation has expired
      if (new Date(invitation.expires_at) < new Date()) {
        throw new CollaborationError('Invitation has expired', 'EXPIRED_INVITATION')
      }

      // Check if user email matches invitation
      if (user.email !== invitation.email) {
        throw new CollaborationError('This invitation is for a different email address', 'EMAIL_MISMATCH')
      }

      // Add user to project
      const { error: memberError } = await supabase
        .from('project_members')
        .insert({
          project_id: invitation.project_id,
          user_id: user.id,
          role: invitation.role || 'member'
        })

      if (memberError) {
        throw new CollaborationError(memberError.message, memberError.code)
      }

      // Mark invitation as accepted
      const { error: updateError } = await supabase
        .from('project_invitations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invitation.id)

      if (updateError) {
        throw new CollaborationError(updateError.message, updateError.code)
      }

      // Log activity
      await this.logActivity({
        user_id: user.id,
        project_id: invitation.project_id,
        entity_type: 'invitation',
        entity_id: invitation.id,
        action: 'joined',
        details: {
          role: invitation.role
        }
      })

      return {
        data: true,
        error: null,
        success: true
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to accept invitation'
      return {
        data: null,
        error: message,
        success: false
      }
    }
  },

  /**
   * Get project invitations (for project managers)
   */
  async getProjectInvitations(projectId: string): Promise<ApiResponse<InvitationWithDetails[]>> {
    try {
      await checkCollaborationPermission('team.invite', projectId)

      const { data, error } = await supabase
        .from('project_invitations')
        .select(`
          *,
          projects(id, title, description)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) {
        throw new CollaborationError(error.message, error.code)
      }

      return {
        data: data as InvitationWithDetails[],
        error: null,
        success: true
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch invitations'
      return {
        data: null,
        error: message,
        success: false
      }
    }
  },

  /**
   * Cancel/revoke a project invitation
   */
  async revokeInvitation(invitationId: string): Promise<ApiResponse<boolean>> {
    try {
      const user = await getCurrentUser()
      if (!user) {
        throw new CollaborationPermissionError('Must be authenticated')
      }

      // Get invitation to check permissions
      const { data: invitation } = await supabase
        .from('project_invitations')
        .select('project_id, invited_by')
        .eq('id', invitationId)
        .single()

      if (!invitation) {
        throw new CollaborationError('Invitation not found', 'NOT_FOUND')
      }

      // Check if user can revoke (invited by them or has team.remove permission)
      if (invitation.invited_by !== user.id) {
        await checkCollaborationPermission('team.remove', invitation.project_id)
      }

      const { error } = await supabase
        .from('project_invitations')
        .delete()
        .eq('id', invitationId)

      if (error) {
        throw new CollaborationError(error.message, error.code)
      }

      return {
        data: true,
        error: null,
        success: true
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to revoke invitation'
      return {
        data: null,
        error: message,
        success: false
      }
    }
  },

  // ========== COMMENTS ==========

  /**
   * Add a comment to an entity (task, project, etc.)
   */
  async addComment(comment: Omit<CommentInsert, 'user_id'>): Promise<ApiResponse<CommentWithAuthor>> {
    try {
      // Check permission based on entity type
      if (comment.entity_type === 'task') {
        // Get task's project to check permissions
        const { data: task } = await supabase
          .from('tasks')
          .select('project_id')
          .eq('id', comment.entity_id)
          .single()
        
        if (task) {
          await checkCollaborationPermission('task.comment', task.project_id)
        }
      } else if (comment.entity_type === 'project') {
        await checkCollaborationPermission('project.view', comment.entity_id)
      }

      const user = await getCurrentUser()
      if (!user) {
        throw new CollaborationPermissionError('Must be authenticated')
      }

      const { data, error } = await supabase
        .from('comments')
        .insert({
          ...comment,
          user_id: user.id
        })
        .select()
        .single()

      if (error) {
        throw new CollaborationError(error.message, error.code)
      }

      // Log activity if it's a task comment
      if (comment.entity_type === 'task') {
        const { data: task } = await supabase
          .from('tasks')
          .select('project_id')
          .eq('id', comment.entity_id)
          .single()

        if (task) {
          await this.logActivity({
            user_id: user.id,
            project_id: task.project_id,
            entity_type: 'task',
            entity_id: comment.entity_id,
            action: 'commented',
            details: {
              comment_id: data.id,
              content: comment.content.substring(0, 100) // First 100 chars
            }
          })
        }
      }

      return {
        data: data as CommentWithAuthor,
        error: null,
        success: true
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add comment'
      return {
        data: null,
        error: message,
        success: false
      }
    }
  },

  /**
   * Get comments for an entity
   */
  async getComments(entityType: string, entityId: string): Promise<ApiResponse<CommentWithAuthor[]>> {
    try {
      // Check permission to view entity
      if (entityType === 'task') {
        const { data: task } = await supabase
          .from('tasks')
          .select('project_id')
          .eq('id', entityId)
          .single()
        
        if (task) {
          await checkCollaborationPermission('project.view', task.project_id)
        }
      } else if (entityType === 'project') {
        await checkCollaborationPermission('project.view', entityId)
      }

      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .neq('entity_type', 'shared_document') // Exclude shared document entries
        .order('created_at', { ascending: true })

      if (error) {
        throw new CollaborationError(error.message, error.code)
      }

      return {
        data: data as CommentWithAuthor[],
        error: null,
        success: true
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch comments'
      return {
        data: null,
        error: message,
        success: false
      }
    }
  },

  /**
   * Update a comment
   */
  async updateComment(commentId: string, updates: CommentUpdate): Promise<ApiResponse<CommentWithAuthor>> {
    try {
      const user = await getCurrentUser()
      if (!user) {
        throw new CollaborationPermissionError('Must be authenticated')
      }

      // Check if user owns the comment
      const { data: existingComment } = await supabase
        .from('comments')
        .select('user_id, entity_type, entity_id')
        .eq('id', commentId)
        .single()

      if (!existingComment) {
        throw new CollaborationError('Comment not found', 'NOT_FOUND')
      }

      if (existingComment.user_id !== user.id) {
        throw new CollaborationPermissionError('Can only edit your own comments')
      }

      const { data, error } = await supabase
        .from('comments')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .select()
        .single()

      if (error) {
        throw new CollaborationError(error.message, error.code)
      }

      return {
        data: data as CommentWithAuthor,
        error: null,
        success: true
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update comment'
      return {
        data: null,
        error: message,
        success: false
      }
    }
  },

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string): Promise<ApiResponse<boolean>> {
    try {
      const user = await getCurrentUser()
      if (!user) {
        throw new CollaborationPermissionError('Must be authenticated')
      }

      // Check if user owns the comment or has admin permissions
      const { data: existingComment } = await supabase
        .from('comments')
        .select('user_id, entity_type, entity_id')
        .eq('id', commentId)
        .single()

      if (!existingComment) {
        throw new CollaborationError('Comment not found', 'NOT_FOUND')
      }

      if (existingComment.user_id !== user.id) {
        // Check if user has admin permissions for the entity
        if (existingComment.entity_type === 'task') {
          const { data: task } = await supabase
            .from('tasks')
            .select('project_id')
            .eq('id', existingComment.entity_id)
            .single()
          
          if (task) {
            await checkCollaborationPermission('project.edit', task.project_id)
          }
        } else if (existingComment.entity_type === 'project') {
          await checkCollaborationPermission('project.edit', existingComment.entity_id)
        }
      }

      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)

      if (error) {
        throw new CollaborationError(error.message, error.code)
      }

      return {
        data: true,
        error: null,
        success: true
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete comment'
      return {
        data: null,
        error: message,
        success: false
      }
    }
  },

  // ========== ATTACHMENTS ==========

  /**
   * Add an attachment to an entity
   */
  async addAttachment(attachment: Omit<AttachmentInsert, 'user_id'>): Promise<ApiResponse<Attachment>> {
    try {
      // Check permission based on entity type
      if (attachment.entity_type === 'task') {
        const { data: task } = await supabase
          .from('tasks')
          .select('project_id')
          .eq('id', attachment.entity_id)
          .single()
        
        if (task) {
          await checkCollaborationPermission('attachment.upload', task.project_id)
        }
      } else if (attachment.entity_type === 'project') {
        await checkCollaborationPermission('project.edit', attachment.entity_id)
      }

      const user = await getCurrentUser()
      if (!user) {
        throw new CollaborationPermissionError('Must be authenticated')
      }

      const { data, error } = await supabase
        .from('attachments')
        .insert({
          ...attachment,
          user_id: user.id
        })
        .select()
        .single()

      if (error) {
        throw new CollaborationError(error.message, error.code)
      }

      return {
        data,
        error: null,
        success: true
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add attachment'
      return {
        data: null,
        error: message,
        success: false
      }
    }
  },

  /**
   * Get attachments for an entity
   */
  async getAttachments(entityType: string, entityId: string): Promise<ApiResponse<Attachment[]>> {
    try {
      // Check permission to view entity
      if (entityType === 'task') {
        const { data: task } = await supabase
          .from('tasks')
          .select('project_id')
          .eq('id', entityId)
          .single()
        
        if (task) {
          await checkCollaborationPermission('project.view', task.project_id)
        }
      } else if (entityType === 'project') {
        await checkCollaborationPermission('project.view', entityId)
      }

      const { data, error } = await supabase
        .from('attachments')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false })

      if (error) {
        throw new CollaborationError(error.message, error.code)
      }

      return {
        data: data || [],
        error: null,
        success: true
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch attachments'
      return {
        data: null,
        error: message,
        success: false
      }
    }
  },

  /**
   * Delete an attachment
   */
  async deleteAttachment(attachmentId: string): Promise<ApiResponse<boolean>> {
    try {
      const user = await getCurrentUser()
      if (!user) {
        throw new CollaborationPermissionError('Must be authenticated')
      }

      // Check if user owns the attachment or has admin permissions
      const { data: attachment } = await supabase
        .from('attachments')
        .select('user_id, entity_type, entity_id')
        .eq('id', attachmentId)
        .single()

      if (!attachment) {
        throw new CollaborationError('Attachment not found', 'NOT_FOUND')
      }

      if (attachment.user_id !== user.id) {
        // Check if user has admin permissions for the entity
        if (attachment.entity_type === 'task') {
          const { data: task } = await supabase
            .from('tasks')
            .select('project_id')
            .eq('id', attachment.entity_id)
            .single()
          
          if (task) {
            await checkCollaborationPermission('project.edit', task.project_id)
          }
        } else if (attachment.entity_type === 'project') {
          await checkCollaborationPermission('project.edit', attachment.entity_id)
        }
      }

      const { error } = await supabase
        .from('attachments')
        .delete()
        .eq('id', attachmentId)

      if (error) {
        throw new CollaborationError(error.message, error.code)
      }

      return {
        data: true,
        error: null,
        success: true
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete attachment'
      return {
        data: null,
        error: message,
        success: false
      }
    }
  },

  // ========== ACTIVITY LOGS ==========

  /**
   * Log an activity
   */
  async logActivity(activity: Omit<ActivityLogInsert, 'id' | 'created_at'>): Promise<ApiResponse<ActivityLog>> {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .insert(activity)
        .select()
        .single()

      if (error) {
        throw new CollaborationError(error.message, error.code)
      }

      return {
        data,
        error: null,
        success: true
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to log activity'
      return {
        data: null,
        error: message,
        success: false
      }
    }
  },

  /**
   * Get activity logs for a project
   */
  async getProjectActivity(
    projectId: string, 
    page: number = 1, 
    limit: number = 20
  ): Promise<PaginatedResponse<ActivityWithDetails>> {
    try {
      await checkCollaborationPermission('project.view', projectId)

      const offset = (page - 1) * limit

      // Get total count
      const { count } = await supabase
        .from('activity_logs')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)

      // Get paginated data
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        throw new CollaborationError(error.message, error.code)
      }

      const total = count || 0
      const hasMore = offset + limit < total

      return {
        data: data as ActivityWithDetails[],
        error: null,
        success: true,
        pagination: {
          page,
          limit,
          total,
          hasMore
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch activity logs'
      return {
        data: null,
        error: message,
        success: false,
        pagination: {
          page,
          limit,
          total: 0,
          hasMore: false
        }
      }
    }
  },

  /**
   * Get recent activity across all accessible projects
   */
  async getRecentActivity(limit: number = 10): Promise<ApiResponse<ActivityWithDetails[]>> {
    try {
      const user = await getCurrentUser()
      if (!user) {
        throw new CollaborationPermissionError('Must be authenticated')
      }

      // Get projects the user has access to
      const { data: userProjects } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', user.id)

      if (!userProjects || userProjects.length === 0) {
        return {
          data: [],
          error: null,
          success: true
        }
      }

      const projectIds = userProjects.map(p => p.project_id)

      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .in('project_id', projectIds)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        throw new CollaborationError(error.message, error.code)
      }

      return {
        data: data as ActivityWithDetails[],
        error: null,
        success: true
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch recent activity'
      return {
        data: null,
        error: message,
        success: false
      }
    }
  },

  // ========== PERMISSION MANAGEMENT ==========

  /**
   * Update user role in a project
   */
  async updateUserRole(
    projectId: string, 
    userId: string, 
    newRole: MemberRole
  ): Promise<ApiResponse<boolean>> {
    try {
      await checkCollaborationPermission('team.role.change', projectId)

      const currentUser = await getCurrentUser()
      if (!currentUser) {
        throw new CollaborationPermissionError('Must be authenticated')
      }

      // Prevent users from changing their own role if they're the only owner
      if (currentUser.id === userId && newRole !== 'owner') {
        const { data: owners } = await supabase
          .from('project_members')
          .select('id')
          .eq('project_id', projectId)
          .eq('role', 'owner')

        if (owners && owners.length === 1) {
          throw new CollaborationError('Cannot change role: you are the only owner', 'LAST_OWNER')
        }
      }

      const { error } = await supabase
        .from('project_members')
        .update({ role: newRole })
        .eq('project_id', projectId)
        .eq('user_id', userId)

      if (error) {
        throw new CollaborationError(error.message, error.code)
      }

      // Log activity
      await this.logActivity({
        user_id: currentUser.id,
        project_id: projectId,
        entity_type: 'project_member',
        entity_id: userId,
        action: 'updated',
        details: {
          new_role: newRole,
          changed_by: currentUser.id
        }
      })

      return {
        data: true,
        error: null,
        success: true
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update user role'
      return {
        data: null,
        error: message,
        success: false
      }
    }
  },

  /**
   * Remove user from project
   */
  async removeUserFromProject(projectId: string, userId: string): Promise<ApiResponse<boolean>> {
    try {
      await checkCollaborationPermission('team.remove', projectId)

      const currentUser = await getCurrentUser()
      if (!currentUser) {
        throw new CollaborationPermissionError('Must be authenticated')
      }

      // Prevent removing the last owner
      const { data: member } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .single()

      if (member?.role === 'owner') {
        const { data: owners } = await supabase
          .from('project_members')
          .select('id')
          .eq('project_id', projectId)
          .eq('role', 'owner')

        if (owners && owners.length === 1) {
          throw new CollaborationError('Cannot remove the last owner from project', 'LAST_OWNER')
        }
      }

      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', userId)

      if (error) {
        throw new CollaborationError(error.message, error.code)
      }

      // Log activity
      await this.logActivity({
        user_id: currentUser.id,
        project_id: projectId,
        entity_type: 'project_member',
        entity_id: userId,
        action: 'deleted',
        details: {
          removed_by: currentUser.id
        }
      })

      return {
        data: true,
        error: null,
        success: true
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove user from project'
      return {
        data: null,
        error: message,
        success: false
      }
    }
  }
} 