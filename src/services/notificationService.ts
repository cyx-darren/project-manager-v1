import { supabase, getCurrentUser } from '../config/supabase'
import type { ActivityLog, ActivityAction, ApiResponse } from '../types/supabase'

export interface NotificationPreferences {
  taskAssigned: boolean
  taskCompleted: boolean
  taskCommented: boolean
  projectInvited: boolean
  projectJoined: boolean
  taskStatusChanged: boolean
  taskDueDateChanged: boolean
  projectUpdated: boolean
  taskCreated: boolean
  showInApp: boolean
  playSound: boolean
}

export interface CollaborativeNotification {
  id: string
  type: ActivityAction
  title: string
  message: string
  entityType: string
  entityId: string
  projectId: string | null
  userId: string | null
  timestamp: string
  read: boolean
  priority: 'low' | 'medium' | 'high'
}

class NotificationService {
  private preferences: NotificationPreferences = {
    taskAssigned: true,
    taskCompleted: true,
    taskCommented: true,
    projectInvited: true,
    projectJoined: true,
    taskStatusChanged: true,
    taskDueDateChanged: true,
    projectUpdated: false,
    taskCreated: false,
    showInApp: true,
    playSound: false
  }

  /**
   * Get user notification preferences
   */
  getPreferences(): NotificationPreferences {
    try {
      const stored = localStorage.getItem('notification_preferences')
      if (stored) {
        return { ...this.preferences, ...JSON.parse(stored) }
      }
    } catch (error) {
      console.warn('Failed to load notification preferences:', error)
    }
    return this.preferences
  }

  /**
   * Update notification preferences
   */
  updatePreferences(updates: Partial<NotificationPreferences>): void {
    try {
      const current = this.getPreferences()
      const updated = { ...current, ...updates }
      this.preferences = updated
      localStorage.setItem('notification_preferences', JSON.stringify(updated))
    } catch (error) {
      console.error('Failed to save notification preferences:', error)
    }
  }

  /**
   * Check if user should be notified about an activity
   */
  shouldNotify(activity: ActivityLog, currentUserId: string): boolean {
    // Don't notify users about their own actions
    if (activity.user_id === currentUserId) {
      return false
    }

    const preferences = this.getPreferences()
    if (!preferences.showInApp) {
      return false
    }

    // Check activity-specific preferences
    const activityPrefs: Record<ActivityAction, keyof NotificationPreferences> = {
      'assigned': 'taskAssigned',
      'completed': 'taskCompleted',
      'commented': 'taskCommented',
      'invited': 'projectInvited',
      'joined': 'projectJoined',
      'status_changed': 'taskStatusChanged',
      'due_date_changed': 'taskDueDateChanged',
      'updated': 'projectUpdated',
      'created': 'taskCreated',
      'unassigned': 'taskAssigned', // Use same pref as assigned
      'reopened': 'taskStatusChanged',
      'deleted': 'taskStatusChanged',
      'archived': 'projectUpdated',
      'restored': 'projectUpdated'
    }

    const prefKey = activityPrefs[activity.action]
    return prefKey ? preferences[prefKey] : false
  }

  /**
   * Generate notification content based on activity
   */
  generateNotificationContent(
    activity: ActivityLog,
    actorName: string = 'Someone'
  ): { title: string; message: string; priority: 'low' | 'medium' | 'high' } {
    const details = activity.details as any || {}
    
    switch (activity.action) {
      case 'assigned':
        return {
          title: 'Task Assigned',
          message: `${actorName} assigned you to a task`,
          priority: 'high'
        }
      
      case 'unassigned':
        return {
          title: 'Task Unassigned',
          message: `${actorName} removed you from a task`,
          priority: 'medium'
        }
      
      case 'completed':
        return {
          title: 'Task Completed',
          message: `${actorName} completed a task you're involved with`,
          priority: 'medium'
        }
      
      case 'commented':
        return {
          title: 'New Comment',
          message: `${actorName} commented on a task you're involved with`,
          priority: 'medium'
        }
      
      case 'invited':
        return {
          title: 'Project Invitation',
          message: `${actorName} invited you to join a project`,
          priority: 'high'
        }
      
      case 'joined':
        return {
          title: 'New Team Member',
          message: `${actorName} joined the project`,
          priority: 'low'
        }
      
      case 'status_changed':
        const newStatus = details.new_status || 'unknown'
        return {
          title: 'Task Status Changed',
          message: `${actorName} changed a task status to ${newStatus}`,
          priority: 'medium'
        }
      
      case 'due_date_changed':
        const newDueDate = details.new_due_date
        const dueDateText = newDueDate ? `to ${new Date(newDueDate).toLocaleDateString()}` : 'removed'
        return {
          title: 'Due Date Changed',
          message: `${actorName} changed a task due date ${dueDateText}`,
          priority: 'medium'
        }
      
      case 'created':
        return {
          title: 'New Task Created',
          message: `${actorName} created a new task`,
          priority: 'low'
        }
      
      case 'updated':
        return {
          title: 'Task Updated',
          message: `${actorName} updated a task`,
          priority: 'low'
        }
      
      case 'deleted':
        return {
          title: 'Task Deleted',
          message: `${actorName} deleted a task`,
          priority: 'medium'
        }
      
      case 'reopened':
        return {
          title: 'Task Reopened',
          message: `${actorName} reopened a task`,
          priority: 'medium'
        }
      
      default:
        return {
          title: 'Activity Update',
          message: `${actorName} performed an action`,
          priority: 'low'
        }
    }
  }

