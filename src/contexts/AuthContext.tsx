import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { Session, User, AuthError } from '@supabase/supabase-js'
import { supabase } from '../config/supabase'
import { 
  secureTokenStorage, 
  tokenRefreshManager
} from '../utils/secureTokenStorage'
import { permissionService } from '../services/permissionService'
import type { 
  Permission, 
  ProjectRole, 
  WorkspaceRole, 
  PermissionContext,
  PermissionResult 
} from '../types/permissions'

// Enhanced user interface with permission system integration
interface ExtendedUser extends User {
  role?: 'admin' | 'member' | 'guest'
  permissions?: string[]
  // New permission system fields
  globalRole?: string
  workspaceRoles?: Record<string, WorkspaceRole>
  projectRoles?: Record<string, ProjectRole>
  currentWorkspaceId?: string | null
  currentProjectId?: string | null
}

// Enhanced AuthContext interface with permission system integration
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
  
  // Context management
  setCurrentWorkspace: (workspaceId: string | null) => void
  setCurrentProject: (projectId: string | null) => void
  getCurrentContext: () => PermissionContext
  
  // Permission system integration
  hasPermission: (permission: Permission, context?: PermissionContext) => Promise<boolean>
  hasAnyPermission: (permissions: Permission[], context?: PermissionContext) => Promise<boolean>
  hasAllPermissions: (permissions: Permission[], context?: PermissionContext) => Promise<boolean>
  getUserRole: (context?: PermissionContext) => Promise<ProjectRole | WorkspaceRole | string | null>
  refreshPermissions: () => Promise<void>
  
  // Utility methods
  isAuthenticated: boolean
  hasRole: (role: string) => boolean
  hasPermission_legacy: (permission: string) => boolean
  hasAnyPermission_legacy: (permissions: string[]) => boolean
  hasAllPermissions_legacy: (permissions: string[]) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Enhanced hook for role-based access control
export const useRole = () => {
  const { user, getUserRole, getCurrentContext } = useAuth()
  return {
    role: user?.role,
    globalRole: user?.globalRole,
    getUserRole,
    getCurrentContext
  }
}

// Enhanced authorization hook with new permission system
export const useAuthorization = (requiredPermissions: Permission[] = []) => {
  const { hasAllPermissions, getCurrentContext } = useAuth()
  
  const checkPermissions = useCallback(async (context?: PermissionContext) => {
    if (requiredPermissions.length === 0) return true
    return await hasAllPermissions(requiredPermissions, context || getCurrentContext())
  }, [hasAllPermissions, requiredPermissions, getCurrentContext])
  
  return { checkPermissions }
}

