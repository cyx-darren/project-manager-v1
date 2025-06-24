import type { PostgrestError } from '@supabase/supabase-js'

/**
 * Task-specific error types
 */
export class TaskValidationError extends Error {
  public field?: string
  
  constructor(message: string, field?: string) {
    super(message)
    this.name = 'TaskValidationError'
    this.field = field
  }
}

export class TaskNetworkError extends Error {
  public code?: string
  
  constructor(message: string = 'Network connection failed', code?: string) {
    super(message)
    this.name = 'TaskNetworkError'
    this.code = code
  }
}

export class TaskRateLimitError extends Error {
  public retryAfter?: number
  
  constructor(message: string = 'Too many requests', retryAfter?: number) {
    super(message)
    this.name = 'TaskRateLimitError'
    this.retryAfter = retryAfter
  }
}

/**
 * Maps task-related error codes to user-friendly messages
 */
export const getTaskErrorMessage = (error: PostgrestError | Error): string => {
  // Handle Supabase/PostgreSQL errors
  if ('code' in error && error.code) {
    switch (error.code) {
      case 'PGRST116':
        return 'Task not found. It may have been deleted by another user.'
      
      case 'PGRST301':
        return 'You do not have permission to perform this action.'
      
      case '23505':
        return 'A task with this information already exists.'
      
      case '23503':
        return 'Cannot complete this action due to related data dependencies.'
      
      case '23514':
        return 'Invalid data provided. Please check your input.'
      
      case 'PGRST204':
        return 'No tasks found matching your criteria.'
      
      case 'PGRST103':
        return 'Request too large. Please reduce the amount of data.'
      
      case 'PGRST102':
        return 'Too many requests. Please wait a moment and try again.'
      
      default:
        break
    }
  }

  // Handle specific error messages
  switch (error.message) {
    case 'Failed to fetch':
    case 'NetworkError':
      return 'Connection failed. Please check your internet connection and try again.'
    
    case 'AbortError':
      return 'Request timed out. Please try again.'
    
    case 'TypeError: Failed to fetch':
      return 'Unable to connect to the server. Please try again later.'
    
    default:
      break
  }

  // Handle custom error types
  if (error instanceof TaskValidationError) {
    return error.field ? `${error.field}: ${error.message}` : error.message
  }

  if (error instanceof TaskNetworkError) {
    return error.message
  }

  if (error instanceof TaskRateLimitError) {
    const retryMessage = error.retryAfter 
      ? ` Please wait ${error.retryAfter} seconds before trying again.`
      : ' Please wait a moment before trying again.'
    return error.message + retryMessage
  }

  // Fallback to original message or generic error
  return error.message || 'An unexpected error occurred while processing your task.'
}

/**
 * Enhanced task error handler with context and logging
 */
export const handleTaskError = (
  error: unknown, 
  context?: string,
  operation?: string
): string => {
  // Log the error for debugging (in development)
  if (import.meta.env.DEV) {
    console.error(`Task error${context ? ` in ${context}` : ''}${operation ? ` during ${operation}` : ''}:`, {
      error,
      context,
      operation,
      timestamp: new Date().toISOString()
    })
  }

  // Handle different error types
  if (error instanceof Error) {
    return getTaskErrorMessage(error)
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error
  }

  // Handle network errors
  if (error && typeof error === 'object' && 'name' in error) {
    if (error.name === 'TypeError' || error.name === 'NetworkError') {
      return 'Connection failed. Please check your internet connection and try again.'
    }
  }

  // Generic fallback
  return 'An unexpected error occurred. Please try again.'
}

/**
 * Validation helper for task data
 */
export const validateTaskData = (data: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  // Title validation
  if (!data.title || typeof data.title !== 'string') {
    errors.push('Task title is required')
  } else if (data.title.trim().length < 3) {
    errors.push('Task title must be at least 3 characters')
  } else if (data.title.length > 200) {
    errors.push('Task title must not exceed 200 characters')
  }

  // Description validation
  if (data.description && typeof data.description === 'string' && data.description.length > 1000) {
    errors.push('Description must not exceed 1000 characters')
  }

  // Priority validation
  if (data.priority && !['low', 'medium', 'high', 'urgent'].includes(data.priority)) {
    errors.push('Invalid priority level')
  }

  // Status validation
  if (data.status && !['todo', 'in_progress', 'done'].includes(data.status)) {
    errors.push('Invalid status')
  }

  // Due date validation
  if (data.due_date && data.due_date !== null) {
    const dueDate = new Date(data.due_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (isNaN(dueDate.getTime())) {
      errors.push('Invalid due date format')
    } else if (dueDate < today) {
      errors.push('Due date cannot be in the past')
    }
  }

  // Estimated hours validation
  if (data.estimated_hours !== null && data.estimated_hours !== undefined) {
    const hours = Number(data.estimated_hours)
    if (isNaN(hours) || hours < 0) {
      errors.push('Estimated hours must be a positive number')
    } else if (hours > 1000) {
      errors.push('Estimated hours cannot exceed 1000')
    }
  }

  // Assignee ID validation (basic UUID format check)
  if (data.assignee_id && data.assignee_id !== null) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(data.assignee_id)) {
      errors.push('Invalid assignee ID')
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Retry helper for failed operations
 */
export const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: unknown

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      // Don't retry on validation errors or permission errors
      if (error instanceof TaskValidationError || 
          (error instanceof Error && error.message.includes('permission'))) {
        throw error
      }

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break
      }

      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, delay * attempt))
    }
  }

  throw lastError
}

/**
 * Batch operation error handler
 */
export const handleBatchErrors = (
  results: Array<{ success: boolean; error?: string; id?: string }>,
  operation: string
): { successCount: number; errorCount: number; errors: string[] } => {
  const successCount = results.filter(r => r.success).length
  const errorCount = results.filter(r => !r.success).length
  const errors = results
    .filter(r => !r.success)
    .map(r => r.error || 'Unknown error')
    .filter((error, index, arr) => arr.indexOf(error) === index) // Remove duplicates

  return {
    successCount,
    errorCount,
    errors
  }
}

/**
 * Type guard to check if an error is a PostgrestError
 */
export const isPostgrestError = (error: unknown): error is PostgrestError => {
  return typeof error === 'object' && 
         error !== null && 
         'code' in error && 
         'message' in error
} 