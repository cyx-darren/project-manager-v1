import { supabase } from '../config/supabase'
import type { WorkspaceRole } from '../types/permissions'
import type { Tables } from '../types/supabase'

export type Workspace = Tables<'workspaces'>
export type WorkspaceMember = Tables<'workspace_members'> & {
  user?: {
    id: string
    email: string | null
    full_name: string | null
    avatar_url: string | null
  }
}

export interface CreateWorkspaceData {
  name: string
  description?: string
  logo_url?: string
  settings?: Record<string, any>
}

export interface InviteMemberData {
  email: string
  role: WorkspaceRole
  message?: string
}

export interface UpdateMemberRoleData {
  userId: string
  newRole: WorkspaceRole
}

class WorkspaceService {
  /**
   * Create a new workspace
   */
  async createWorkspace(data: CreateWorkspaceData): Promise<Workspace> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Generate unique slug
    const slug = this.generateSlug(data.name)
    
    const { data: workspace, error } = await supabase
      .from('workspaces')
      .insert({
        name: data.name,
        slug,
        description: data.description,
        logo_url: data.logo_url,
        settings: data.settings || {},
        created_by: user.id
      })
      .select()
      .single()

    if (error) throw error

    // Add creator as workspace owner
    await this.addMember(workspace.id, user.id, 'owner')

    return workspace
  }

  /**
   * Get workspace by ID
   */
  async getWorkspace(workspaceId: string): Promise<Workspace | null> {
    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }

    return data
  }

  /**
   * Get workspace by slug
   */
  async getWorkspaceBySlug(slug: string): Promise<Workspace | null> {
    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }

    return data
  }

  /**
   * Get user's workspaces
   */
  async getUserWorkspaces(): Promise<Workspace[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('workspaces')
      .select(`
        *,
        workspace_members!inner(user_id, role)
      `)
      .eq('workspace_members.user_id', user.id)

    if (error) throw error
    return data || []
  }

  /**
   * Update workspace
   */
  async updateWorkspace(workspaceId: string, updates: Partial<CreateWorkspaceData>): Promise<Workspace> {
    const { data, error } = await supabase
      .from('workspaces')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', workspaceId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Delete workspace
   */
  async deleteWorkspace(workspaceId: string): Promise<void> {
    const { error } = await supabase
      .from('workspaces')
      .delete()
      .eq('id', workspaceId)

    if (error) throw error
  }

  /**
   * Get workspace members with user details
   */
  async getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const { data, error } = await supabase
      .from('workspace_members')
      .select('*')
      .eq('workspace_id', workspaceId)

    if (error) throw error

    return data || []
  }

  /**
   * Add member to workspace
   */
  async addMember(workspaceId: string, userId: string, role: WorkspaceRole = 'member'): Promise<WorkspaceMember> {
    const { data, error } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: workspaceId,
        user_id: userId,
        role
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Invite member by email
   */
  async inviteMember(workspaceId: string, inviteData: InviteMemberData): Promise<{ success: boolean; message: string }> {
    try {
      // For now, return a message that email invitations are not yet implemented
      return { success: false, message: 'Email invitations are not yet implemented. User must create an account first.' }
    } catch (error) {
      throw error
    }
  }

  /**
   * Update member role
   */
  async updateMemberRole(workspaceId: string, userId: string, newRole: WorkspaceRole): Promise<WorkspaceMember> {
    const { data, error } = await supabase
      .from('workspace_members')
      .update({ role: newRole })
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Remove member from workspace
   */
  async removeMember(workspaceId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)

    if (error) throw error
  }

  /**
   * Check if user is workspace member
   */
  async isWorkspaceMember(workspaceId: string, userId?: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()
    const targetUserId = userId || user?.id
    
    if (!targetUserId) return false

    const { data, error } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', targetUserId)
      .single()

    return !error && !!data
  }

  /**
   * Get user's role in workspace
   */
  async getUserRole(workspaceId: string, userId?: string): Promise<WorkspaceRole | null> {
    const { data: { user } } = await supabase.auth.getUser()
    const targetUserId = userId || user?.id
    
    if (!targetUserId) return null

    const { data, error } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', targetUserId)
      .single()

    if (error) return null
    return data?.role || null
  }

  /**
   * Generate unique workspace slug
   */
  private generateSlug(name: string): string {
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    return `${baseSlug}-${randomSuffix}`
  }

  /**
   * Get workspace statistics
   */
  async getWorkspaceStats(workspaceId: string): Promise<{
    memberCount: number
    projectCount: number
    taskCount: number
    recentActivity: number
  }> {
    const [membersResult, projectsResult] = await Promise.all([
      supabase
        .from('workspace_members')
        .select('id', { count: 'exact' })
        .eq('workspace_id', workspaceId),
      supabase
        .from('projects')
        .select('id', { count: 'exact' })
        .eq('workspace_id', workspaceId)
    ])

    let taskCount = 0
    if (projectsResult.data) {
      const projectIds = projectsResult.data.map(p => p.id)
      if (projectIds.length > 0) {
        const { count } = await supabase
          .from('tasks')
          .select('id', { count: 'exact' })
          .in('project_id', projectIds)
        
        taskCount = count || 0
      }
    }

    return {
      memberCount: membersResult.count || 0,
      projectCount: projectsResult.count || 0,
      taskCount,
      recentActivity: 0 // Would implement activity tracking
    }
  }

  /**
   * Search workspaces by name
   */
  async searchWorkspaces(query: string): Promise<Workspace[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('workspaces')
      .select(`
        *,
        workspace_members!inner(user_id)
      `)
      .eq('workspace_members.user_id', user.id)
      .ilike('name', `%${query}%`)

    if (error) throw error
    return data || []
  }
}

export const workspaceService = new WorkspaceService()
export default workspaceService 