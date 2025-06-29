import { supabase, getCurrentUser } from '../config/supabase'
import { handleTaskError, retryOperation } from '../utils/taskErrorHandler'
import { permissionService } from './permissionService'
import { collaborationService } from './collaborationService'
import type { 
  Task, 
  TaskInsert, 
  TaskUpdate, 
  TaskWithSubtasks,
  Subtask,
  SubtaskInsert,
  SubtaskUpdate,
  ApiResponse,
  PaginatedResponse,
  BoardColumn
} from '../types/supabase'
import type { PermissionContext } from '../types/permissions'

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

// Helper function to check task permissions
async function checkTaskPermission(
  permission: 'task.view' | 'task.create' | 'task.edit' | 'task.delete' | 'task.assign' | 'task.status.change' | 'task.priority.change',
  projectId: string,
  taskId?: string
): Promise<void> {
  const user = await getCurrentUser()
  if (!user) {
    throw new TaskPermissionError('Must be authenticated to perform task operations')
  }

  const context: PermissionContext = { projectId, taskId }
  const result = await permissionService.hasPermission(user.id, permission, context)
  
  if (!result.hasPermission) {
    throw new TaskPermissionError(`Insufficient permissions: ${permission}. Required role: ${result.requiredRole || 'member'}`)
  }
}

