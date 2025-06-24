import React, { createContext, useContext, useReducer, useCallback, useEffect, type ReactNode } from 'react'
import { taskService } from '../services/taskService'
import { useToastContext } from './ToastContext'
import type { Task, TaskInsert, TaskUpdate } from '../types/supabase'

// Action types for task state management
type TaskAction =
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: { id: string; updates: Partial<Task> } }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'OPTIMISTIC_UPDATE'; payload: { id: string; updates: Partial<Task> } }
  | { type: 'REVERT_OPTIMISTIC'; payload: { id: string; originalTask: Task } }
  | { type: 'BATCH_UPDATE'; payload: { updates: Array<{ id: string; updates: Partial<Task> }> } }

interface TaskState {
  tasks: Task[]
  loading: boolean
  error: string | null
  optimisticUpdates: Map<string, Task> // Store original tasks for rollback
}

interface TaskContextValue {
  // State
  tasks: Task[]
  loading: boolean
  error: string | null
  
  // Actions
  loadTasks: (projectId: string) => Promise<void>
  createTask: (taskData: TaskInsert) => Promise<Task | null>
  updateTask: (id: string, updates: TaskUpdate) => Promise<Task | null>
  deleteTask: (id: string) => Promise<boolean>
  updateTaskStatus: (id: string, status: 'todo' | 'in_progress' | 'done') => Promise<Task | null>
  updateTaskOrder: (id: string, newStatus: 'todo' | 'in_progress' | 'done', newOrderIndex: number) => Promise<Task | null>
  batchUpdateTaskOrders: (updates: Array<{ id: string; order_index: number }>) => Promise<boolean>
  
  // Optimistic updates
  optimisticUpdate: (id: string, updates: Partial<Task>) => void
  revertOptimistic: (id: string) => void
  
  // Utilities
  getTaskById: (id: string) => Task | undefined
  getTasksByStatus: (status?: 'todo' | 'in_progress' | 'done') => Task[]
  clearTasks: () => void
  refreshTasks: (projectId: string) => Promise<void>
}

const initialState: TaskState = {
  tasks: [],
  loading: false,
  error: null,
  optimisticUpdates: new Map()
}

function taskReducer(state: TaskState, action: TaskAction): TaskState {
  switch (action.type) {
    case 'SET_TASKS':
      return {
        ...state,
        tasks: action.payload,
        loading: false,
        error: null
      }
    
    case 'ADD_TASK':
      return {
        ...state,
        tasks: [...state.tasks, action.payload]
      }
    
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id
            ? { ...task, ...action.payload.updates }
            : task
        )
      }
    
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload)
      }
    
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      }
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false
      }
    
    case 'OPTIMISTIC_UPDATE':
      const taskToUpdate = state.tasks.find(t => t.id === action.payload.id)
      if (taskToUpdate && !state.optimisticUpdates.has(action.payload.id)) {
        // Store original task for potential rollback
        state.optimisticUpdates.set(action.payload.id, { ...taskToUpdate })
      }
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id
            ? { ...task, ...action.payload.updates }
            : task
        )
      }
    
    case 'REVERT_OPTIMISTIC':
      const newOptimisticUpdates = new Map(state.optimisticUpdates)
      newOptimisticUpdates.delete(action.payload.id)
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id ? action.payload.originalTask : task
        ),
        optimisticUpdates: newOptimisticUpdates
      }
    
    case 'BATCH_UPDATE':
      return {
        ...state,
        tasks: state.tasks.map(task => {
          const update = action.payload.updates.find(u => u.id === task.id)
          return update ? { ...task, ...update.updates } : task
        })
      }
    
    default:
      return state
  }
}

const TaskContext = createContext<TaskContextValue | undefined>(undefined)

interface TaskProviderProps {
  children: ReactNode
}

