import React, { createContext, useContext, useReducer, useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { taskService } from '../services/taskService'
import { useToastContext } from './ToastContext'
import type { Task, TaskInsert, TaskUpdate } from '../types/supabase'

// Debounce function for performance optimization
const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout
  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(this, args), delay)
  }
}

// History entry for undo/redo functionality
interface HistoryEntry {
  id: string
  timestamp: number
  action: 'move' | 'create' | 'update' | 'delete'
  description: string
  previousState: Task[]
  currentState: Task[]
}

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
  | { type: 'ADD_HISTORY'; payload: HistoryEntry }
  | { type: 'UNDO'; payload: void }
  | { type: 'REDO'; payload: void }
  | { type: 'CLEAR_HISTORY'; payload: void }

interface TaskState {
  tasks: Task[]
  loading: boolean
  error: string | null
  optimisticUpdates: Map<string, Task> // Store original tasks for rollback
  history: HistoryEntry[]
  historyIndex: number // Current position in history (-1 means no history)
  maxHistorySize: number
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
  moveTaskToColumn: (taskId: string, columnId: string, newOrderIndex?: number) => Promise<Task | null>
  
  // Optimistic updates
  optimisticUpdate: (id: string, updates: Partial<Task>) => void
  revertOptimistic: (id: string) => void
  
  // History management
  canUndo: boolean
  canRedo: boolean
  undo: () => void
  redo: () => void
  addToHistory: (action: 'move' | 'create' | 'update' | 'delete', description: string, previousState: Task[], currentState: Task[]) => void
  clearHistory: () => void
  
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
  optimisticUpdates: new Map(),
  history: [],
  historyIndex: -1,
  maxHistorySize: 50
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
    
    case 'ADD_HISTORY':
      const newHistory = [...state.history.slice(0, state.historyIndex + 1), action.payload]
      // Limit history size
      const trimmedHistory = newHistory.slice(-state.maxHistorySize)
      return {
        ...state,
        history: trimmedHistory,
        historyIndex: trimmedHistory.length - 1
      }
    
    case 'UNDO':
      if (state.historyIndex >= 0) {
        const historyEntry = state.history[state.historyIndex]
        return {
          ...state,
          tasks: [...historyEntry.previousState],
          historyIndex: state.historyIndex - 1
        }
      }
      return state
    
    case 'REDO':
      if (state.historyIndex < state.history.length - 1) {
        const historyEntry = state.history[state.historyIndex + 1]
        return {
          ...state,
          tasks: [...historyEntry.currentState],
          historyIndex: state.historyIndex + 1
        }
      }
      return state
    
