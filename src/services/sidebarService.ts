import { supabase, getCurrentUser } from '../config/supabase'

export interface SidebarProject {
  id: string
  title: string
  description?: string
  owner_id: string
  created_at: string
  updated_at: string
  memberCount: number
  taskCounts: {
    total: number
    todo: number
    in_progress: number
    done: number
    assigned_to_user: number
  }
  userRole: 'owner' | 'admin' | 'member'
  progress: number // 0-100 percentage
}

export interface UserTaskCounts {
  total: number
  assigned: number
  created: number
  overdue: number
  due_today: number
  due_this_week: number
}

export interface SidebarStats {
  projects: number
  tasks: UserTaskCounts
  notifications: number
  recentActivity: number
}

/**
 * Sidebar Service
 * Handles fetching dynamic content specifically for the sidebar navigation
 * Uses real database queries for search functionality
 */
class SidebarService {
  /**
   * Get mock project data for development
   */
  private getMockProjects(userId: string): SidebarProject[] {
    return [
      {
        id: 'mock-project-1',
        title: 'My Demo Project',
        description: 'A sample project for testing the sidebar functionality',
        owner_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        memberCount: 3,
        taskCounts: {
          total: 24,
          todo: 8,
          in_progress: 4,
          done: 18,
          assigned_to_user: 6
        },
        userRole: 'owner',
        progress: 75
      },
      {
        id: 'mock-project-2',
        title: 'Website Redesign',
        description: 'Updating the company website with new branding',
        owner_id: userId,
        created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        updated_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        memberCount: 5,
        taskCounts: {
          total: 16,
          todo: 6,
          in_progress: 3,
          done: 7,
          assigned_to_user: 4
        },
        userRole: 'admin',
        progress: 44
      }
    ]
  }

  /**
   * Get mock task counts for development
   */
  private getMockTaskCounts(): UserTaskCounts {
    return {
      total: 24,
      assigned: 18,
      created: 12,
      overdue: 2,
      due_today: 3,
      due_this_week: 8
    }
  }

  /**
   * Get all projects for the current user with sidebar-specific data
   */
  async getUserProjectsWithStats(userId: string): Promise<{ data: SidebarProject[] | null; error: any }> {
    try {
      // For development, return mock data
      // In production, this would query the actual database
      console.log('Fetching projects for user:', userId)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const mockProjects = this.getMockProjects(userId)
      return { data: mockProjects, error: null }
      
      // TODO: Replace with actual database query when tables are ready
      /*
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .eq('owner_id', userId)
        .order('updated_at', { ascending: false })

      if (projectsError) {
        return { data: null, error: projectsError }
      }

      // ... rest of the actual implementation
      */
    } catch (error) {
      console.error('Error fetching user projects with stats:', error)
      return { data: null, error }
    }
  }

  /**
   * Get task counts for the current user across all projects
   */
  async getUserTaskCounts(userId: string): Promise<{ data: UserTaskCounts | null; error: any }> {
    try {
      console.log('Fetching task counts for user:', userId)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 200))
      
      const mockTaskCounts = this.getMockTaskCounts()
      return { data: mockTaskCounts, error: null }
      
      // TODO: Replace with actual database query when tables are ready
      /*
      const { data: assignedTasks, error: assignedError } = await supabase
        .from('tasks')
        .select('status, due_date, created_at')
        .eq('assignee_id', userId)

      // ... rest of the actual implementation
      */
    } catch (error) {
      console.error('Error fetching user task counts:', error)
      return { data: null, error }
    }
  }

  /**
   * Get sidebar statistics summary
   */
  async getSidebarStats(userId: string): Promise<{ data: SidebarStats | null; error: any }> {
    try {
      console.log('Fetching sidebar stats for user:', userId)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 250))
      
      const taskCounts = this.getMockTaskCounts()
      const mockProjects = this.getMockProjects(userId)
      
      const stats: SidebarStats = {
        projects: mockProjects.length,
        tasks: taskCounts,
        notifications: 3,
        recentActivity: 5
      }

      return { data: stats, error: null }
      
      // TODO: Replace with actual database query when tables are ready
      /*
      const { count: projectCount, error: projectError } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', userId)

      // ... rest of the actual implementation
      */
    } catch (error) {
      console.error('Error fetching sidebar stats:', error)
      return { data: null, error }
    }
  }

  /**
   * Get recent projects (most recently updated)
   */
  async getRecentProjects(userId: string, limit: number = 5): Promise<{ data: SidebarProject[] | null; error: any }> {
    try {
      console.log('Fetching recent projects for user:', userId)
      
      const { data: projects, error } = await this.getUserProjectsWithStats(userId)
      
      if (error || !projects) {
        return { data: null, error }
      }

      // Sort by updated_at and limit
      const recentProjects = projects
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, limit)

      return { data: recentProjects, error: null }
    } catch (error) {
      console.error('Error fetching recent projects:', error)
      return { data: null, error }
    }
  }

  /**
   * Search projects by title using real database queries
   */
  async searchProjects(userId: string, query: string): Promise<{ data: any[] | null; error: any }> {
    try {
      if (!query.trim()) {
        return { data: [], error: null }
      }

      const user = await getCurrentUser()
      if (!user) {
        return { data: null, error: 'User not authenticated' }
      }

      // Search projects the user has access to
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          project_members!inner(role, user_id)
        `)
        .eq('project_members.user_id', user.id)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .order('updated_at', { ascending: false })
        .limit(25)

      if (error) {
        console.error('Error searching projects in database:', error)
        return { data: null, error: error.message }
      }

      return { data: data || [], error: null }
    } catch (error) {
      console.error('Error searching projects:', error)
      return { data: null, error: error instanceof Error ? error.message : 'Search failed' }
    }
  }

  /**
   * Subscribe to real-time updates for user's projects
   * Currently returns a mock subscription for development
   */
  subscribeToProjectUpdates(userId: string, callback: (payload: any) => void) {
    console.log('Setting up mock subscription for user:', userId)
    
    // Create a simple mock subscription that doesn't trigger any async operations
    // This prevents the subscription errors and async conflicts
    const mockSubscription = {
      unsubscribe: () => {
        console.log('Mock subscription unsubscribed')
      }
    }
    
    // Don't create any intervals or async operations that could conflict with search
    // The subscription is just a no-op for now
    
    return mockSubscription as any
    
    // TODO: Replace with actual Supabase subscription when tables are ready
    /*
    const subscription = supabase
      .channel('sidebar-projects')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `owner_id=eq.${userId}`
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_members'
        },
        callback
      )
      .subscribe()

    return subscription
    */
  }
}

export const sidebarService = new SidebarService()
export default sidebarService 