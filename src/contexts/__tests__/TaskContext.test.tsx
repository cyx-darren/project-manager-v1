import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { TaskProvider, useTaskContext } from '../TaskContext'
import { taskService } from '../../services/taskService'
import { useToastContext } from '../ToastContext'
import type { Task, TaskStatus } from '../../types/supabase'

// Mock the toast context
const mockToast = {
  showSuccess: vi.fn(),
  showError: vi.fn(),
  showWarning: vi.fn(),
  showInfo: vi.fn(),
}

vi.mock('../ToastContext', () => ({
  useToastContext: () => mockToast
}))

// Mock the task service
vi.mock('../../services/taskService', () => ({
  taskService: {
    getTasksByProject: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    updateTaskStatus: vi.fn(),
    updateTaskOrder: vi.fn(),
    batchUpdateTaskOrders: vi.fn(),
  }
}))

const mockTaskService = taskService as any

// Test data
const mockTask: Task = {
  id: 'task-1',
  title: 'Test Task',
  description: 'Test Description',
  status: 'todo',
  priority: 'medium',
  project_id: 'project-1',
  created_by: 'user-1',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
  assignee_id: null,
  due_date: null,
  estimated_hours: null,
  actual_hours: null,
  order_index: 0,
  parent_task_id: null,
  column_id: null
}

const mockUpdatedTask: Task = {
  ...mockTask,
  title: 'Updated Task',
  updated_at: '2024-01-01T01:00:00Z'
}

// Test wrapper
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TaskProvider>{children}</TaskProvider>
)

describe('TaskContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset all mock implementations
    mockTaskService.getTasksByProject.mockResolvedValue({ success: true, data: [], error: null })
    mockTaskService.createTask.mockResolvedValue({ success: true, data: mockTask, error: null })
    mockTaskService.updateTask.mockResolvedValue({ success: true, data: mockUpdatedTask, error: null })
    mockTaskService.deleteTask.mockResolvedValue({ success: true, data: true, error: null })
    mockTaskService.updateTaskStatus.mockResolvedValue({ success: true, data: mockUpdatedTask, error: null })
    mockTaskService.updateTaskOrder.mockResolvedValue({ success: true, data: mockUpdatedTask, error: null })
    mockTaskService.batchUpdateTaskOrders.mockResolvedValue({ success: true, data: true, error: null })
  })

  describe('Initial State', () => {
    it('should provide initial empty state', () => {
      const { result } = renderHook(() => useTaskContext(), { wrapper })

      expect(result.current.tasks).toEqual([])
      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  describe('loadTasks', () => {
    it('should load tasks successfully', async () => {
      const mockTasks = [mockTask]
      mockTaskService.getTasksByProject.mockResolvedValue({ success: true, data: mockTasks, error: null })

      const { result } = renderHook(() => useTaskContext(), { wrapper })

      await act(async () => {
        await result.current.loadTasks('project-1')
      })

      expect(result.current.tasks).toEqual(mockTasks)
      expect(result.current.loading).toBe(false)
      expect(mockTaskService.getTasksByProject).toHaveBeenCalledWith('project-1')
    })

    it('should handle load tasks error', async () => {
      const errorMessage = 'Failed to load tasks'
      mockTaskService.getTasksByProject.mockResolvedValue({ success: false, error: errorMessage, data: null })

      const { result } = renderHook(() => useTaskContext(), { wrapper })

      await act(async () => {
        await result.current.loadTasks('project-1')
      })

      expect(result.current.tasks).toEqual([])
      expect(result.current.error).toBe(errorMessage)
      // Note: Based on the actual implementation, error loading doesn't show a toast
    })
  })

  describe('createTask', () => {
    it('should create task with optimistic update', async () => {
      const { result } = renderHook(() => useTaskContext(), { wrapper })

      const newTaskData = {
        title: 'New Task',
        description: 'New description',
        project_id: 'project-1',
        status: 'todo' as TaskStatus,
        priority: 'medium' as const,
        created_by: 'user-1'
      }

      let createdTask: Task | null = null
      await act(async () => {
        createdTask = await result.current.createTask(newTaskData)
      })

      expect(createdTask).toEqual(mockTask)
      expect(result.current.tasks).toContain(mockTask)
      expect(mockTaskService.createTask).toHaveBeenCalledWith(newTaskData)
      expect(mockToast.showSuccess).toHaveBeenCalledWith('Task Created', 'New task has been created successfully')
    })

    it('should handle create task error with rollback', async () => {
      const errorMessage = 'Failed to create task'
      mockTaskService.createTask.mockResolvedValue({ success: false, error: errorMessage, data: null })

      const { result } = renderHook(() => useTaskContext(), { wrapper })

      const newTaskData = {
        title: 'New Task',
        description: 'New description',
        project_id: 'project-1',
        status: 'todo' as TaskStatus,
        priority: 'medium' as const,
        created_by: 'user-1'
      }

      let createdTask: Task | null = null
      await act(async () => {
        createdTask = await result.current.createTask(newTaskData)
      })

      expect(createdTask).toBeNull()
      expect(result.current.tasks).toEqual([]) // Should be rolled back
      expect(mockToast.showError).toHaveBeenCalledWith('Creation Failed', 'Failed to create task')
    })
  })
}) 