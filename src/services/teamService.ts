import { supabase } from '../config/supabase'
import type { User } from '@supabase/supabase-js'

export type MemberRole = 'owner' | 'admin' | 'member'

// Simplified user interface for assignment purposes
export interface AssignableUser {
  id: string
  email?: string
  user_metadata?: {
    full_name?: string
    avatar_url?: string
  }
}

export interface TeamMember {
  id: string
  user_id: string
  project_id: string
  role: MemberRole
  created_at: string
  user?: {
    id: string
    email?: string
    user_metadata?: {
      full_name?: string
      avatar_url?: string
    }
  }
}

export interface Project {
  id: string
  title: string
  description: string | null
  owner_id: string
  created_at: string
  updated_at: string
  color: string | null
  status: 'active' | 'completed' | 'archived' | 'template' | null
  is_template: boolean | null
}

export interface TeamInvitation {
  id: string
  project_id: string
  email: string
  role: MemberRole
  invited_by: string
  token: string
  expires_at: string
  accepted_at?: string
  created_at: string
}

/**
 * Team Management Service
 * Handles all team member operations including invitations, role management, and member listing
 */
class TeamService {
  /**
   * Get all team members for a project
   */
  async getProjectMembers(projectId: string): Promise<{ data: TeamMember[] | null; error: any }> {
    try {
      // Get project members
      const { data: members, error } = await supabase
        .from('project_members')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })

      if (error) {
        return { data: null, error }
      }

      if (!members || members.length === 0) {
        return { data: [], error: null }
      }

      // Get current user to check if any members match
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      // Map members to include real user data
      const enrichedMembers: TeamMember[] = members.map(member => {
        // If this member is the current user, use their real data
        if (currentUser && member.user_id === currentUser.id) {
          return {
            ...member,
            user: {
              id: member.user_id,
              email: currentUser.email || `user-${member.user_id.slice(0, 8)}@example.com`,
              user_metadata: currentUser.user_metadata || {}
            }
          }
        }
        
        // For other users, we'll use placeholder data for now
        // In a real app, you'd have a user profiles table or use admin methods
        return {
          ...member,
          user: {
            id: member.user_id,
            email: `user-${member.user_id.slice(0, 8)}@example.com`,
            user_metadata: {}
          }
        }
      })

