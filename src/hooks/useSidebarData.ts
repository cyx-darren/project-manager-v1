import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { sidebarService, type SidebarProject, type SidebarStats, type UserTaskCounts } from '../services/sidebarService'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface UseSidebarDataReturn {
  // Data
  projects: SidebarProject[]
  stats: SidebarStats | null
  taskCounts: UserTaskCounts | null
  recentProjects: SidebarProject[]
  
  // Loading states
  loading: {
    projects: boolean
    stats: boolean
    taskCounts: boolean
    recentProjects: boolean
    initial: boolean
  }
  
  // Error states
  error: {
    projects: string | null
    stats: string | null
    taskCounts: string | null
    recentProjects: string | null
  }
  
  // Actions
  refresh: () => Promise<void>
  refreshProjects: () => Promise<void>
  refreshStats: () => Promise<void>
  searchProjects: (query: string) => Promise<SidebarProject[]>
  
  // Real-time status
  isConnected: boolean
}

export const useSidebarData = (): UseSidebarDataReturn => {
  const { user } = useAuth()
  const subscriptionRef = useRef<RealtimeChannel | null>(null)
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Data state
  const [projects, setProjects] = useState<SidebarProject[]>([])
  const [stats, setStats] = useState<SidebarStats | null>(null)
  const [taskCounts, setTaskCounts] = useState<UserTaskCounts | null>(null)
  const [recentProjects, setRecentProjects] = useState<SidebarProject[]>([])
  
  // Loading state
  const [loading, setLoading] = useState({
    projects: false,
    stats: false,
    taskCounts: false,
    recentProjects: false,
    initial: true
  })
  
  // Error state
  const [error, setError] = useState({
    projects: null as string | null,
    stats: null as string | null,
    taskCounts: null as string | null,
    recentProjects: null as string | null
  })
  
  // Real-time connection state
  const [isConnected, setIsConnected] = useState(false)
  
  // Fetch projects with stats
  const fetchProjects = useCallback(async () => {
    if (!user?.id) return
    
    setLoading(prev => ({ ...prev, projects: true }))
    setError(prev => ({ ...prev, projects: null }))
    
    try {
      const { data, error: fetchError } = await sidebarService.getUserProjectsWithStats(user.id)
      
      if (fetchError) {
        throw new Error(fetchError.message || 'Failed to fetch projects')
      }
      
      setProjects(data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(prev => ({ ...prev, projects: errorMessage }))
      console.error('Error fetching projects:', err)
    } finally {
      setLoading(prev => ({ ...prev, projects: false }))
    }
  }, [user?.id])
  
  // Fetch sidebar stats
  const fetchStats = useCallback(async () => {
    if (!user?.id) return
    
    setLoading(prev => ({ ...prev, stats: true }))
    setError(prev => ({ ...prev, stats: null }))
    
    try {
      const { data, error: fetchError } = await sidebarService.getSidebarStats(user.id)
      
      if (fetchError) {
        throw new Error(fetchError.message || 'Failed to fetch stats')
      }
      
      setStats(data)
      setTaskCounts(data?.tasks || null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(prev => ({ ...prev, stats: errorMessage }))
      console.error('Error fetching stats:', err)
    } finally {
      setLoading(prev => ({ ...prev, stats: false }))
    }
  }, [user?.id])
  
  // Fetch recent projects
  const fetchRecentProjects = useCallback(async () => {
    if (!user?.id) return
    
    setLoading(prev => ({ ...prev, recentProjects: true }))
    setError(prev => ({ ...prev, recentProjects: null }))
    
    try {
      const { data, error: fetchError } = await sidebarService.getRecentProjects(user.id, 3)
      
      if (fetchError) {
        throw new Error(fetchError.message || 'Failed to fetch recent projects')
      }
      
      setRecentProjects(data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(prev => ({ ...prev, recentProjects: errorMessage }))
      console.error('Error fetching recent projects:', err)
    } finally {
      setLoading(prev => ({ ...prev, recentProjects: false }))
    }
  }, [user?.id])
  
  // Search projects
  const searchProjects = useCallback(async (query: string): Promise<SidebarProject[]> => {
    if (!user?.id) return []
    
    try {
      const { data, error: searchError } = await sidebarService.searchProjects(user.id, query)
      
      if (searchError) {
        throw new Error(searchError.message || 'Failed to search projects')
      }
      
      return data || []
    } catch (err) {
      console.error('Error searching projects:', err)
      return []
    }
  }, [user?.id])
  
  // Debounced refresh function to prevent multiple rapid calls
  const debouncedRefresh = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
    }
    
    refreshTimeoutRef.current = setTimeout(async () => {
      await Promise.all([
        fetchProjects(),
        fetchStats(),
        fetchRecentProjects()
      ])
    }, 1000) // 1 second debounce
  }, [fetchProjects, fetchStats, fetchRecentProjects])
  
  // Refresh all data
  const refresh = useCallback(async () => {
    await Promise.all([
      fetchProjects(),
      fetchStats(),
      fetchRecentProjects()
    ])
  }, [fetchProjects, fetchStats, fetchRecentProjects])
  
  // Setup real-time subscriptions
  useEffect(() => {
    if (!user?.id) {
      setIsConnected(false)
      return
    }
    
    // Clean up existing subscription
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe()
      subscriptionRef.current = null
    }
    
    try {
      // Create new subscription with error handling
      const subscription = sidebarService.subscribeToProjectUpdates(
        user.id,
        (payload) => {
          console.log('Real-time update received:', payload)
          
          // Use debounced refresh to prevent multiple rapid calls
          debouncedRefresh()
          setIsConnected(true)
        }
      )
      
      subscriptionRef.current = subscription
      
      // Set connection status after a short delay
      setTimeout(() => setIsConnected(true), 1000)
    } catch (err) {
      console.error('Failed to setup real-time subscription:', err)
      setIsConnected(false)
    }
    
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
        subscriptionRef.current = null
      }
      setIsConnected(false)
    }
  }, [user?.id, debouncedRefresh]) // Remove refresh from dependencies to prevent circular dependency
  
  // Initial data fetch
  useEffect(() => {
    if (!user?.id) {
      setLoading(prev => ({ ...prev, initial: false }))
      return
    }
    
    const loadInitialData = async () => {
      setLoading(prev => ({ ...prev, initial: true }))
      
      await Promise.all([
        fetchProjects(),
        fetchStats(),
        fetchRecentProjects()
      ])
      
      setLoading(prev => ({ ...prev, initial: false }))
    }
    
    loadInitialData()
  }, [user?.id, fetchProjects, fetchStats, fetchRecentProjects])
  
  return {
    // Data
    projects,
    stats,
    taskCounts,
    recentProjects,
    
    // Loading states
    loading,
    
    // Error states
    error,
    
    // Actions
    refresh,
    refreshProjects: fetchProjects,
    refreshStats: fetchStats,
    searchProjects,
    
    // Real-time status
    isConnected
  }
}

export default useSidebarData 