import type { AuthError } from '@supabase/supabase-js'

/**
 * Maps Supabase auth error codes to user-friendly messages
 */
export const getAuthErrorMessage = (error: AuthError): string => {
  // Handle specific error codes from Supabase
  switch (error.message) {
    case 'Invalid login credentials':
      return 'Invalid email or password. Please check your credentials and try again.'
    
    case 'User already registered':
      return 'An account with this email already exists. Please sign in instead.'
    
    case 'Email not confirmed':
      return 'Please check your email and click the confirmation link before signing in.'
    
    case 'Signup disabled':
      return 'New account registration is currently disabled. Please contact support.'
    
    case 'Invalid email':
      return 'Please enter a valid email address.'
    
    case 'Password should be at least 6 characters':
      return 'Password must be at least 6 characters long.'
    
    case 'Email rate limit exceeded':
      return 'Too many email requests. Please wait a moment before trying again.'
    
    case 'Too many requests':
      return 'Too many login attempts. Please wait a few minutes before trying again.'
    
    default:
      break
  }

  // Handle by status code if available
  if (error.status) {
    switch (error.status) {
      case 400:
        return 'Invalid request. Please check your information and try again.'
      
      case 401:
        return 'Authentication failed. Please check your credentials.'
      
      case 403:
        return 'Access denied. Your account may be disabled.'
      
      case 422:
        return 'Invalid information provided. Please check your input.'
      
      case 429:
        return 'Too many requests. Please try again later.'
      
      case 500:
        return 'Server error. Please try again later.'
      
      default:
        break
    }
  }

  // Fallback to the original message or a generic one
  return error.message || 'An unexpected error occurred. Please try again.'
}

/**
 * Enhanced error handler that logs the error and returns a user-friendly message
 */
export const handleAuthError = (error: AuthError, context?: string): string => {
  // Log the error for debugging (in development)
  if (import.meta.env.DEV) {
    console.error(`Auth error${context ? ` in ${context}` : ''}:`, {
      message: error.message,
      status: error.status,
      error
    })
  }

  return getAuthErrorMessage(error)
}

/**
 * Type guard to check if an error is an AuthError
 */
export const isAuthError = (error: unknown): error is AuthError => {
  return typeof error === 'object' && 
         error !== null && 
         'message' in error
}

/**
 * Wrapper function for handling any auth-related error
 */
export const processAuthError = (error: unknown, context?: string): string => {
  if (isAuthError(error)) {
    return handleAuthError(error, context)
  }
  
  // Handle generic errors
  const message = error instanceof Error ? error.message : 'An unexpected error occurred'
  
  if (import.meta.env.DEV) {
    console.error(`Non-auth error${context ? ` in ${context}` : ''}:`, error)
  }
  
  return message
} 