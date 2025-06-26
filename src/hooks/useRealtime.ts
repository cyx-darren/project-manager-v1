import { useEffect, useRef, useState } from 'react';
import { realtimeService, type RealtimeEvent } from '../services/realtimeService';

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
  return useRealtime({
    enableTasks: false,
    enableComments: false,
    enableProjects: true,
    enableActivity: true
  });
} 