import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { Session, User, AuthError } from '@supabase/supabase-js'
import { supabase } from '../config/supabase'
import { 
  secureTokenStorage, 
  tokenRefreshManager
} from '../utils/secureTokenStorage'

// Extended user interface to include role information
interface ExtendedUser extends User {
  role?: 'admin' | 'member' | 'guest'
  permissions?: string[]
}

interface AuthContextType {
  // Authentication state
  session: Session | null
  user: ExtendedUser | null
  loading: boolean
  
  // Authentication methods
  signIn: (email: string, password: string) => Promise<{ error?: AuthError }>
  signUp: (email: string, password: string) => Promise<{ error?: AuthError }>
  signOut: () => Promise<{ error?: AuthError }>
  resetPassword: (email: string) => Promise<{ error?: AuthError }>
  refreshSession: () => Promise<{ error?: AuthError }>
  
  // Utility methods
  isAuthenticated: boolean
  hasRole: (role: string) => boolean
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  hasAllPermissions: (permissions: string[]) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Custom hook for role-based access
export const useRole = () => {
  const { user } = useAuth()
  return user?.role || 'guest'
}

// Custom hook for authorization checks
export const useAuthorization = (requiredPermissions: string[] = []) => {
  const { user, hasAllPermissions } = useAuth()
  
  if (requiredPermissions.length === 0) return true
  return user ? hasAllPermissions(requiredPermissions) : false
}

// Custom hook for authenticated API calls
export const useAuthenticatedFetch = () => {
  const { session } = useAuth()
  
  return useCallback(async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers)
    
    if (session?.access_token) {
      headers.set('Authorization', `Bearer ${session.access_token}`)
    }
    
    return fetch(url, { 
      ...options, 
      headers 
    })
  }, [session])
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<ExtendedUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Enhanced session recovery with secure token storage
  const recoverSession = useCallback(async () => {
    try {
      // First try to get session from Supabase
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error getting session from Supabase:', error)
        // Try to recover from secure storage as fallback
        const storedSession = secureTokenStorage.retrieveSession()
        if (storedSession) {
          try {
            const { data, error: setError } = await supabase.auth.setSession(storedSession)
            if (setError) {
              console.error('Error setting stored session:', setError)
              secureTokenStorage.clearSession()
            } else if (data.session) {
              console.log('✅ Session recovered from secure storage')
              return data.session
            }
          } catch (setError) {
            console.error('Error setting stored session:', setError)
            secureTokenStorage.clearSession()
          }
        }
      } else {
        return session
      }
    } catch (error) {
      console.error('Error in session recovery:', error)
    }
    return null
  }, [])

  // Enhanced user data processing with role extraction
  const processUserData = useCallback((supabaseUser: User | null): ExtendedUser | null => {
    if (!supabaseUser) return null

    // Extract role from user metadata or app_metadata
    const role = (supabaseUser.app_metadata?.role || 
                  supabaseUser.user_metadata?.role || 
                  'member') as 'admin' | 'member' | 'guest'

    // Extract permissions from metadata
    const permissions = supabaseUser.app_metadata?.permissions || 
                       supabaseUser.user_metadata?.permissions || 
                       []

    return {
      ...supabaseUser,
      role,
      permissions
    }
  }, [])

  // Enhanced automatic token refresh with smart scheduling
  useEffect(() => {
    if (session) {
      // Use the advanced token refresh manager
      tokenRefreshManager.scheduleRefresh(session, async () => {
        const { error } = await supabase.auth.refreshSession()
        if (error) {
          throw new Error(`Token refresh failed: ${error.message}`)
        }
      })
    } else {
      // Clear any existing refresh timers when no session
      tokenRefreshManager.clearRefreshTimer()
    }

    return () => {
      tokenRefreshManager.clearRefreshTimer()
    }
  }, [session])

  useEffect(() => {
    // Get initial session with enhanced recovery
    const getInitialSession = async () => {
      try {
        const recoveredSession = await recoverSession()
        if (recoveredSession) {
          setSession(recoveredSession)
          setUser(processUserData(recoveredSession.user))
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        setSession(session)
        setUser(processUserData(session?.user ?? null))
        setLoading(false)

        // Handle specific auth events with secure storage
        if (event === 'SIGNED_IN') {
          console.log('User signed in:', session?.user?.email)
          // Store session securely for recovery
          if (session) {
            secureTokenStorage.storeSession(session)
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out')
          secureTokenStorage.clearAllAuthData()
          tokenRefreshManager.clearRefreshTimer()
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('Token refreshed for user:', session?.user?.email)
          // Update stored session securely
          if (session) {
            secureTokenStorage.storeSession(session)
          }
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [recoverSession, processUserData])

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Sign in error:', error)
        return { error }
      }

      console.log('Sign in successful:', data.user?.email)
      return { error: undefined }
    } catch (error) {
      console.error('Unexpected error during sign in:', error)
      return { error: error as AuthError }
    } finally {
      setLoading(false)
    }
  }

  // Sign up with email and password
  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        console.error('Sign up error:', error)
        return { error }
      }

      console.log('Sign up successful:', data.user?.email)
      return { error: undefined }
    } catch (error) {
      console.error('Unexpected error during sign up:', error)
      return { error: error as AuthError }
    } finally {
      setLoading(false)
    }
  }

  // Sign out
  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('Sign out error:', error)
        return { error }
      }

      console.log('Sign out successful')
      return { error: undefined }
    } catch (error) {
      console.error('Unexpected error during sign out:', error)
      return { error: error as AuthError }
    } finally {
      setLoading(false)
    }
  }

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        console.error('Password reset error:', error)
        return { error }
      }

      console.log('Password reset email sent to:', email)
      return { error: undefined }
    } catch (error) {
      console.error('Unexpected error during password reset:', error)
      return { error: error as AuthError }
    }
  }

  // Manual session refresh
  const refreshSession = async () => {
    try {
      const { error } = await supabase.auth.refreshSession()
      
      if (error) {
        console.error('Session refresh error:', error)
        return { error }
      }

      console.log('Session refreshed successfully')
      return { error: undefined }
    } catch (error) {
      console.error('Unexpected error during session refresh:', error)
      return { error: error as AuthError }
    }
  }

  // Role-based access control methods
  const hasRole = useCallback((role: string): boolean => {
    return user?.role === role
  }, [user])

  const hasPermission = useCallback((permission: string): boolean => {
    return user?.permissions?.includes(permission) ?? false
  }, [user])

  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    if (!user?.permissions) return false
    return permissions.some(permission => user.permissions!.includes(permission))
  }, [user])

  const hasAllPermissions = useCallback((permissions: string[]): boolean => {
    if (!user?.permissions) return false
    return permissions.every(permission => user.permissions!.includes(permission))
  }, [user])

  const value: AuthContextType = {
    session,
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    refreshSession,
    isAuthenticated: !!user,
    hasRole,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
} 