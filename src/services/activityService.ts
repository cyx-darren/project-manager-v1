import { supabase, getCurrentUser } from '../config/supabase'
import { collaborationService } from './collaborationService'
import type { 
  ActivityLog, 
  ActivityLogInsert, 
  ActivityAction,
  ApiResponse, 
  PaginatedResponse 
} from '../types/supabase'

// Enhanced activity types for comprehensive logging
export interface ActivityFilter {
  userId?: string
  projectId?: string
  entityType?: string
  action?: ActivityAction
  dateFrom?: string
  dateTo?: string
  limit?: number
  page?: number
}

export interface ActivityStats {
  totalActivities: number
  todayActivities: number
  weekActivities: number
  monthActivities: number
  topActions: { action: ActivityAction; count: number }[]
  topUsers: { userId: string; userName: string; count: number }[]
  activityByHour: { hour: number; count: number }[]
  activityByDay: { date: string; count: number }[]
}

export interface UserActivitySummary {
  userId: string
  userName: string
  totalActivities: number
  recentActivities: ActivityLog[]
  mostActiveProject: {
    projectId: string
    projectName: string
    activityCount: number
  } | null
  activityBreakdown: {
    created: number
    updated: number
    completed: number
    commented: number
    [key: string]: number
  }
}

export interface EnhancedActivity extends ActivityLog {
  user?: {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
  }
  project?: {
    id: string
    title: string
    description: string | null
  }
  entity?: {
    id: string
    title?: string
    name?: string
  }
  timeAgo: string
  formattedAction: string
}

class ActivityService {
  
  // ========== ENHANCED ACTIVITY LOGGING ==========
  
  /**
   * Log activity with enhanced details and automatic enrichment
   */
  async logActivity(activity: Omit<ActivityLogInsert, 'id' | 'created_at'>): Promise<ApiResponse<ActivityLog>> {
    return collaborationService.logActivity(activity)
  }

  /**
   * Log multiple activities in batch
   */
  async logBatchActivities(activities: Omit<ActivityLogInsert, 'id' | 'created_at'>[]): Promise<ApiResponse<ActivityLog[]>> {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .insert(activities)
        .select()

      if (error) {
        throw new Error(error.message)
      }

      return {
        data: data || [],
        error: null,
        success: true
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to log batch activities'
      return {
        data: null,
        error: message,
        success: false
      }
    }
  }

  // ========== ACTIVITY RETRIEVAL ==========
  
  /**
   * Get filtered activities with enhanced details
   */
  async getActivities(filter: ActivityFilter = {}): Promise<PaginatedResponse<EnhancedActivity>> {
    try {
      const user = await getCurrentUser()
      if (!user) {
        throw new Error('Must be authenticated')
      }

      const { 
        userId, 
        projectId, 
        entityType, 
        action, 
        dateFrom, 
        dateTo, 
        limit = 20, 
        page = 1 
      } = filter

      const offset = (page - 1) * limit

      // Build the query
      let query = supabase
        .from('activity_logs')
        .select('*', { count: 'exact' })

      // Apply filters
      if (userId) {
        query = query.eq('user_id', userId)
      }
      if (projectId) {
        query = query.eq('project_id', projectId)
      }
      if (entityType) {
        query = query.eq('entity_type', entityType)
      }
      if (action) {
        query = query.eq('action', action)
      }
      if (dateFrom) {
        query = query.gte('created_at', dateFrom)
      }
      if (dateTo) {
        query = query.lte('created_at', dateTo)
      }

      // Only show activities from accessible projects
      const { data: userProjects } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', user.id)

      if (userProjects && userProjects.length > 0) {
        const projectIds = userProjects.map(p => p.project_id)
        query = query.in('project_id', projectIds)
      }

      // Apply pagination and ordering
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) {
        throw new Error(error.message)
      }

      // Enrich activities with additional data
      const enrichedActivities = await this.enrichActivities(data || [])

      const total = count || 0
      const hasMore = offset + limit < total

      return {
        data: enrichedActivities,
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
      const message = error instanceof Error ? error.message : 'Failed to fetch activities'
      return {
        data: null,
        error: message,
        success: false,
        pagination: {
          page: filter.page || 1,
          limit: filter.limit || 20,
          total: 0,
          hasMore: false
        }
      }
    }
  }

