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
   * Get all projects for the current user with sidebar-specific data
   */
  async getUserProjectsWithStats(userId: string): Promise<{ data: SidebarProject[] | null; error: any }> {
    try {
      console.log('Fetching projects for user:', userId)
      
      const user = await getCurrentUser()
      if (!user) {
        return { data: null, error: 'User not authenticated' }
      }

      // Fetch projects where user is a member (including owner)
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select(`
          *,
          project_members!inner(role, user_id),
          tasks(id, status, assignee_id),
          all_members:project_members(id)
        `)
        .eq('project_members.user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(20) // Show most recent 20 projects

      if (projectsError) {
        console.error('Error fetching projects:', projectsError)
        return { data: null, error: projectsError }
      }

      // Transform projects to match SidebarProject interface
      const sidebarProjects: SidebarProject[] = (projects || []).map(project => {
        const tasks = project.tasks || []
        const userTasks = tasks.filter((task: any) => task.assignee_id === user.id)
        
        // Calculate task counts
        const taskCounts = {
          total: tasks.length,
          todo: tasks.filter((task: any) => task.status === 'todo').length,
          in_progress: tasks.filter((task: any) => task.status === 'in_progress').length,
          done: tasks.filter((task: any) => task.status === 'done').length,
          assigned_to_user: userTasks.length
        }

        // Calculate progress (percentage of completed tasks)
        const progress = tasks.length > 0 ? Math.round((taskCounts.done / tasks.length) * 100) : 0

        // Get user's role in this project
        const memberInfo = Array.isArray(project.project_members) 
          ? project.project_members[0] 
          : project.project_members
        const userRole = memberInfo?.role || 'member'

        // Get actual member count
        const memberCount = project.all_members ? project.all_members.length : 1

        return {
          id: project.id,
          title: project.title,
          description: project.description || undefined,
          owner_id: project.owner_id,
          created_at: project.created_at,
          updated_at: project.updated_at,
          memberCount,
          taskCounts,
          userRole: userRole as 'owner' | 'admin' | 'member',
          progress
        }
      })

      return { data: sidebarProjects, error: null }
      
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
      
      const user = await getCurrentUser()
      if (!user) {
        return { data: null, error: 'User not authenticated' }
      }

      // Get all tasks assigned to the user
      const { data: userTasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, status, due_date, created_at, created_by')
        .eq('assignee_id', user.id)

      if (tasksError) {
        console.error('Error fetching user tasks:', tasksError)
        return { data: null, error: tasksError }
      }

      const tasks = userTasks || []
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

      const taskCounts: UserTaskCounts = {
        total: tasks.length,
        assigned: tasks.length, // All fetched tasks are assigned to user
        created: tasks.filter(task => task.created_by === user.id).length,
        overdue: tasks.filter(task => {
          if (!task.due_date) return false
          return new Date(task.due_date) < today
        }).length,
        due_today: tasks.filter(task => {
          if (!task.due_date) return false
          const dueDate = new Date(task.due_date)
          return dueDate >= today && dueDate < new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }).length,
        due_this_week: tasks.filter(task => {
          if (!task.due_date) return false
          const dueDate = new Date(task.due_date)
          return dueDate >= today && dueDate < weekFromNow
        }).length
      }

      return { data: taskCounts, error: null }
      
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
      
      // Get actual projects data to calculate stats
      const { data: projects, error: projectsError } = await this.getUserProjectsWithStats(userId)
      
      if (projectsError || !projects) {
        return { data: null, error: projectsError }
      }

      // Calculate task counts from all projects
      const taskCounts = projects.reduce((acc, project) => ({
        total: acc.total + project.taskCounts.total,
        assigned: acc.assigned + project.taskCounts.assigned_to_user,
        created: acc.created, // We don't track this in current schema
        overdue: acc.overdue, // We don't track this in current schema  
        due_today: acc.due_today, // We don't track this in current schema
        due_this_week: acc.due_this_week // We don't track this in current schema
      }), {
        total: 0,
        assigned: 0,
        created: 0,
        overdue: 0,
        due_today: 0,
        due_this_week: 0
      })
      
      const stats: SidebarStats = {
        projects: projects.length,
        tasks: taskCounts,
        notifications: 0, // We don't have notifications implemented yet
        recentActivity: 0 // We don't have activity tracking for sidebar yet
      }

      return { data: stats, error: null }
      
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
   */
  subscribeToProjectUpdates(userId: string, callback: (payload: any) => void) {
    console.log('Setting up real-time subscription for user:', userId)
    
    try {
      const subscription = supabase
        .channel('sidebar-projects')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'projects'
          },
          callback
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'project_members',
            filter: `user_id=eq.${userId}`
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
        .subscribe()

      return subscription
    } catch (error) {
      console.error('Error setting up real-time subscription:', error)
      // Fallback to mock subscription
      return {
        unsubscribe: () => {
          console.log('Mock subscription unsubscribed')
        }
      } as any
    }
    
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