import { describe, it, expect } from 'vitest'
import moment from 'moment'
import {
  formatTasksToCalendarEvents,
  formatEventTitle,
  getEventBackgroundColor,
  getEventStyle,
  filterTasksByDateRange,
  getTaskStatusCounts
} from '../calendarUtils'
import type { Task } from '../../types/supabase'

// Mock task data for testing
const mockTasks: Task[] = [
  {
    id: '1',
    title: 'High Priority Task',
    description: 'Test task',
    status: 'todo',
    priority: 'high',
    project_id: 'proj1',
    created_by: 'user1',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    due_date: '2025-06-25T14:00:00Z',
    estimated_hours: 3,
    actual_hours: null,
    assignee_id: null,
    column_id: 'col1',
    order_index: 1,
    parent_task_id: null
  },
  {
    id: '2',
    title: 'Urgent Task',
    description: 'Urgent test task',
    status: 'in_progress',
    priority: 'urgent',
    project_id: 'proj1',
    created_by: 'user1',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    due_date: '2025-06-26T00:00:00Z',
    estimated_hours: null,
    actual_hours: null,
    assignee_id: null,
    column_id: 'col1',
    order_index: 2,
    parent_task_id: null
  },
  {
    id: '3',
    title: 'Completed Task',
    description: 'Done task',
    status: 'done',
    priority: 'medium',
    project_id: 'proj1',
    created_by: 'user1',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    due_date: '2025-06-24T10:30:00Z',
    estimated_hours: 2,
    actual_hours: 2.5,
    assignee_id: null,
    column_id: 'col1',
    order_index: 3,
    parent_task_id: null
  },
  {
    id: '4',
    title: 'Task Without Due Date',
    description: 'No due date',
    status: 'todo',
    priority: 'low',
    project_id: 'proj1',
    created_by: 'user1',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    due_date: null,
    estimated_hours: null,
    actual_hours: null,
    assignee_id: null,
    column_id: 'col1',
    order_index: 4,
    parent_task_id: null
  }
]

describe('calendarUtils', () => {
  describe('formatTasksToCalendarEvents', () => {
    it('should convert tasks with due dates to calendar events', () => {
      const events = formatTasksToCalendarEvents(mockTasks)
      
      expect(events).toHaveLength(3) // Only tasks with due dates
      expect(events[0].id).toBe('3') // Sorted by date (earliest first)
      expect(events[0].title).toBe('✅ Completed Task')
      expect(events[0].resource.id).toBe('3')
    })

    it('should filter out tasks without due dates', () => {
      const events = formatTasksToCalendarEvents(mockTasks)
      const taskIds = events.map(e => e.id)
      
      expect(taskIds).not.toContain('4') // Task without due date should be excluded
    })

    it('should respect status filter', () => {
      const events = formatTasksToCalendarEvents(mockTasks, {
        statusFilter: ['todo', 'in_progress']
      })
      
      expect(events).toHaveLength(2)
      expect(events.every(e => e.resource.status !== 'done')).toBe(true)
    })

    it('should respect priority filter', () => {
      const events = formatTasksToCalendarEvents(mockTasks, {
        priorityFilter: ['urgent']
      })
      
      expect(events).toHaveLength(1)
      expect(events[0].resource.priority).toBe('urgent')
    })

    it('should exclude completed tasks when specified', () => {
      const events = formatTasksToCalendarEvents(mockTasks, {
        includeCompletedTasks: false
      })
      
      expect(events.every(e => e.resource.status !== 'done')).toBe(true)
    })

    it('should handle all-day events correctly', () => {
      const events = formatTasksToCalendarEvents(mockTasks)
      const allDayEvent = events.find(e => e.resource.id === '2')
      
      expect(allDayEvent?.allDay).toBe(true) // Due date has no specific time
    })

    it('should use estimated hours for event duration', () => {
      const events = formatTasksToCalendarEvents(mockTasks)
      const timedEvent = events.find(e => e.resource.id === '1')
      
      if (timedEvent) {
        const duration = moment(timedEvent.end).diff(moment(timedEvent.start), 'hours')
        expect(duration).toBe(3) // Should use estimated_hours
      }
    })
  })

  describe('formatEventTitle', () => {
    it('should add priority indicators', () => {
      const urgentTask = mockTasks.find(t => t.priority === 'urgent')!
      const highTask = mockTasks.find(t => t.priority === 'high')!
      
      expect(formatEventTitle(urgentTask)).toBe('🔴 🔄 Urgent Task')
      expect(formatEventTitle(highTask)).toBe('🟡 High Priority Task')
    })

    it('should add status indicators', () => {
      const doneTask = mockTasks.find(t => t.status === 'done')!
      const inProgressTask = mockTasks.find(t => t.status === 'in_progress')!
      
      expect(formatEventTitle(doneTask)).toBe('✅ Completed Task')
      expect(formatEventTitle(inProgressTask)).toBe('🔴 🔄 Urgent Task')
    })
  })

  describe('getEventBackgroundColor', () => {
    it('should prioritize urgent tasks with red color', () => {
      const urgentTask = mockTasks.find(t => t.priority === 'urgent')!
      expect(getEventBackgroundColor(urgentTask)).toBe('#dc3545')
    })

    it('should use orange for high priority tasks', () => {
      const highTask = mockTasks.find(t => t.priority === 'high')!
      expect(getEventBackgroundColor(highTask)).toBe('#fd7e14')
    })

    it('should use status-based colors for non-priority tasks', () => {
      const doneTask = mockTasks.find(t => t.status === 'done')!
      expect(getEventBackgroundColor(doneTask)).toBe('#28a745') // Green for done
    })
  })

  describe('getEventStyle', () => {
    it('should return complete style object', () => {
      const task = mockTasks[0]
      const style = getEventStyle(task)
      
      expect(style).toHaveProperty('backgroundColor')
      expect(style).toHaveProperty('borderRadius', '4px')
      expect(style).toHaveProperty('color', 'white')
      expect(style).toHaveProperty('opacity')
    })

    it('should reduce opacity for completed tasks', () => {
      const doneTask = mockTasks.find(t => t.status === 'done')!
      const todoTask = mockTasks.find(t => t.status === 'todo')!
      
      const doneStyle = getEventStyle(doneTask)
      const todoStyle = getEventStyle(todoTask)
      
      expect(doneStyle.opacity).toBe(0.6)
      expect(todoStyle.opacity).toBe(0.8)
    })
  })

  describe('filterTasksByDateRange', () => {
    it('should filter tasks within date range', () => {
      const startDate = new Date('2025-06-24')
      const endDate = new Date('2025-06-25')
      
      const filtered = filterTasksByDateRange(mockTasks, startDate, endDate)
      
      expect(filtered).toHaveLength(2) // Tasks on 24th and 25th
    })

    it('should exclude tasks outside date range', () => {
      const startDate = new Date('2025-06-27')
      const endDate = new Date('2025-06-28')
      
      const filtered = filterTasksByDateRange(mockTasks, startDate, endDate)
      
      expect(filtered).toHaveLength(0)
    })
  })

  describe('getTaskStatusCounts', () => {
    it('should count tasks by status', () => {
      const counts = getTaskStatusCounts(mockTasks)
      
      expect(counts.todo).toBe(2)
      expect(counts.in_progress).toBe(1)
      expect(counts.done).toBe(1)
    })
  })
}) 