    case 'CLEAR_HISTORY':
      return {
        ...state,
        history: [],
        historyIndex: -1
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
  
  // Refs for performance optimization
  const lastProjectIdRef = useRef<string | null>(null)
  const debouncedOperationsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // Cleanup debounced operations on unmount
  useEffect(() => {
    return () => {
      debouncedOperationsRef.current.forEach(timeout => clearTimeout(timeout))
      debouncedOperationsRef.current.clear()
    }
  }, [])

  // Memoized selectors for better performance
  const memoizedSelectors = useMemo(() => ({
    getTaskById: (id: string): Task | undefined => 
      state.tasks.find(task => task.id === id),
    
    getTasksByStatus: (status?: 'todo' | 'in_progress' | 'done'): Task[] => 
      status ? state.tasks.filter(task => task.status === status) : state.tasks,
    
    getTasksByColumn: (columnId: string): Task[] =>
      state.tasks.filter(task => task.column_id === columnId)
        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0)),
    
    getTasksCount: () => state.tasks.length,
    
    getCompletedTasksCount: () => 
      state.tasks.filter(task => task.status === 'done').length
  }), [state.tasks])

  // History management functions with better performance
  const addToHistory = useCallback((
    action: 'move' | 'create' | 'update' | 'delete',
    description: string,
    previousState: Task[],
    currentState: Task[]
  ) => {
    const historyEntry: HistoryEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      action,
      description,
      previousState: [...previousState],
      currentState: [...currentState]
    }
    dispatch({ type: 'ADD_HISTORY', payload: historyEntry })
  }, [])

  const undo = useCallback(() => {
    if (state.historyIndex >= 0) {
      dispatch({ type: 'UNDO', payload: undefined })
    }
  }, [state.historyIndex])

  const redo = useCallback(() => {
    if (state.historyIndex < state.history.length - 1) {
      dispatch({ type: 'REDO', payload: undefined })
    }
  }, [state.historyIndex, state.history.length])

  const clearHistory = useCallback(() => {
    dispatch({ type: 'CLEAR_HISTORY', payload: undefined })
  }, [])

  // Computed values with memoization
  const canUndo = useMemo(() => state.historyIndex >= 0, [state.historyIndex])
  const canRedo = useMemo(() => state.historyIndex < state.history.length - 1, [state.historyIndex, state.history.length])

  // Optimized load tasks with caching
  const loadTasks = useCallback(async (projectId: string) => {
    // Skip if already loading the same project
    if (lastProjectIdRef.current === projectId && state.loading) {
      return
    }
    
    lastProjectIdRef.current = projectId
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
  }, [state.loading])

  // Debounced refresh for better performance
  const refreshTasks = useCallback(async (projectId: string): Promise<void> => {
    return new Promise((resolve) => {
      const timeoutId = setTimeout(async () => {
        await loadTasks(projectId)
        resolve()
      }, 500)
      
      // Store timeout for cleanup
      const key = `refresh-${projectId}`
      const existingTimeout = debouncedOperationsRef.current.get(key)
      if (existingTimeout) {
        clearTimeout(existingTimeout)
      }
      debouncedOperationsRef.current.set(key, timeoutId)
    })
  }, [loadTasks])

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

  // Update a task with optimistic update and debouncing
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
    // Store state before change for history
    const previousState = [...state.tasks]
    const task = state.tasks.find(t => t.id === id)
    const oldStatus = task?.status
    
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
        
        // Add to history for undo/redo functionality
        const currentState = state.tasks.map(t => 
          t.id === id ? { ...t, status: newStatus, order_index: newOrderIndex } : t
        )
        addToHistory(
          'move',
          `Moved task from ${oldStatus} to ${newStatus}`,
          previousState,
          currentState
        )
        
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
  }, [state.optimisticUpdates, state.tasks, addToHistory, showError])

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

  // Move task to column with optimistic update
  const moveTaskToColumn = useCallback(async (
    taskId: string, 
    columnId: string, 
    newOrderIndex?: number
  ): Promise<Task | null> => {
    // Store state before change for history
    const previousState = [...state.tasks]
    const task = state.tasks.find(t => t.id === taskId)
    
    if (!task) {
      showError('Task Not Found', 'Task could not be found')
      return null
    }

    // Apply optimistic update immediately
    const updates: Partial<Task> = { column_id: columnId }
    if (newOrderIndex !== undefined) {
      updates.order_index = newOrderIndex
    }
    
    dispatch({ 
      type: 'OPTIMISTIC_UPDATE', 
      payload: { id: taskId, updates } 
    })

    try {
      const response = await taskService.moveTaskToColumn(taskId, columnId, newOrderIndex)
      if (response.success && response.data) {
        // Replace optimistic update with real data
        dispatch({ type: 'UPDATE_TASK', payload: { id: taskId, updates: response.data } })
        
        // Add to history for undo/redo functionality
        const currentState = state.tasks.map(t => 
          t.id === taskId ? { ...t, ...updates } : t
        )
        addToHistory(
          'move',
          `Moved task to column ${columnId}`,
          previousState,
          currentState
        )
        
        return response.data
      } else {
        // Revert optimistic update on failure
        const originalTask = state.optimisticUpdates.get(taskId)
        if (originalTask) {
          dispatch({ type: 'REVERT_OPTIMISTIC', payload: { id: taskId, originalTask } })
        }
        showError('Update Failed', response.error || 'Failed to move task to column')
        return null
      }
    } catch (error) {
      // Revert optimistic update on error
      const originalTask = state.optimisticUpdates.get(taskId)
      if (originalTask) {
        dispatch({ type: 'REVERT_OPTIMISTIC', payload: { id: taskId, originalTask } })
      }
      const errorMessage = error instanceof Error ? error.message : 'Failed to move task to column'
      showError('Update Failed', errorMessage)
      return null
    }
  }, [state.optimisticUpdates, state.tasks, addToHistory, showError])

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

  // Get task by ID (using memoized selector)
  const getTaskById = useCallback((id: string): Task | undefined => {
    return memoizedSelectors.getTaskById(id)
  }, [memoizedSelectors])

  // Get tasks by status (using memoized selector)
  const getTasksByStatus = useCallback((status?: 'todo' | 'in_progress' | 'done'): Task[] => {
    return memoizedSelectors.getTasksByStatus(status)
  }, [memoizedSelectors])

  // Clear tasks
  const clearTasks = useCallback(() => {
    dispatch({ type: 'SET_TASKS', payload: [] })
  }, [])

  // Memoize context value to prevent unnecessary re-renders
  const contextValue: TaskContextValue = useMemo(() => ({
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
    moveTaskToColumn,
    
    // Optimistic updates
    optimisticUpdate,
    revertOptimistic,
    
    // History management
    canUndo,
    canRedo,
    undo,
    redo,
    addToHistory,
    clearHistory,
    
    // Utilities
    getTaskById,
    getTasksByStatus,
    clearTasks,
    refreshTasks
  }), [
    state.tasks, 
    state.loading, 
    state.error,
    loadTasks,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    updateTaskOrder,
    batchUpdateTaskOrders,
    moveTaskToColumn,
    optimisticUpdate,
    revertOptimistic,
    canUndo,
    canRedo,
    undo,
    redo,
    addToHistory,
    clearHistory,
    getTaskById,
    getTasksByStatus,
    clearTasks,
    refreshTasks
  ])

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