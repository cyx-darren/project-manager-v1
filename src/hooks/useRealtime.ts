import { useEffect, useRef, useState, useCallback } from 'react';
import { realtimeService, type RealtimeEvent } from '../services/realtimeService';
import { supabase } from '../config/supabase';
import type { RealtimeChannel, RealtimeChannelSendResponse } from '@supabase/supabase-js';

export interface UseRealtimeOptions {
  projectId?: string;
  taskId?: string;
  enableTasks?: boolean;
  enableComments?: boolean;
  enableProjects?: boolean;
  enableActivity?: boolean;
}

export interface UseRealtimeReturn {
  isConnected: boolean;
  connectionStatus: string;
  lastEvent: RealtimeEvent | null;
  eventCount: number;
  subscribe: () => void;
  unsubscribe: () => void;
  reconnect: () => void;
}

// Production safety - disable real-time in production if causing issues
const isProduction = import.meta.env.NODE_ENV === 'production';
const REALTIME_ENABLED = import.meta.env.VITE_ENABLE_REAL_TIME !== 'false' && !isProduction;

/**
 * React hook for real-time functionality
 * Provides easy interface for components to subscribe to real-time updates
 */
export function useRealtime(options: UseRealtimeOptions = {}): UseRealtimeReturn {
  const {
    projectId,
    taskId,
    enableTasks = true,
    enableComments = true,
    enableProjects = true,
    enableActivity = true
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('CLOSED');
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const [eventCount, setEventCount] = useState(0);
  const subscriptionRef = useRef<string | null>(null);

  // Event handler for real-time events
  const handleRealtimeEvent = (event: RealtimeEvent) => {
    setLastEvent(event);
    setEventCount(prev => prev + 1);
    
    // Log event for debugging
    console.log('Real-time event received:', event);
  };

  // Subscribe to real-time updates
  const subscribe = () => {
    if (subscriptionRef.current) {
      console.warn('Already subscribed to real-time updates');
      return;
    }

    subscriptionRef.current = 'subscribed';

    // Subscribe to specific channels based on options
    if (projectId) {
      if (enableTasks || enableComments || enableProjects || enableActivity) {
        realtimeService.subscribeToProject(projectId, handleRealtimeEvent);
      }
    }

    if (taskId) {
      realtimeService.subscribeToTask(taskId, handleRealtimeEvent);
    }

    // Subscribe to global activity if no specific project
    if (!projectId && enableActivity) {
      realtimeService.subscribeToGlobalActivity(handleRealtimeEvent);
    }

    // Update connection status
    updateConnectionStatus();
  };

  // Unsubscribe from real-time updates
  const unsubscribe = () => {
    if (subscriptionRef.current) {
      subscriptionRef.current = null;
    }

    // Unsubscribe from specific channels
    if (projectId) {
      realtimeService.unsubscribeFromProject(projectId);
    }
    if (taskId) {
      realtimeService.unsubscribeFromTask(taskId);
    }
    if (!projectId && enableActivity) {
      realtimeService.unsubscribeFromGlobalActivity();
    }
    
    setIsConnected(false);
    setConnectionStatus('CLOSED');
  };

  // Reconnect to real-time updates
  const reconnect = () => {
    unsubscribe();
    setTimeout(() => {
      subscribe();
    }, 1000);
  };

  // Update connection status
  const updateConnectionStatus = () => {
    const status = realtimeService.getConnectionStatus();
    setConnectionStatus(status);
    setIsConnected(status === 'OPEN');
  };

  // Effect to monitor connection status
  useEffect(() => {
    const interval = setInterval(updateConnectionStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribe();
    };
  }, []);

  return {
    isConnected,
    connectionStatus,
    lastEvent,
    eventCount,
    subscribe,
    unsubscribe,
    reconnect
  };
}

/**
 * Hook specifically for project real-time updates
 */
export function useProjectRealtime(projectId: string) {
  return useRealtime({
    projectId,
    enableTasks: true,
    enableComments: true,
    enableProjects: true,
    enableActivity: true
  });
}

/**
 * Hook specifically for task real-time updates
 */
export function useTaskRealtime(taskId: string, projectId?: string) {
  return useRealtime({
    taskId,
    projectId,
    enableTasks: true,
    enableComments: true,
    enableProjects: false,
    enableActivity: false
  });
}

/**
 * Hook for global real-time updates (all projects)
 */
export function useGlobalRealtime() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const [eventCount, setEventCount] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Disable real-time in production to prevent localhost connection issues
  useEffect(() => {
    if (!REALTIME_ENABLED) {
      console.log('🔇 Real-time disabled in production environment');
      setConnectionStatus('disabled');
      return;
    }
  }, []);

  const subscribe = useCallback(() => {
    if (!REALTIME_ENABLED) {
      console.log('🔇 Real-time subscription skipped - disabled in production');
      return;
    }

    if (channelRef.current) {
      console.log('🔄 Unsubscribing from existing global channel');
      supabase.removeChannel(channelRef.current);
    }

    console.log('🔗 Subscribing to global real-time events');
    setConnectionStatus('connecting');

    try {
      const channel = supabase
        .channel('global-changes')
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public',
            table: 'projects'
          },
          (payload) => {
            console.log('📡 Global event received:', payload);
            const event: RealtimeEvent = {
              type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
              table: payload.table,
              record: payload.new,
              old_record: payload.old,
              timestamp: new Date()
            };
            setLastEvent(event);
            setEventCount(prev => prev + 1);
          }
        )
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public',
            table: 'project_members'
          },
          (payload) => {
            console.log('📡 Global membership event:', payload);
            const event: RealtimeEvent = {
              type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
              table: payload.table,
              record: payload.new,
              old_record: payload.old,
              timestamp: new Date()
            };
            setLastEvent(event);
            setEventCount(prev => prev + 1);
          }
        )
        .subscribe((status) => {
          console.log('🔄 Global realtime status:', status);
          setIsConnected(status === 'SUBSCRIBED');
          
          switch (status) {
            case 'SUBSCRIBED':
              setConnectionStatus('connected');
              break;
            case 'CHANNEL_ERROR':
            case 'TIMED_OUT':
            case 'CLOSED':
              setConnectionStatus('error');
              break;
            default:
              setConnectionStatus('connecting');
          }
        });

      channelRef.current = channel;
    } catch (error) {
      console.error('❌ Global real-time subscription failed:', error);
      setConnectionStatus('error');
    }
  }, []);

  const unsubscribe = useCallback(() => {
    if (channelRef.current) {
      console.log('🔌 Unsubscribing from global real-time');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      setIsConnected(false);
      setConnectionStatus('disconnected');
    }
  }, []);

  const reconnect = useCallback(() => {
    if (!REALTIME_ENABLED) return;
    
    console.log('🔄 Reconnecting global real-time...');
    unsubscribe();
    setTimeout(subscribe, 1000);
  }, [subscribe, unsubscribe]);

  const send = useCallback(async (payload: any): Promise<RealtimeChannelSendResponse> => {
    if (!channelRef.current || !REALTIME_ENABLED) {
      return { status: 'error', response: 'Channel not available or disabled' } as unknown as RealtimeChannelSendResponse;
    }

    return channelRef.current.send({
      type: 'broadcast',
      event: 'custom',
      payload
    });
  }, []);

  // Auto-cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  return {
    isConnected,
    connectionStatus,
    lastEvent,
    eventCount,
    subscribe,
    unsubscribe,
    reconnect,
    send
  };
}