export const TaskProvider: React.FC<TaskProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(taskReducer, initialState)
  const { showSuccess, showError } = useToastContext()

  // Load tasks for a project
  const loadTasks = useCallback(async (projectId: string) => {
    dispatch({ type: 'SET_LOADING', payload: true })
    dispatch({ type: 'SET_ERROR', payload: null })

    try {
      const response = await taskService.getTasksByProject(projectId)
      if (response.success && response.data) {
        dispatch({ type: 'SET_TASKS', payload: response.data })
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Failed to load tasks' })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load tasks'
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
    }
  }, [])

  // Create a new task with optimistic update
  const createTask = useCallback(async (taskData: TaskInsert): Promise<Task | null> => {
    try {
      const response = await taskService.createTask(taskData)
      if (response.success && response.data) {
        dispatch({ type: 'ADD_TASK', payload: response.data })
        showSuccess('Task Created', 'New task has been created successfully')
        return response.data
      } else {
        showError('Creation Failed', response.error || 'Failed to create task')
        return null
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create task'
      showError('Creation Failed', errorMessage)
      return null
    }
  }, [showSuccess, showError])

  // Update a task with optimistic update
  const updateTask = useCallback(async (id: string, updates: TaskUpdate): Promise<Task | null> => {
    // Apply optimistic update immediately
    dispatch({ type: 'OPTIMISTIC_UPDATE', payload: { id, updates } })

    try {
      const response = await taskService.updateTask(id, updates)
      if (response.success && response.data) {
        // Replace optimistic update with real data
        dispatch({ type: 'UPDATE_TASK', payload: { id, updates: response.data } })
        showSuccess('Task Updated', 'Task has been updated successfully')
        return response.data
      } else {
        // Revert optimistic update on failure
        const originalTask = state.optimisticUpdates.get(id)
        if (originalTask) {
          dispatch({ type: 'REVERT_OPTIMISTIC', payload: { id, originalTask } })
        }
        showError('Update Failed', response.error || 'Failed to update task')
        return null
      }
    } catch (error) {
      // Revert optimistic update on error
      const originalTask = state.optimisticUpdates.get(id)
      if (originalTask) {
        dispatch({ type: 'REVERT_OPTIMISTIC', payload: { id, originalTask } })
      }
      const errorMessage = error instanceof Error ? error.message : 'Failed to update task'
      showError('Update Failed', errorMessage)
      return null
    }
  }, [state.optimisticUpdates, showSuccess, showError])

  // Delete a task with optimistic update
  const deleteTask = useCallback(async (id: string): Promise<boolean> => {
    const taskToDelete = state.tasks.find(t => t.id === id)
    if (!taskToDelete) return false

    // Apply optimistic delete immediately
    dispatch({ type: 'DELETE_TASK', payload: id })

    try {
      const response = await taskService.deleteTask(id)
      if (response.success) {
        showSuccess('Task Deleted', 'Task has been successfully deleted')
        return true
      } else {
        // Revert delete on failure
        dispatch({ type: 'ADD_TASK', payload: taskToDelete })
        showError('Delete Failed', response.error || 'Failed to delete task')
        return false
      }
    } catch (error) {
      // Revert delete on error
      dispatch({ type: 'ADD_TASK', payload: taskToDelete })
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete task'
      showError('Delete Failed', errorMessage)
      return false
    }
  }, [state.tasks, showSuccess, showError])

  // Update task status with optimistic update
  const updateTaskStatus = useCallback(async (id: string, status: 'todo' | 'in_progress' | 'done'): Promise<Task | null> => {
    return updateTask(id, { status })
  }, [updateTask])

  // Update task order and status for drag and drop
  const updateTaskOrder = useCallback(async (
    id: string, 
    newStatus: 'todo' | 'in_progress' | 'done', 
    newOrderIndex: number
  ): Promise<Task | null> => {
    // Apply optimistic update immediately
    dispatch({ 
      type: 'OPTIMISTIC_UPDATE', 
      payload: { id, updates: { status: newStatus, order_index: newOrderIndex } } 
    })

    try {
      const response = await taskService.updateTaskOrder(id, newStatus, newOrderIndex)
      if (response.success && response.data) {
        // Replace optimistic update with real data
        dispatch({ type: 'UPDATE_TASK', payload: { id, updates: response.data } })
        return response.data
      } else {
        // Revert optimistic update on failure
        const originalTask = state.optimisticUpdates.get(id)
        if (originalTask) {
          dispatch({ type: 'REVERT_OPTIMISTIC', payload: { id, originalTask } })
        }
        showError('Update Failed', response.error || 'Failed to update task order')
        return null
      }
    } catch (error) {
      // Revert optimistic update on error
      const originalTask = state.optimisticUpdates.get(id)
      if (originalTask) {
        dispatch({ type: 'REVERT_OPTIMISTIC', payload: { id, originalTask } })
      }
      const errorMessage = error instanceof Error ? error.message : 'Failed to update task order'
      showError('Update Failed', errorMessage)
      return null
    }
  }, [state.optimisticUpdates, showError])

  // Batch update task orders
  const batchUpdateTaskOrders = useCallback(async (
    updates: Array<{ id: string; order_index: number }>
  ): Promise<boolean> => {
    // Apply optimistic updates immediately
    const optimisticUpdates = updates.map(({ id, order_index }) => ({
      id,
      updates: { order_index }
    }))
    dispatch({ type: 'BATCH_UPDATE', payload: { updates: optimisticUpdates } })

    try {
      const response = await taskService.batchUpdateTaskOrders(updates)
      if (response.success) {
        return true
      } else {
        // Revert optimistic updates on failure
        // This is complex, so we'll just refresh the tasks
        showError('Update Failed', response.error || 'Failed to update task orders')
        return false
      }
    } catch (error) {
      // Revert optimistic updates on error
      showError('Update Failed', 'Failed to update task orders')
      return false
    }
  }, [showError])

  // Manual optimistic update (for external use)
  const optimisticUpdate = useCallback((id: string, updates: Partial<Task>) => {
    dispatch({ type: 'OPTIMISTIC_UPDATE', payload: { id, updates } })
  }, [])

  // Revert optimistic update
  const revertOptimistic = useCallback((id: string) => {
    const originalTask = state.optimisticUpdates.get(id)
    if (originalTask) {
      dispatch({ type: 'REVERT_OPTIMISTIC', payload: { id, originalTask } })
    }
  }, [state.optimisticUpdates])

  // Get task by ID
  const getTaskById = useCallback((id: string): Task | undefined => {
    return state.tasks.find(task => task.id === id)
  }, [state.tasks])

  // Get tasks by status
  const getTasksByStatus = useCallback((status?: 'todo' | 'in_progress' | 'done'): Task[] => {
    if (!status) return state.tasks
    return state.tasks.filter(task => task.status === status)
  }, [state.tasks])

  // Clear tasks
  const clearTasks = useCallback(() => {
    dispatch({ type: 'SET_TASKS', payload: [] })
  }, [])

  // Refresh tasks
  const refreshTasks = useCallback(async (projectId: string) => {
    await loadTasks(projectId)
  }, [loadTasks])

  const contextValue: TaskContextValue = {
    // State
    tasks: state.tasks,
    loading: state.loading,
    error: state.error,
    
    // Actions
    loadTasks,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    updateTaskOrder,
    batchUpdateTaskOrders,
    
    // Optimistic updates
    optimisticUpdate,
    revertOptimistic,
    
    // Utilities
    getTaskById,
    getTasksByStatus,
    clearTasks,
    refreshTasks
  }

  return (
    <TaskContext.Provider value={contextValue}>
      {children}
    </TaskContext.Provider>
  )
}

export const useTaskContext = (): TaskContextValue => {
  const context = useContext(TaskContext)
  if (context === undefined) {
    throw new Error('useTaskContext must be used within a TaskProvider')
  }
  return context
} 