import { supabase, getCurrentUser } from '../config/supabase'
import type { 
  Task, 
  TaskInsert, 
  TaskUpdate, 
  TaskWithSubtasks,
  Subtask,
  SubtaskInsert,
  SubtaskUpdate,
  ApiResponse,
  PaginatedResponse 
} from '../types/supabase'

// Custom error classes
export class TaskError extends Error {
  public code?: string
  
  constructor(message: string, code?: string) {
    super(message)
    this.name = 'TaskError'
    this.code = code
  }
}

export class TaskPermissionError extends Error {
  constructor(message: string = 'Insufficient permissions for task operation') {
    super(message)
    this.name = 'TaskPermissionError'
  }
}

// Task service implementation
export const taskService = {
  /**
   * Get all tasks for a project
   */
  async getTasksByProject(projectId: string): Promise<ApiResponse<Task[]>> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false })

      if (error) {
        throw new TaskError(error.message, error.code)
      }

      return {
        data: data || [],
        error: null,
        success: true
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch tasks'
      return {
        data: null,
        error: message,
        success: false
      }
    }
  },

  /**
   * Get tasks with pagination
   */
  async getTasksPaginated(
    projectId: string, 
    page: number = 1, 
    limit: number = 20,
    status?: 'todo' | 'in_progress' | 'done'
  ): Promise<PaginatedResponse<Task>> {
    try {
      const offset = (page - 1) * limit
      let query = supabase
        .from('tasks')
        .select('*', { count: 'exact' })
        .eq('project_id', projectId)

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error, count } = await query
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        throw new TaskError(error.message, error.code)
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
      const message = error instanceof Error ? error.message : 'Failed to fetch tasks'
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
   * Get a single task by ID with subtasks
   */
  async getTaskById(id: string): Promise<ApiResponse<TaskWithSubtasks>> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          subtasks(
            id,
            task_id,
            title,
            description,
            completed,
            order_index,
            created_by,
            created_at,
            updated_at
          )
        `)
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          throw new TaskError('Task not found', 'NOT_FOUND')
        }
        throw new TaskError(error.message, error.code)
      }

      return {
        data: data as TaskWithSubtasks,
        error: null,
        success: true
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch task'
      return {
        data: null,
        error: message,
        success: false
      }
    }
  },

  /**
   * Create a new task
   */
  async createTask(taskData: Omit<TaskInsert, 'created_by'>): Promise<ApiResponse<Task>> {
    try {
      const user = await getCurrentUser()
      if (!user) {
        throw new TaskPermissionError('Must be authenticated to create tasks')
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          ...taskData,
          created_by: user.id,
          status: taskData.status || 'todo'
        })
        .select()
        .single()

      if (error) {
        throw new TaskError(error.message, error.code)
      }

      return {
        data,
        error: null,
        success: true
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create task'
      return {
        data: null,
        error: message,
        success: false
      }
    }
  },

  /**
   * Update a task
   */
  async updateTask(id: string, updates: TaskUpdate): Promise<ApiResponse<Task>> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          throw new TaskError('Task not found', 'NOT_FOUND')
        }
        throw new TaskError(error.message, error.code)
      }

      return {
        data,
        error: null,
        success: true
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update task'
      return {
        data: null,
        error: message,
        success: false
      }
    }
  },

  /**
   * Delete a task
   */
  async deleteTask(id: string): Promise<ApiResponse<boolean>> {
    try {
      // First, delete all subtasks
      await supabase
        .from('subtasks')
        .delete()
        .eq('task_id', id)

      // Then delete the task
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)

      if (error) {
        if (error.code === 'PGRST116') {
          throw new TaskError('Task not found', 'NOT_FOUND')
        }
        throw new TaskError(error.message, error.code)
      }

      return {
        data: true,
        error: null,
        success: true
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete task'
      return {
        data: null,
        error: message,
        success: false
      }
    }
  },

  /**
   * Update task status
   */
  async updateTaskStatus(id: string, status: 'todo' | 'in_progress' | 'done'): Promise<ApiResponse<Task>> {
    return this.updateTask(id, { status })
  },

  /**
   * Assign task to user
   */
  async assignTask(id: string, assigneeId: string): Promise<ApiResponse<Task>> {
    return this.updateTask(id, { assignee_id: assigneeId })
  },

  /**
   * Unassign task
   */
  async unassignTask(id: string): Promise<ApiResponse<Task>> {
    return this.updateTask(id, { assignee_id: null })
  },

  /**
   * Update task priority
   */
  async updateTaskPriority(id: string, priority: 'low' | 'medium' | 'high' | 'urgent'): Promise<ApiResponse<Task>> {
    return this.updateTask(id, { priority })
  },

  /**
   * Update task due date
   */
  async updateTaskDueDate(id: string, dueDate: string | null): Promise<ApiResponse<Task>> {
    return this.updateTask(id, { due_date: dueDate })
  },

  /**
   * Get tasks assigned to current user
   */
  async getMyTasks(): Promise<ApiResponse<Task[]>> {
    try {
      const user = await getCurrentUser()
      if (!user) {
        throw new TaskPermissionError('Must be authenticated to view assigned tasks')
      }

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('assignee_id', user.id)
        .order('due_date', { ascending: true, nullsFirst: false })
        .order('priority', { ascending: false })

      if (error) {
        throw new TaskError(error.message, error.code)
      }

      return {
        data: data || [],
        error: null,
        success: true
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch assigned tasks'
      return {
        data: null,
        error: message,
        success: false
      }
    }
  },

  /**
   * Search tasks
   */
  async searchTasks(projectId: string, query: string): Promise<ApiResponse<Task[]>> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .order('updated_at', { ascending: false })

      if (error) {
        throw new TaskError(error.message, error.code)
      }

      return {
        data: data || [],
        error: null,
        success: true
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to search tasks'
      return {
        data: null,
        error: message,
        success: false
      }
    }
  },

  /**
   * Update task order and status for drag and drop
   */
  async updateTaskOrder(id: string, newStatus: 'todo' | 'in_progress' | 'done', newOrderIndex: number): Promise<ApiResponse<Task>> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          status: newStatus,
          order_index: newOrderIndex,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          throw new TaskError('Task not found', 'NOT_FOUND')
        }
        throw new TaskError(error.message, error.code)
      }

      return {
        data,
        error: null,
        success: true
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update task order'
      return {
        data: null,
        error: message,
        success: false
      }
    }
  },

  /**
   * Batch update task orders for reordering within the same status
   */
  async batchUpdateTaskOrders(updates: { id: string; order_index: number }[]): Promise<ApiResponse<boolean>> {
    try {
      // Update each task individually
      for (const update of updates) {
        const { error } = await supabase
          .from('tasks')
          .update({ 
            order_index: update.order_index,
            updated_at: new Date().toISOString()
          })
          .eq('id', update.id)

        if (error) {
          throw new TaskError(error.message, error.code)
        }
      }

      return {
        data: true,
        error: null,
        success: true
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update task orders'
      return {
        data: null,
        error: message,
        success: false
      }
    }
  }
}

// Subtask service implementation
export const subtaskService = {
  /**
   * Get all subtasks for a task
   */
  async getSubtasksByTask(taskId: string): Promise<ApiResponse<Subtask[]>> {
    try {
      const { data, error } = await supabase
        .from('subtasks')
        .select('*')
        .eq('task_id', taskId)
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false })

      if (error) {
        throw new TaskError(error.message, error.code)
      }

      return {
        data: data || [],
        error: null,
        success: true
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch subtasks'
      return {
        data: null,
        error: message,
        success: false
      }
    }
  },

  /**
   * Create a new subtask
   */
  async createSubtask(subtaskData: Omit<SubtaskInsert, 'created_by'>): Promise<ApiResponse<Subtask>> {
    try {
      const user = await getCurrentUser()
      if (!user) {
        throw new TaskPermissionError('Must be authenticated to create subtasks')
      }

      const { data, error } = await supabase
        .from('subtasks')
        .insert({
          ...subtaskData,
          created_by: user.id,
          completed: subtaskData.completed || false
        })
        .select()
        .single()

      if (error) {
        throw new TaskError(error.message, error.code)
      }

      return {
        data,
        error: null,
        success: true
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create subtask'
      return {
        data: null,
        error: message,
        success: false
      }
    }
  },

  /**
   * Update a subtask
   */
  async updateSubtask(id: string, updates: SubtaskUpdate): Promise<ApiResponse<Subtask>> {
    try {
      const { data, error } = await supabase
        .from('subtasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          throw new TaskError('Subtask not found', 'NOT_FOUND')
        }
        throw new TaskError(error.message, error.code)
      }

      return {
        data,
        error: null,
        success: true
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update subtask'
      return {
        data: null,
        error: message,
        success: false
      }
    }
  },

  /**
   * Delete a subtask
   */
  async deleteSubtask(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('subtasks')
        .delete()
        .eq('id', id)

      if (error) {
        if (error.code === 'PGRST116') {
          throw new TaskError('Subtask not found', 'NOT_FOUND')
        }
        throw new TaskError(error.message, error.code)
      }

      return {
        data: true,
        error: null,
        success: true
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete subtask'
      return {
        data: null,
        error: message,
        success: false
      }
    }
  },

  /**
   * Toggle subtask completion
   */
  async toggleSubtaskCompletion(id: string): Promise<ApiResponse<Subtask>> {
    try {
      // First get the current state
      const { data: currentSubtask, error: fetchError } = await supabase
        .from('subtasks')
        .select('completed')
        .eq('id', id)
        .single()

      if (fetchError) {
        throw new TaskError(fetchError.message, fetchError.code)
      }

      // Toggle the completion status
      return this.updateSubtask(id, { completed: !currentSubtask.completed })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to toggle subtask completion'
      return {
        data: null,
        error: message,
        success: false
      }
    }
  }
} 