/**
 * Hook specifically for project real-time updates
 */
export function useProjectRealtimeSupabase(projectId: string | null) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const [eventCount, setEventCount] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Disable real-time in production to prevent localhost connection issues
  useEffect(() => {
    if (!REALTIME_ENABLED) {
      console.log('🔇 Project real-time disabled in production environment');
      setConnectionStatus('disabled');
      return;
    }
  }, []);

  const subscribe = useCallback(() => {
    if (!projectId || !REALTIME_ENABLED) {
      console.log('🔇 Project real-time subscription skipped - no project ID or disabled');
      return;
    }

    if (channelRef.current) {
      console.log('🔄 Unsubscribing from existing project channel');
      supabase.removeChannel(channelRef.current);
    }

    console.log('🔗 Subscribing to project real-time events for project:', projectId);
    setConnectionStatus('connecting');

    try {
      const channel = supabase
        .channel(`project-${projectId}`)
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public',
            table: 'tasks',
            filter: `project_id=eq.${projectId}`
          },
          (payload) => {
            console.log('📡 Project task event:', payload);
            const event: RealtimeEvent = {
              type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
              table: payload.table,
              record: payload.new,
              old_record: payload.old,
              timestamp: new Date()
            };
            setLastEvent(event);
            setEventCount(prev => prev + 1);
          }
        )
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public',
            table: 'comments',
            filter: `project_id=eq.${projectId}`
          },
          (payload) => {
            console.log('📡 Project comment event:', payload);
            const event: RealtimeEvent = {
              type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
              table: payload.table,
              record: payload.new,
              old_record: payload.old,
              timestamp: new Date()
            };
            setLastEvent(event);
            setEventCount(prev => prev + 1);
          }
        )
        .subscribe((status) => {
          console.log('🔄 Project realtime status:', status);
          setIsConnected(status === 'SUBSCRIBED');
          
          switch (status) {
            case 'SUBSCRIBED':
              setConnectionStatus('connected');
              break;
            case 'CHANNEL_ERROR':
            case 'TIMED_OUT':
            case 'CLOSED':
              setConnectionStatus('error');
              break;
            default:
              setConnectionStatus('connecting');
          }
        });

      channelRef.current = channel;
    } catch (error) {
      console.error('❌ Project real-time subscription failed:', error);
      setConnectionStatus('error');
    }
  }, [projectId]);

  const unsubscribe = useCallback(() => {
    if (channelRef.current) {
      console.log('🔌 Unsubscribing from project real-time');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      setIsConnected(false);
      setConnectionStatus('disconnected');
    }
  }, []);

  const reconnect = useCallback(() => {
    if (!REALTIME_ENABLED) return;
    
    console.log('🔄 Reconnecting project real-time...');
    unsubscribe();
    setTimeout(subscribe, 1000);
  }, [subscribe, unsubscribe]);

  const send = useCallback(async (payload: any): Promise<RealtimeChannelSendResponse> => {
    if (!channelRef.current || !REALTIME_ENABLED) {
      return { status: 'error', response: 'Channel not available or disabled' } as unknown as RealtimeChannelSendResponse;
    }

    return channelRef.current.send({
      type: 'broadcast',
      event: 'project-event',
      payload
    });
  }, []);

  // Re-subscribe when project changes
  useEffect(() => {
    if (projectId && REALTIME_ENABLED) {
      subscribe();
    } else {
      unsubscribe();
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [projectId, subscribe, unsubscribe]);

  return {
    isConnected,
    connectionStatus,
    lastEvent,
    eventCount,
    subscribe,
    unsubscribe,
    reconnect,
    send
  };
} 