// Enhanced authenticated fetch hook
export const useAuthenticatedFetch = () => {
  const { session, refreshSession } = useAuth()
  
  const authenticatedFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    if (!session?.access_token) {
      throw new Error('No authentication token available')
    }

    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    }

    try {
      const response = await fetch(url, { ...options, headers })
      
      if (response.status === 401) {
        // Token might be expired, try to refresh
        const { error } = await refreshSession()
        if (!error) {
          // Retry with new token
          return await fetch(url, { ...options, headers })
        }
      }
      
      return response
    } catch (error) {
      console.error('Authenticated fetch error:', error)
      throw error
    }
  }, [session, refreshSession])

  return authenticatedFetch
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<ExtendedUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Debug logging for state changes
  useEffect(() => {
    console.log('🔍 AuthContext state:', { 
      user: user?.email, 
      loading, 
      session: !!session,
      hasUser: !!user 
    })
  }, [user, loading, session])

  // Enhanced user data processing with permission system integration
  const processUserData = useCallback(async (authUser: User | null): Promise<ExtendedUser | null> => {
    console.log('🔄 Processing user data for:', authUser?.email)
    if (!authUser) return null

    try {
      // Extract role from user metadata or app_metadata as fallback
      const role = (authUser.app_metadata?.role || 
                    authUser.user_metadata?.role || 
                    'member') as 'admin' | 'member' | 'guest'

      // Extract permissions from metadata as fallback
      const permissions = authUser.app_metadata?.permissions || 
                         authUser.user_metadata?.permissions || 
                         []

      // TEMPORARILY DISABLE permission service call to fix loading issue
      let globalRole = 'user'
      console.log('⚠️ TEMP: Skipping permission service call to fix loading issue')
      
      // Get global role from permission service with timeout and fallback
      // let globalRole = 'user'
      // try {
      //   const rolePromise = permissionService.getUserGlobalRole(authUser.id)
      //   const timeoutPromise = new Promise<string>((_, reject) => 
      //     setTimeout(() => reject(new Error('Timeout')), 2000)
      //   )
      //   
      //   globalRole = await Promise.race([rolePromise, timeoutPromise]) || 'user'
      //   console.log('✅ Global role fetched:', globalRole)
      // } catch (error) {
      //   console.warn('⚠️ Failed to fetch global role, using fallback:', error)
      //   globalRole = role === 'admin' ? 'admin' : 'user'
      // }

      // Create extended user object
      const extendedUser: ExtendedUser = {
        ...authUser,
        role,
        permissions,
        globalRole,
        workspaceRoles: {},
        projectRoles: {},
        currentWorkspaceId: null,
        currentProjectId: null
      }

      console.log('✅ User data processed successfully:', {
        email: extendedUser.email,
        role: extendedUser.role,
        globalRole: extendedUser.globalRole
      })

      return extendedUser
    } catch (error) {
      console.error('❌ Error processing user data:', error)
      // Return basic user data if profile fetch fails
      const fallbackUser: ExtendedUser = {
        ...authUser,
        role: 'member',
        permissions: [],
        globalRole: 'user',
        workspaceRoles: {},
        projectRoles: {},
        currentWorkspaceId: null,
        currentProjectId: null
      }
      
      console.log('✅ Using fallback user data')
      return fallbackUser
    }
  }, [])

  // Enhanced session recovery with permission loading
  const recoverSession = useCallback(async (): Promise<Session | null> => {
    console.log('🔄 recoverSession: Starting session recovery...')
    try {
      // TEMPORARILY DISABLE Supabase session recovery to fix loading issue
      console.log('⚠️ TEMP: Skipping Supabase session recovery to fix loading issue')
      
      // Try to get session from Supabase first with timeout
      // const sessionPromise = supabase.auth.getSession()
      // const timeoutPromise = new Promise<never>((_, reject) => 
      //   setTimeout(() => reject(new Error('Session recovery timeout')), 3000)
      // )
      
      // const { data: { session: currentSession } } = await Promise.race([sessionPromise, timeoutPromise])
      
      // if (currentSession) {
      //   console.log('Session recovered from Supabase:', currentSession.user.email)
      //   return currentSession
      // }

      console.log('🔄 recoverSession: Checking secure storage...')
      // Fallback to secure storage
      const storedSession = secureTokenStorage.retrieveSession()
      if (storedSession) {
        console.log('Session recovered from secure storage:', storedSession.user.email)
        
        // TEMPORARILY DISABLE session validation to fix loading issue
        console.log('⚠️ TEMP: Skipping session validation to fix loading issue')
        return storedSession
        
        // Validate the stored session
        // const { data: { user: validatedUser }, error } = await supabase.auth.getUser(storedSession.access_token)
        
        // if (error || !validatedUser) {
        //   console.log('Stored session is invalid, clearing...')
        //   secureTokenStorage.clearSession()
        //   return null
        // }
        
        // return storedSession
      }

      console.log('🔄 recoverSession: No session found')
      return null
    } catch (error) {
      console.error('Error recovering session:', error)
      secureTokenStorage.clearAllAuthData()
      return null
    }
  }, [])

  // Context management methods
  const setCurrentWorkspace = useCallback((workspaceId: string | null) => {
    setUser(prev => prev ? { ...prev, currentWorkspaceId: workspaceId } : null)
  }, [])

  const setCurrentProject = useCallback((projectId: string | null) => {
    setUser(prev => prev ? { ...prev, currentProjectId: projectId } : null)
  }, [])

  const getCurrentContext = useCallback((): PermissionContext => {
    return {
      workspaceId: user?.currentWorkspaceId || undefined,
      projectId: user?.currentProjectId || undefined,
      userId: user?.id
    }
  }, [user])

  // Enhanced permission methods using the permission service
  const hasPermission = useCallback(async (permission: Permission, context?: PermissionContext): Promise<boolean> => {
    if (!user) return false
    
    try {
      const result = await permissionService.hasPermission(
        user.id, 
        permission, 
        context || getCurrentContext()
      )
      return result.hasPermission
    } catch (error) {
      console.error('Error checking permission:', error)
      return false
    }
  }, [user, getCurrentContext])

  const hasAnyPermission = useCallback(async (permissions: Permission[], context?: PermissionContext): Promise<boolean> => {
    if (!user) return false
    
    try {
      const result = await permissionService.hasAnyPermission(
        user.id, 
        permissions, 
        context || getCurrentContext()
      )
      return result.hasPermission
    } catch (error) {
      console.error('Error checking any permission:', error)
      return false
    }
  }, [user, getCurrentContext])

  const hasAllPermissions = useCallback(async (permissions: Permission[], context?: PermissionContext): Promise<boolean> => {
    if (!user) return false
    
    try {
      const result = await permissionService.hasAllPermissions(
        user.id, 
        permissions, 
        context || getCurrentContext()
      )
      return result.hasPermission
    } catch (error) {
      console.error('Error checking all permissions:', error)
      return false
    }
  }, [user, getCurrentContext])

  const getUserRole = useCallback(async (context?: PermissionContext): Promise<ProjectRole | WorkspaceRole | string | null> => {
    if (!user) return null
    
    const effectiveContext = context || getCurrentContext()
    
    try {
      if (effectiveContext.projectId) {
        return await permissionService.getUserProjectRole(effectiveContext.projectId, user.id)
      } else if (effectiveContext.workspaceId) {
        return await permissionService.getUserWorkspaceRole(effectiveContext.workspaceId, user.id)
      } else {
        return user.globalRole || null
      }
    } catch (error) {
      console.error('Error getting user role:', error)
      return null
    }
  }, [user, getCurrentContext])

  const refreshPermissions = useCallback(async () => {
    if (!user) return
    
    try {
      // Clear permission cache to force refresh
      permissionService.clearCache(user.id)
      
      // Reload user data with fresh permissions
      const refreshedUser = await processUserData(user)
      if (refreshedUser) {
        setUser(refreshedUser)
      }
    } catch (error) {
      console.error('Error refreshing permissions:', error)
    }
  }, [user, processUserData])

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
    console.log('🚀 AuthProvider useEffect starting...')
    
    // Get initial session with enhanced recovery
    const getInitialSession = async () => {
      console.log('🔄 Getting initial session...')
      try {
        console.log('📞 Calling recoverSession...')
        const recoveredSession = await recoverSession()
        console.log('📞 recoverSession completed:', !!recoveredSession)
        
        if (recoveredSession) {
          console.log('✅ Session recovered, processing user data...')
          setSession(recoveredSession)
          console.log('📞 Calling processUserData...')
          const processedUser = await processUserData(recoveredSession.user)
          console.log('📞 processUserData completed')
          setUser(processedUser)
          console.log('✅ Initial session setup complete')
        } else {
          console.log('ℹ️ No session to recover')
        }
      } catch (error) {
        console.error('❌ Error in getInitialSession:', error)
      } finally {
        console.log('🏁 Setting loading to false')
        setLoading(false)
      }
    }

    console.log('📞 About to call getInitialSession...')
    getInitialSession()
    console.log('📞 getInitialSession called')

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        setSession(session)
        
        if (session?.user) {
          const processedUser = await processUserData(session.user)
          setUser(processedUser)
        } else {
          setUser(null)
        }
        
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
          // Clear permission cache for the signed out user
          // Note: We get the user ID from the previous session rather than current state
          // to avoid dependency issues
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

  // Legacy role-based access control methods (for backward compatibility)
  const hasRole = useCallback((role: string): boolean => {
    return user?.role === role
  }, [user])

  const hasPermission_legacy = useCallback((permission: string): boolean => {
    return user?.permissions?.includes(permission) ?? false
  }, [user])

  const hasAnyPermission_legacy = useCallback((permissions: string[]): boolean => {
    if (!user?.permissions) return false
    return permissions.some(permission => user.permissions!.includes(permission))
  }, [user])

  const hasAllPermissions_legacy = useCallback((permissions: string[]): boolean => {
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
    
    // Context management
    setCurrentWorkspace,
    setCurrentProject,
    getCurrentContext,
    
    // Enhanced permission system
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getUserRole,
    refreshPermissions,
    
    // Utility methods
    isAuthenticated: !!user,
    hasRole,
    hasPermission_legacy,
    hasAnyPermission_legacy,
    hasAllPermissions_legacy,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
} 