  /**
   * Check if user is relevant to an activity (should receive notification)
   */
  async isUserRelevantToActivity(activity: ActivityLog, userId: string): Promise<boolean> {
    try {
      // Always relevant if directly mentioned in invitation
      if (activity.action === 'invited') {
        const details = activity.details as any
        return details?.invited_user_id === userId
      }

      // Check if user is a member of the project
      if (activity.project_id) {
        const { data: membership } = await supabase
          .from('project_members')
          .select('id')
          .eq('project_id', activity.project_id)
          .eq('user_id', userId)
          .single()

        if (!membership) {
          return false
        }
      }

      // Check if user is assigned to the task
      if (activity.entity_type === 'task') {
        const { data: assignment } = await supabase
          .from('task_assignments')
          .select('id')
          .eq('task_id', activity.entity_id)
          .eq('user_id', userId)
          .maybeSingle()

        if (assignment) {
          return true
        }

        // Check if user is the task creator
        const { data: task } = await supabase
          .from('tasks')
          .select('created_by')
          .eq('id', activity.entity_id)
          .single()

        if (task?.created_by === userId) {
          return true
        }
      }

      // For project-level activities, relevant if user is a project member
      if (activity.entity_type === 'project' && activity.project_id) {
        return true // Already checked membership above
      }

      return false
    } catch (error) {
      console.warn('Error checking user relevance to activity:', error)
      return false
    }
  }

  /**
   * Get actor name for an activity
   */
  async getActorName(activity: ActivityLog): Promise<string> {
    if (!activity.user_id) {
      return 'System'
    }

    // For now, return a simple placeholder
    // TODO: Integrate with user service to get actual user names
    return 'Team Member'
  }

  /**
   * Process activity log and generate notification if needed
   */
  async processActivity(
    activity: ActivityLog,
    onNotification: (notification: CollaborativeNotification) => void
  ): Promise<void> {
    try {
      const currentUser = await getCurrentUser()
      if (!currentUser) {
        return
      }

      // Check if user should be notified
      if (!this.shouldNotify(activity, currentUser.id)) {
        return
      }

      // Check if user is relevant to this activity
      const isRelevant = await this.isUserRelevantToActivity(activity, currentUser.id)
      if (!isRelevant) {
        return
      }

      // Get actor name
      const actorName = await this.getActorName(activity)

      // Generate notification content
      const { title, message, priority } = this.generateNotificationContent(activity, actorName)

      // Create notification object
      const notification: CollaborativeNotification = {
        id: activity.id,
        type: activity.action,
        title,
        message,
        entityType: activity.entity_type,
        entityId: activity.entity_id,
        projectId: activity.project_id,
        userId: activity.user_id,
        timestamp: activity.created_at || new Date().toISOString(),
        read: false,
        priority
      }

      // Trigger notification
      onNotification(notification)

      // Play sound if enabled
      const preferences = this.getPreferences()
      if (preferences.playSound) {
        this.playNotificationSound()
      }

    } catch (error) {
      console.error('Error processing activity for notification:', error)
    }
  }

  /**
   * Play notification sound
   */
  private playNotificationSound(): void {
    try {
      // Create a simple notification sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1)
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.2)
    } catch (error) {
      // Fallback to system beep or silent fail
      console.warn('Could not play notification sound:', error)
    }
  }

  /**
   * Subscribe to real-time activity logs for notifications
   */
  subscribeToActivityNotifications(
    onNotification: (notification: CollaborativeNotification) => void
  ): () => void {
    const channel = supabase
      .channel('collaborative_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_logs'
        },
        async (payload) => {
          const activity = payload.new as ActivityLog
          await this.processActivity(activity, onNotification)
        }
      )
      .subscribe()

    // Return unsubscribe function
    return () => {
      supabase.removeChannel(channel)
    }
  }
}

export const notificationService = new NotificationService()
export default notificationService 