// Task service implementation
export const taskService = {
  /**
   * Get all tasks for a project
   */
  async getTasksByProject(projectId: string): Promise<ApiResponse<Task[]>> {
    try {
      // Check permission to view tasks
      await checkTaskPermission('task.view', projectId)

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
   * Get tasks by column for the new column-based Kanban board
   */
  async getTasksByColumn(projectId: string, columnId: string): Promise<ApiResponse<Task[]>> {
    try {
      // Check permission to view tasks
      await checkTaskPermission('task.view', projectId)

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .eq('column_id', columnId)
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
      const message = error instanceof Error ? error.message : 'Failed to fetch tasks by column'
      return {
        data: null,
        error: message,
        success: false
      }
    }
  },

  /**
   * Get tasks organized by columns for Kanban board
   */
  async getTasksByColumns(projectId: string): Promise<ApiResponse<Record<string, Task[]>>> {
    try {
      // Check permission to view tasks
      await checkTaskPermission('task.view', projectId)

      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          board_columns!inner(id, name, position)
        `)
        .eq('project_id', projectId)
        .not('column_id', 'is', null)
        .order('order_index', { ascending: true })

      if (error) {
        throw new TaskError(error.message, error.code)
      }

      // Group tasks by column_id
      const tasksByColumn: Record<string, Task[]> = {}
      data?.forEach((task: any) => {
        const columnId = task.column_id
        if (!tasksByColumn[columnId]) {
          tasksByColumn[columnId] = []
        }
        tasksByColumn[columnId].push(task)
      })

      return {
        data: tasksByColumn,
        error: null,
        success: true
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch tasks by columns'
      return {
        data: null,
        error: message,
        success: false
      }
    }
  },

  /**
   * Move a task to a different column
   */
  async moveTaskToColumn(taskId: string, columnId: string, newOrderIndex?: number): Promise<ApiResponse<Task>> {
    try {
      const user = await getCurrentUser()
      if (!user) {
        throw new TaskPermissionError('Must be authenticated to move tasks')
      }

      // Get the task to find its project
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select('project_id')
        .eq('id', taskId)
        .single()

      if (taskError || !task) {
        throw new TaskError('Task not found', 'NOT_FOUND')
      }

      // Check permission to edit tasks
      await checkTaskPermission('task.edit', task.project_id, taskId)

      // If no order index provided, put it at the end of the column
      let orderIndex = newOrderIndex
      if (orderIndex === undefined) {
        const { data: columnTasks } = await supabase
          .from('tasks')
          .select('order_index')
          .eq('column_id', columnId)
          .order('order_index', { ascending: false })
          .limit(1)

        orderIndex = columnTasks && columnTasks.length > 0 
          ? (columnTasks[0].order_index || 0) + 1 
          : 0
      }

      const { data, error } = await supabase
        .from('tasks')
        .update({ 
          column_id: columnId,
          order_index: orderIndex,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
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
      const message = error instanceof Error ? error.message : 'Failed to move task to column'
      return {
        data: null,
        error: message,
        success: false
      }
    }
  },

  /**
   * Batch update task positions within columns (for drag and drop reordering)
   */
  async batchUpdateTaskPositions(updates: { id: string; column_id: string; order_index: number }[]): Promise<ApiResponse<boolean>> {
    try {
      const user = await getCurrentUser()
      if (!user) {
        throw new TaskPermissionError('Must be authenticated to reorder tasks')
      }

      // Perform batch updates
      const updatePromises = updates.map(({ id, column_id, order_index }) =>
        supabase
          .from('tasks')
          .update({ 
            column_id,
            order_index,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
      )

      const results = await Promise.all(updatePromises)
      
      // Check for errors
      const errors = results.filter(result => result.error)
      if (errors.length > 0) {
        throw new TaskError('Failed to update some task positions')
      }

      return {
        data: true,
        error: null,
        success: true
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update task positions'
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
      // First get the task to find its project for permission check
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('project_id')
        .eq('id', id)
        .single()

      if (taskError) {
        if (taskError.code === 'PGRST116') {
          throw new TaskError('Task not found', 'NOT_FOUND')
        }
        throw new TaskError(taskError.message, taskError.code)
      }

      // Check permission to view tasks
      await checkTaskPermission('task.view', taskData.project_id, id)

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

      // Check permission to create tasks
      await checkTaskPermission('task.create', taskData.project_id)

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

      // Log activity for task creation
      try {
        await collaborationService.logActivity({
          user_id: user.id,
          project_id: taskData.project_id,
          entity_type: 'task',
          entity_id: data.id,
          action: 'created',
          details: {
            task_title: data.title,
            assignee_id: data.assignee_id,
            priority: data.priority
          }
        })
      } catch (logError) {
        console.warn('Failed to log task creation activity:', logError)
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
      const user = await getCurrentUser()
      if (!user) {
        throw new TaskPermissionError('Must be authenticated to update tasks')
      }

      // First get the current task data for comparison and permission check
      const { data: currentTask, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single()

      if (taskError) {
        if (taskError.code === 'PGRST116') {
          throw new TaskError('Task not found', 'NOT_FOUND')
        }
        throw new TaskError(taskError.message, taskError.code)
      }

      // Check permission to edit tasks
      await checkTaskPermission('task.edit', currentTask.project_id, id)

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

      // Log specific activities based on what was updated
      try {
        // Assignment change
        if (updates.assignee_id !== undefined && updates.assignee_id !== currentTask.assignee_id) {
          const action = updates.assignee_id ? 'assigned' : 'unassigned'
          await collaborationService.logActivity({
            user_id: user.id,
            project_id: currentTask.project_id,
            entity_type: 'task',
            entity_id: id,
            action,
            details: {
              task_title: data.title,
              assigned_to: updates.assignee_id,
              previous_assignee: currentTask.assignee_id
            }
          })
        }

        // Status change
        if (updates.status && updates.status !== currentTask.status) {
          const action = updates.status === 'done' ? 'completed' : 
                        updates.status === 'in_progress' && currentTask.status === 'done' ? 'reopened' :
                        'status_changed'
          await collaborationService.logActivity({
            user_id: user.id,
            project_id: currentTask.project_id,
            entity_type: 'task',
            entity_id: id,
            action,
            details: {
              task_title: data.title,
              new_status: updates.status,
              previous_status: currentTask.status
            }
          })
        }

        // Due date change
        if (updates.due_date !== undefined && updates.due_date !== currentTask.due_date) {
          await collaborationService.logActivity({
            user_id: user.id,
            project_id: currentTask.project_id,
            entity_type: 'task',
            entity_id: id,
            action: 'due_date_changed',
            details: {
              task_title: data.title,
              new_due_date: updates.due_date,
              previous_due_date: currentTask.due_date
            }
          })
        }

        // General update if no specific actions were logged
        if (!updates.assignee_id && !updates.status && !updates.due_date) {
          await collaborationService.logActivity({
            user_id: user.id,
            project_id: currentTask.project_id,
            entity_type: 'task',
            entity_id: id,
            action: 'updated',
            details: {
              task_title: data.title,
              updated_fields: Object.keys(updates)
            }
          })
        }
      } catch (logError) {
        console.warn('Failed to log task update activity:', logError)
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
      const user = await getCurrentUser()
      if (!user) {
        throw new TaskPermissionError('Must be authenticated to delete tasks')
      }

      // First get the task data for activity logging and permission check
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('project_id, title')
        .eq('id', id)
        .single()

      if (taskError) {
        if (taskError.code === 'PGRST116') {
          throw new TaskError('Task not found', 'NOT_FOUND')
        }
        throw new TaskError(taskError.message, taskError.code)
      }

      // Check permission to delete tasks
      await checkTaskPermission('task.delete', taskData.project_id, id)

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

      // Log activity for task deletion
      try {
        await collaborationService.logActivity({
          user_id: user.id,
          project_id: taskData.project_id,
          entity_type: 'task',
          entity_id: id,
          action: 'deleted',
          details: {
            task_title: taskData.title
          }
        })
      } catch (logError) {
        console.warn('Failed to log task deletion activity:', logError)
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
      // Check permission to view tasks
      await checkTaskPermission('task.view', projectId)

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
   * Search tasks across all projects (global search)
   */
  async searchTasksGlobal(query: string): Promise<ApiResponse<Task[]>> {
    try {
      const user = await getCurrentUser()
      if (!user) {
        throw new TaskPermissionError('Must be authenticated to search tasks')
      }

      // Search tasks across all projects the user has access to
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          projects!inner(
            id,
            title,
            project_members!inner(user_id)
          )
        `)
        .eq('projects.project_members.user_id', user.id)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .order('updated_at', { ascending: false })
        .limit(50) // Limit to prevent too many results

      if (error) {
        throw new TaskError(error.message, error.code)
      }

      return {
        data: data || [],
        error: null,
        success: true
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to search tasks globally'
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
      // Validate input
      if (!updates || updates.length === 0) {
        throw new TaskError('No updates provided', 'INVALID_INPUT')
      }

      // Validate each update
      for (const update of updates) {
        if (!update.id || typeof update.order_index !== 'number') {
          throw new TaskError('Invalid update data: missing id or order_index', 'INVALID_INPUT')
        }
      }

      // Use retry mechanism for network resilience
      await retryOperation(async () => {
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
      })

      return {
        data: true,
        error: null,
        success: true
      }
    } catch (error) {
      const message = handleTaskError(error, 'taskService', 'batch update task orders')
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