  /**
   * Get user-specific activity feed
   */
  async getUserActivityFeed(
    userId?: string, 
    limit: number = 50
  ): Promise<ApiResponse<EnhancedActivity[]>> {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        throw new Error('Must be authenticated')
      }

      const targetUserId = userId || currentUser.id

      // Get user's accessible projects
      const { data: userProjects } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('user_id', currentUser.id)

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
        throw new Error(error.message)
      }

      const enrichedActivities = await this.enrichActivities(data || [])

      return {
        data: enrichedActivities,
        error: null,
        success: true
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch user activity feed'
      return {
        data: null,
        error: message,
        success: false
      }
    }
  }

  /**
   * Get activities for a specific project
   */
  async getProjectActivities(
    projectId: string, 
    page: number = 1, 
    limit: number = 20
  ): Promise<PaginatedResponse<EnhancedActivity>> {
    const result = await collaborationService.getProjectActivity(projectId, page, limit)
    
    if (!result.success || !result.data) {
      return {
        data: null,
        error: result.error,
        success: false,
        pagination: result.pagination!
      }
    }

    const enrichedActivities = await this.enrichActivities(result.data)

    return {
      data: enrichedActivities,
      error: null,
      success: true,
      pagination: result.pagination!
    }
  }

  // ========== ACTIVITY ANALYTICS ==========
  
  /**
   * Get activity statistics and analytics
   */
  async getActivityStats(
    projectId?: string, 
    userId?: string, 
    dateRange: { from: string; to: string } = {
      from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      to: new Date().toISOString()
    }
  ): Promise<ApiResponse<ActivityStats>> {
    try {
      const user = await getCurrentUser()
      if (!user) {
        throw new Error('Must be authenticated')
      }

      let baseQuery = supabase
        .from('activity_logs')
        .select('*')

      if (projectId) {
        baseQuery = baseQuery.eq('project_id', projectId)
      }
      if (userId) {
        baseQuery = baseQuery.eq('user_id', userId)
      }

      baseQuery = baseQuery
        .gte('created_at', dateRange.from)
        .lte('created_at', dateRange.to)

      const { data: activities, error } = await baseQuery

      if (error) {
        throw new Error(error.message)
      }

      // Calculate statistics
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      const stats: ActivityStats = {
        totalActivities: activities?.length || 0,
        todayActivities: activities?.filter(a => new Date(a.created_at!) >= today).length || 0,
        weekActivities: activities?.filter(a => new Date(a.created_at!) >= weekAgo).length || 0,
        monthActivities: activities?.filter(a => new Date(a.created_at!) >= monthAgo).length || 0,
        topActions: this.calculateTopActions(activities || []),
        topUsers: await this.calculateTopUsers(activities || []),
        activityByHour: this.calculateActivityByHour(activities || []),
        activityByDay: this.calculateActivityByDay(activities || [])
      }

      return {
        data: stats,
        error: null,
        success: true
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch activity stats'
      return {
        data: null,
        error: message,
        success: false
      }
    }
  }

  /**
   * Get user activity summary
   */
  async getUserActivitySummary(userId: string): Promise<ApiResponse<UserActivitySummary>> {
    try {
      const user = await getCurrentUser()
      if (!user) {
        throw new Error('Must be authenticated')
      }

      // Get user's activities
      const { data: activities, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(error.message)
      }

      // Get user details from auth.users metadata
      const { data: userData } = await supabase.auth.admin.getUserById(userId)
      const userName = userData?.user?.user_metadata?.full_name || userData?.user?.email || 'Unknown User'

      // Calculate activity breakdown
      const activityBreakdown = this.calculateActivityBreakdown(activities || [])

      // Find most active project
      const mostActiveProject = await this.findMostActiveProject(activities || [])

      const summary: UserActivitySummary = {
        userId,
        userName,
        totalActivities: activities?.length || 0,
        recentActivities: (activities || []).slice(0, 10),
        mostActiveProject,
        activityBreakdown
      }

      return {
        data: summary,
        error: null,
        success: true
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch user activity summary'
      return {
        data: null,
        error: message,
        success: false
      }
    }
  }

  // ========== ACTIVITY SEARCH ==========
  
  /**
   * Search activities by content
   */
  async searchActivities(
    query: string, 
    filters: Omit<ActivityFilter, 'limit' | 'page'> = {},
    limit: number = 20
  ): Promise<ApiResponse<EnhancedActivity[]>> {
    try {
      const user = await getCurrentUser()
      if (!user) {
        throw new Error('Must be authenticated')
      }

      // Build search query
      let searchQuery = supabase
        .from('activity_logs')
        .select('*')

      // Apply filters
      if (filters.projectId) {
        searchQuery = searchQuery.eq('project_id', filters.projectId)
      }
      if (filters.userId) {
        searchQuery = searchQuery.eq('user_id', filters.userId)
      }
      if (filters.entityType) {
        searchQuery = searchQuery.eq('entity_type', filters.entityType)
      }
      if (filters.action) {
        searchQuery = searchQuery.eq('action', filters.action)
      }

      // Add text search on details field (simplified approach)
      searchQuery = searchQuery
        .order('created_at', { ascending: false })
        .limit(limit)

      const { data, error } = await searchQuery

      if (error) {
        throw new Error(error.message)
      }

      // Filter by query string in client (for demo purposes)
      const filteredData = (data || []).filter(activity => {
        const details = activity.details as any
        const searchString = JSON.stringify(details || {}).toLowerCase()
        return searchString.includes(query.toLowerCase())
      })

      const enrichedActivities = await this.enrichActivities(filteredData)

      return {
        data: enrichedActivities,
        error: null,
        success: true
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to search activities'
      return {
        data: null,
        error: message,
        success: false
      }
    }
  }

  // ========== HELPER METHODS ==========
  
  private async enrichActivities(activities: ActivityLog[]): Promise<EnhancedActivity[]> {
    const enriched: EnhancedActivity[] = []

    for (const activity of activities) {
      const enhanced: EnhancedActivity = {
        ...activity,
        timeAgo: this.formatTimeAgo(activity.created_at!),
        formattedAction: this.formatAction(activity.action, activity.details)
      }

      // Add user details
      if (activity.user_id) {
        try {
          const { data: userData } = await supabase.auth.admin.getUserById(activity.user_id)
          if (userData?.user) {
            enhanced.user = {
              id: activity.user_id,
              email: userData.user.email || '',
              full_name: userData.user.user_metadata?.full_name || null,
              avatar_url: userData.user.user_metadata?.avatar_url || null
            }
          }
        } catch (error) {
          // Fallback for user info
          enhanced.user = {
            id: activity.user_id,
            email: '',
            full_name: 'Unknown User',
            avatar_url: null
          }
        }
      }

      // Add project details
      if (activity.project_id) {
        const { data: project } = await supabase
          .from('projects')
          .select('title, description')
          .eq('id', activity.project_id)
          .single()

        if (project) {
          enhanced.project = {
            id: activity.project_id,
            title: project.title,
            description: project.description
          }
        }
      }

      // Add entity details based on type
      if (activity.entity_type === 'task' && activity.entity_id) {
        const { data: task } = await supabase
          .from('tasks')
          .select('title')
          .eq('id', activity.entity_id)
          .single()

        if (task) {
          enhanced.entity = {
            id: activity.entity_id,
            title: task.title
          }
        }
      }

      enriched.push(enhanced)
    }

    return enriched
  }

  private formatTimeAgo(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  private formatAction(action: ActivityAction, details: any): string {
    const detailsObj = details as Record<string, any> || {}
    
    switch (action) {
      case 'created':
        return `created ${detailsObj.task_title || 'item'}`
      case 'updated':
        return `updated ${detailsObj.task_title || 'item'}`
      case 'assigned':
        return `assigned ${detailsObj.task_title || 'task'}`
      case 'completed':
        return `completed ${detailsObj.task_title || 'task'}`
      case 'commented':
        return `commented on ${detailsObj.task_title || 'item'}`
      case 'status_changed':
        return `changed status of ${detailsObj.task_title || 'task'} to ${detailsObj.new_status || 'unknown'}`
      case 'due_date_changed':
        return `changed due date of ${detailsObj.task_title || 'task'}`
      default:
        return action.replace('_', ' ')
    }
  }

  private calculateTopActions(activities: ActivityLog[]): { action: ActivityAction; count: number }[] {
    const actionCounts: Record<string, number> = {}
    
    activities.forEach(activity => {
      actionCounts[activity.action] = (actionCounts[activity.action] || 0) + 1
    })

    return Object.entries(actionCounts)
      .map(([action, count]) => ({ action: action as ActivityAction, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }

  private async calculateTopUsers(activities: ActivityLog[]): Promise<{ userId: string; userName: string; count: number }[]> {
    const userCounts: Record<string, number> = {}
    
    activities.forEach(activity => {
      if (activity.user_id) {
        userCounts[activity.user_id] = (userCounts[activity.user_id] || 0) + 1
      }
    })

    const topUserPromises = Object.entries(userCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(async ([userId, count]) => {
        try {
          const { data: userData } = await supabase.auth.admin.getUserById(userId)
          return {
            userId,
            userName: userData?.user?.user_metadata?.full_name || userData?.user?.email || 'Unknown User',
            count
          }
        } catch {
          return {
            userId,
            userName: 'Unknown User',
            count
          }
        }
      })

    return Promise.all(topUserPromises)
  }

  private calculateActivityByHour(activities: ActivityLog[]): { hour: number; count: number }[] {
    const hourCounts: Record<number, number> = {}
    
    // Initialize all hours
    for (let i = 0; i < 24; i++) {
      hourCounts[i] = 0
    }

    activities.forEach(activity => {
      const hour = new Date(activity.created_at!).getHours()
      hourCounts[hour]++
    })

    return Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => a.hour - b.hour)
  }

  private calculateActivityByDay(activities: ActivityLog[]): { date: string; count: number }[] {
    const dayCounts: Record<string, number> = {}
    
    activities.forEach(activity => {
      const date = new Date(activity.created_at!).toISOString().split('T')[0]
      dayCounts[date] = (dayCounts[date] || 0) + 1
    })

    return Object.entries(dayCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  private calculateActivityBreakdown(activities: ActivityLog[]): UserActivitySummary['activityBreakdown'] {
    const breakdown = {
      created: 0,
      updated: 0,
      completed: 0,
      commented: 0
    } as UserActivitySummary['activityBreakdown']

    activities.forEach(activity => {
      if (breakdown.hasOwnProperty(activity.action)) {
        breakdown[activity.action as keyof typeof breakdown]++
      } else {
        breakdown[activity.action] = (breakdown[activity.action] || 0) + 1
      }
    })

    return breakdown
  }

  private async findMostActiveProject(activities: ActivityLog[]): Promise<UserActivitySummary['mostActiveProject']> {
    const projectCounts: Record<string, number> = {}
    
    activities.forEach(activity => {
      if (activity.project_id) {
        projectCounts[activity.project_id] = (projectCounts[activity.project_id] || 0) + 1
      }
    })

    if (Object.keys(projectCounts).length === 0) {
      return null
    }

    const topProjectEntry = Object.entries(projectCounts)
      .sort(([,a], [,b]) => b - a)[0]

    const [projectId, activityCount] = topProjectEntry

    const { data: project } = await supabase
      .from('projects')
      .select('title')
      .eq('id', projectId)
      .single()

    return {
      projectId,
      projectName: project?.title || 'Unknown Project',
      activityCount
    }
  }
}

export const activityService = new ActivityService() 