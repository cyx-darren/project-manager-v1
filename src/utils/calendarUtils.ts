import moment from 'moment'
import type { Task, PriorityLevel, TaskStatus } from '../types/supabase'

export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: Task
  allDay?: boolean
}

export interface CalendarEventOptions {
  includeAllDayEvents?: boolean
  defaultDuration?: number // in hours
  includeCompletedTasks?: boolean
  priorityFilter?: PriorityLevel[]
  statusFilter?: TaskStatus[]
}

/**
 * Formats project tasks into calendar events compatible with react-big-calendar
 * @param tasks - Array of tasks to convert
 * @param options - Options for filtering and formatting
 * @returns Array of calendar events
 */
export function formatTasksToCalendarEvents(
  tasks: Task[],
  options: CalendarEventOptions = {}
): CalendarEvent[] {
  const {
    includeAllDayEvents = true,
    defaultDuration = 1, // 1 hour default
    includeCompletedTasks = true,
    priorityFilter,
    statusFilter
  } = options

  return tasks
    .filter(task => {
      // Only include tasks with due dates
      if (!task.due_date) return false

      // Filter by status if specified
      if (statusFilter && statusFilter.length > 0) {
        if (!statusFilter.includes(task.status)) return false
      }

      // Filter by priority if specified
      if (priorityFilter && priorityFilter.length > 0) {
        if (!task.priority || !priorityFilter.includes(task.priority)) return false
      }

      // Optionally exclude completed tasks
      if (!includeCompletedTasks && task.status === 'done') {
        return false
      }

      return true
    })
    .map(task => {
      const dueDate = moment(task.due_date!)
      
      // Determine if this should be an all-day event
      const isAllDay = includeAllDayEvents && (
        // If no specific time is set (just date), make it all-day
        dueDate.hour() === 0 && dueDate.minute() === 0 && dueDate.second() === 0
      )

      let startDate: Date
      let endDate: Date

      if (isAllDay) {
        // For all-day events, set to start of day
        startDate = dueDate.clone().startOf('day').toDate()
        endDate = dueDate.clone().endOf('day').toDate()
      } else {
        // For timed events, use the due date as start and add estimated duration
        startDate = dueDate.toDate()
        
        if (task.estimated_hours && task.estimated_hours > 0) {
          endDate = dueDate.clone().add(task.estimated_hours, 'hours').toDate()
        } else {
          endDate = dueDate.clone().add(defaultDuration, 'hours').toDate()
        }
      }

      return {
        id: task.id || `task-${Date.now()}`,
        title: formatEventTitle(task),
        start: startDate,
        end: endDate,
        resource: task,
        allDay: isAllDay
      }
    })
    .sort((a, b) => a.start.getTime() - b.start.getTime()) // Sort by start date
}

/**
 * Formats the task title for display in calendar events
 * @param task - The task to format
 * @returns Formatted title string
 */
export function formatEventTitle(task: Task): string {
  // Safety check for undefined/null title
  let title = task?.title || 'Untitled Task'

  // Add priority indicator for high/urgent tasks
  if (task.priority === 'urgent') {
    title = `🔴 ${title}`
  } else if (task.priority === 'high') {
    title = `🟡 ${title}`
  }

  // Add status indicator
  switch (task.status) {
    case 'done':
      title = `✅ ${title}`
      break
    case 'in_progress':
      title = `🔄 ${title}`
      break
    case 'todo':
      // No prefix for todo tasks
      break
  }

  return title
}

/**
 * Gets the background color for a calendar event based on task properties
 * @param task - The task to get color for
 * @returns CSS color string
 */
export function getEventBackgroundColor(task: Task): string {
  // Priority-based colors take precedence
  if (task.priority === 'urgent') {
    return '#dc3545' // Red
  }
  
  if (task.priority === 'high') {
    return '#fd7e14' // Orange
  }

  // Status-based colors
  switch (task.status) {
    case 'done':
      return '#28a745' // Green
    case 'in_progress':
      return '#ffc107' // Yellow
    case 'todo':
      return '#6c757d' // Gray
    default:
      return '#3174ad' // Blue
  }
}

/**
 * Gets additional style properties for calendar events
 * @param task - The task to get styles for
 * @returns Style object
 */
export function getEventStyle(task: Task) {
  const backgroundColor = getEventBackgroundColor(task)
  
  return {
    backgroundColor,
    borderRadius: '4px',
    opacity: task.status === 'done' ? 0.6 : 0.8,
    color: 'white',
    border: '0px',
    display: 'block',
    fontSize: '12px',
    padding: '2px 4px'
  }
}

/**
 * Filters tasks by date range for calendar view optimization
 * @param tasks - Array of tasks to filter
 * @param startDate - Start of date range
 * @param endDate - End of date range
 * @returns Filtered tasks within the date range
 */
export function filterTasksByDateRange(
  tasks: Task[],
  startDate: Date,
  endDate: Date
): Task[] {
  const start = moment(startDate).startOf('day')
  const end = moment(endDate).endOf('day')

  return tasks.filter(task => {
    if (!task.due_date) return false
    
    const taskDate = moment(task.due_date)
    return taskDate.isBetween(start, end, null, '[]') // inclusive
  })
}

/**
 * Groups tasks by status for calendar view statistics
 * @param tasks - Array of tasks to group
 * @returns Object with task counts by status
 */
export function getTaskStatusCounts(tasks: Task[]) {
  return tasks.reduce((counts, task) => {
    counts[task.status] = (counts[task.status] || 0) + 1
    return counts
  }, {} as Record<TaskStatus, number>)
} 