      return { data: enrichedMembers, error: null }
    } catch (error) {
      console.error('Error fetching project members:', error)
      return { data: null, error }
    }
  }

  /**
   * Get all projects where the user is a member
   */
  async getUserProjects(userId: string): Promise<{ data: Project[] | null; error: any }> {
    try {
      // Get projects where user is owner or member
      const { data: ownedProjects, error: ownedError } = await supabase
        .from('projects')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false })

      if (ownedError) {
        return { data: null, error: ownedError }
      }

      return { data: ownedProjects, error: null }
    } catch (error) {
      console.error('Error fetching user projects:', error)
      return { data: null, error }
    }
  }

  /**
   * Get all projects (for admin/fallback purposes)
   */
  async getAllProjects(): Promise<{ data: Project[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      return { data, error }
    } catch (error) {
      console.error('Error fetching all projects:', error)
      return { data: null, error }
    }
  }

  /**
   * Add a user to a project (direct add - no invitation)
   */
  async addMemberToProject(
    projectId: string, 
    userId: string, 
    role: MemberRole = 'member'
  ): Promise<{ data: TeamMember | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('project_members')
        .insert({
          project_id: projectId,
          user_id: userId,
          role
        })
        .select('*')
        .single()

      if (error) {
        return { data: null, error }
      }

      // Add placeholder user data
      const enrichedMember: TeamMember = {
        ...data,
        user: {
          id: userId,
          email: `user-${userId.slice(0, 8)}@example.com`, // Placeholder
          user_metadata: {}
        }
      }

      return { data: enrichedMember, error: null }
    } catch (error) {
      console.error('Error adding member to project:', error)
      return { data: null, error }
    }
  }

  /**
   * Update a team member's role
   */
  async updateMemberRole(
    projectId: string, 
    userId: string, 
    newRole: MemberRole
  ): Promise<{ data: TeamMember | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('project_members')
        .update({ role: newRole })
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .select('*')
        .single()

      if (error) {
        return { data: null, error }
      }

      // Add placeholder user data
      const enrichedMember: TeamMember = {
        ...data,
        user: {
          id: userId,
          email: `user-${userId.slice(0, 8)}@example.com`, // Placeholder
          user_metadata: {}
        }
      }

      return { data: enrichedMember, error: null }
    } catch (error) {
      console.error('Error updating member role:', error)
      return { data: null, error }
    }
  }

  /**
   * Remove a member from a project
   */
  async removeMemberFromProject(
    projectId: string, 
    userId: string
  ): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', userId)

      return { error }
    } catch (error) {
      console.error('Error removing member from project:', error)
      return { error }
    }
  }

  /**
   * Check if a user has a specific role in a project
   */
  async getUserRoleInProject(
    projectId: string, 
    userId: string
  ): Promise<{ data: MemberRole | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .single()

      return { data: data?.role || null, error }
    } catch (error) {
      console.error('Error checking user role:', error)
      return { data: null, error }
    }
  }

  /**
   * Check if user can manage team members (is owner or admin)
   */
  async canManageTeam(projectId: string, userId: string): Promise<boolean> {
    try {
      // Check if user is project owner
      const { data: project } = await supabase
        .from('projects')
        .select('owner_id')
        .eq('id', projectId)
        .single()

      if (project?.owner_id === userId) {
        return true
      }

      // Check if user is admin
      const { data: member } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .single()

      return member?.role === 'admin'
    } catch (error) {
      console.error('Error checking team management permissions:', error)
      return false
    }
  }

  /**
   * Get available assignees for a project (project members only)
   */
  async getProjectAssignees(projectId: string): Promise<{ data: AssignableUser[] | null; error: any }> {
    try {
      const { data: members, error } = await this.getProjectMembers(projectId)
      
      if (error || !members) {
        return { data: null, error }
      }

      // Extract users from team members
      const assignees: AssignableUser[] = members
        .filter(member => member.user)
        .map(member => ({
          id: member.user!.id,
          email: member.user!.email,
          user_metadata: member.user!.user_metadata
        }))

      return { data: assignees, error: null }
    } catch (error) {
      console.error('Error getting project assignees:', error)
      return { data: null, error }
    }
  }

  /**
   * Search assignees within a project
   */
  async searchProjectAssignees(projectId: string, searchTerm: string): Promise<{ data: AssignableUser[] | null; error: any }> {
    try {
      const { data: assignees, error } = await this.getProjectAssignees(projectId)
      
      if (error || !assignees) {
        return { data: null, error }
      }

      // Filter assignees by search term
      const filteredAssignees = assignees.filter(user => {
        const email = user.email?.toLowerCase() || ''
        const name = user.user_metadata?.full_name?.toLowerCase() || ''
        const term = searchTerm.toLowerCase()
        
        return email.includes(term) || name.includes(term)
      })

      return { data: filteredAssignees, error: null }
    } catch (error) {
      console.error('Error searching project assignees:', error)
      return { data: null, error }
    }
  }

  /**
   * Get member count for a project
   */
  async getProjectMemberCount(projectId: string): Promise<{ data: number; error: any }> {
    try {
      const { count, error } = await supabase
        .from('project_members')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)

      return { data: count || 0, error }
    } catch (error) {
      console.error('Error getting member count:', error)
      return { data: 0, error }
    }
  }

  /**
   * Leave a project (for current user)
   */
  async leaveProject(projectId: string, userId: string): Promise<{ error: any }> {
    try {
      // Don't allow project owner to leave
      const { data: project } = await supabase
        .from('projects')
        .select('owner_id')
        .eq('id', projectId)
        .single()

      if (project?.owner_id === userId) {
        return { error: new Error('Project owner cannot leave the project') }
      }

      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', userId)

      return { error }
    } catch (error) {
      console.error('Error leaving project:', error)
      return { error }
    }
  }
}

export const teamService = new TeamService()
export default teamService 