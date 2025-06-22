import { supabase, getCurrentUser } from '../config/supabase'
import type { 
  Project, 
  ProjectInsert, 
  ProjectUpdate, 
  ProjectWithMembers,
  ProjectWithTasks,
  ApiResponse,
  PaginatedResponse 
} from '../types/supabase'

// Custom error classes
export class ProjectError extends Error {
  public code?: string
  
  constructor(message: string, code?: string) {
    super(message)
    this.name = 'ProjectError'
    this.code = code
  }
}

export class ProjectPermissionError extends Error {
  constructor(message: string = 'Insufficient permissions') {
    super(message)
    this.name = 'ProjectPermissionError'
  }
}

// Project service implementation
export const projectService = {
  /**
   * Get all projects for the current user
   */
  async getProjects(): Promise<ApiResponse<Project[]>> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          project_members!inner(role)
        `)
        .order('updated_at', { ascending: false })

      if (error) {
        throw new ProjectError(error.message, error.code)
      }

      return {
        data: data || [],
        error: null,
        success: true
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch projects'
      return {
        data: null,
        error: message,
        success: false
      }
    }
  },

  /**
   * Get projects with pagination
   */
  async getProjectsPaginated(page: number = 1, limit: number = 20): Promise<PaginatedResponse<Project>> {
    try {
      const offset = (page - 1) * limit

      // Get total count
      const { count } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })

      // Get paginated data
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          project_members!inner(role)
        `)
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        throw new ProjectError(error.message, error.code)
      }

      const total = count || 0
      const hasMore = offset + limit < total

      return {
        data: data || [],
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
      const message = error instanceof Error ? error.message : 'Failed to fetch projects'
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
   * Get a single project by ID with members
   */
  async getProjectById(id: string): Promise<ApiResponse<ProjectWithMembers>> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          project_members(
            id,
            project_id,
            role,
            created_at,
            user_id
          )
        `)
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          throw new ProjectError('Project not found', 'NOT_FOUND')
        }
        throw new ProjectError(error.message, error.code)
      }

      return {
        data: data as ProjectWithMembers,
        error: null,
        success: true
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch project'
      return {
        data: null,
        error: message,
        success: false
      }
    }
  },

  /**
   * Get a project with its tasks
   */
  async getProjectWithTasks(id: string): Promise<ApiResponse<ProjectWithTasks>> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          tasks(
            id,
            project_id,
            title,
            description,
            status,
            priority,
            assignee_id,
            created_by,
            due_date,
            estimated_hours,
            actual_hours,
            order_index,
            parent_task_id,
            created_at,
            updated_at
          )
        `)
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          throw new ProjectError('Project not found', 'NOT_FOUND')
        }
        throw new ProjectError(error.message, error.code)
      }

      return {
        data: data as ProjectWithTasks,
        error: null,
        success: true
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch project with tasks'
      return {
        data: null,
        error: message,
        success: false
      }
    }
  },

  /**
   * Create a new project
   */
  async createProject(projectData: Omit<ProjectInsert, 'owner_id'>): Promise<ApiResponse<Project>> {
    try {
      const user = await getCurrentUser()
      if (!user) {
        throw new ProjectPermissionError('Must be authenticated to create projects')
      }

      const { data, error } = await supabase
        .from('projects')
        .insert({
          ...projectData,
          owner_id: user.id,
          status: projectData.status || 'active'
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          throw new ProjectError('A project with this title already exists', 'DUPLICATE_TITLE')
        }
        throw new ProjectError(error.message, error.code)
      }

      // Add the creator as an owner in project_members
      await supabase
        .from('project_members')
        .insert({
          project_id: data.id,
          user_id: user.id,
          role: 'owner'
        })

      return {
        data,
        error: null,
        success: true
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create project'
      return {
        data: null,
        error: message,
        success: false
      }
    }
  },

  /**
   * Update a project
   */
  async updateProject(id: string, updates: ProjectUpdate): Promise<ApiResponse<Project>> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          throw new ProjectError('Project not found', 'NOT_FOUND')
        }
        if (error.code === '23505') {
          throw new ProjectError('A project with this title already exists', 'DUPLICATE_TITLE')
        }
        throw new ProjectError(error.message, error.code)
      }

      return {
        data,
        error: null,
        success: true
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update project'
      return {
        data: null,
        error: message,
        success: false
      }
    }
  },

  /**
   * Delete a project
   */
  async deleteProject(id: string): Promise<ApiResponse<boolean>> {
    try {
      // First, delete all project members
      await supabase
        .from('project_members')
        .delete()
        .eq('project_id', id)

      // Then delete the project
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)

      if (error) {
        if (error.code === 'PGRST116') {
          throw new ProjectError('Project not found', 'NOT_FOUND')
        }
        throw new ProjectError(error.message, error.code)
      }

      return {
        data: true,
        error: null,
        success: true
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete project'
      return {
        data: null,
        error: message,
        success: false
      }
    }
  },

  /**
   * Archive a project
   */
  async archiveProject(id: string): Promise<ApiResponse<Project>> {
    return this.updateProject(id, { status: 'archived' })
  },

  /**
   * Restore an archived project
   */
  async restoreProject(id: string): Promise<ApiResponse<Project>> {
    return this.updateProject(id, { status: 'active' })
  },

  /**
   * Check if user has access to a project
   */
  async hasProjectAccess(projectId: string): Promise<boolean> {
    try {
      const user = await getCurrentUser()
      if (!user) return false

      const { data } = await supabase
        .from('project_members')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .single()

      return !!data
    } catch {
      return false
    }
  },

  /**
   * Get user's role in a project
   */
  async getUserProjectRole(projectId: string): Promise<string | null> {
    try {
      const user = await getCurrentUser()
      if (!user) return null

      const { data } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .single()

      return data?.role || null
    } catch {
      return null
    }
  }
} 