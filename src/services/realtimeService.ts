import { supabase } from '../config/supabase';
import { RealtimeChannel, type RealtimePostgresChangesPayload, REALTIME_LISTEN_TYPES } from '@supabase/supabase-js';

// Types for real-time events
export interface RealtimeTaskEvent {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: any;
  old_record?: any;
  timestamp?: Date;
}

export interface RealtimeCommentEvent {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: any;
  old_record?: any;
  timestamp?: Date;
}

export interface RealtimeProjectEvent {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: any;
  old_record?: any;
  timestamp?: Date;
}

export interface RealtimeActivityEvent {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: any;
  old_record?: any;
  timestamp?: Date;
}

export type RealtimeEvent = RealtimeTaskEvent | RealtimeCommentEvent | RealtimeProjectEvent | RealtimeActivityEvent;

// Event handlers
export type RealtimeEventHandler = (event: RealtimeEvent) => void;

export class RealtimeService {
  private channels: Map<string, RealtimeChannel> = new Map();
  private handlers: Map<string, RealtimeEventHandler[]> = new Map();

  /**
   * Subscribe to real-time updates for a specific project
   */
  async subscribeToProject(projectId: string, handler: RealtimeEventHandler): Promise<void> {
    const channelName = `project:${projectId}`;
    
    // Add handler to the list
    if (!this.handlers.has(channelName)) {
      this.handlers.set(channelName, []);
    }
    this.handlers.get(channelName)!.push(handler);

    // If channel already exists, don't create a new one
    if (this.channels.has(channelName)) {
      return;
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `project_id=eq.${projectId}`,
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          this.handleDatabaseChange('tasks', payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `entity_id=eq.${projectId}`,
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          this.handleDatabaseChange('comments', payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `id=eq.${projectId}`,
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          this.handleDatabaseChange('projects', payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_members',
          filter: `project_id=eq.${projectId}`,
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          this.handleDatabaseChange('project_members', payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_logs',
          filter: `project_id=eq.${projectId}`,
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          this.handleDatabaseChange('activity_logs', payload);
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);
  }

  /**
   * Subscribe to real-time updates for a specific task
   */
  async subscribeToTask(taskId: string, handler: RealtimeEventHandler): Promise<void> {
    const channelName = `task:${taskId}`;
    
    // Add handler to the list
    if (!this.handlers.has(channelName)) {
      this.handlers.set(channelName, []);
    }
    this.handlers.get(channelName)!.push(handler);

    // If channel already exists, don't create a new one
    if (this.channels.has(channelName)) {
      return;
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `id=eq.${taskId}`,
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          this.handleDatabaseChange('tasks', payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `entity_id=eq.${taskId}`,
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          this.handleDatabaseChange('comments', payload);
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);
  }

  /**
   * Subscribe to global activity updates (for dashboard/notifications)
   */
  async subscribeToGlobalActivity(handler: RealtimeEventHandler): Promise<void> {
    const channelName = 'global:activity';
    
    // Add handler to the list
    if (!this.handlers.has(channelName)) {
      this.handlers.set(channelName, []);
    }
    this.handlers.get(channelName)!.push(handler);

    // If channel already exists, don't create a new one
    if (this.channels.has(channelName)) {
      return;
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_logs',
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          this.handleDatabaseChange('activity_logs', payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_invitations',
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          this.handleDatabaseChange('project_invitations', payload);
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);
  }

  /**
   * Unsubscribe from a specific channel
   */
  async unsubscribe(channelName: string): Promise<void> {
    const channel = this.channels.get(channelName);
    if (channel) {
      await supabase.removeChannel(channel);
      this.channels.delete(channelName);
      this.handlers.delete(channelName);
    }
  }

  /**
   * Unsubscribe from project updates
   */
  async unsubscribeFromProject(projectId: string): Promise<void> {
    await this.unsubscribe(`project:${projectId}`);
  }

  /**
   * Unsubscribe from task updates
   */
  async unsubscribeFromTask(taskId: string): Promise<void> {
    await this.unsubscribe(`task:${taskId}`);
  }

  /**
   * Unsubscribe from global activity
   */
  async unsubscribeFromGlobalActivity(): Promise<void> {
    await this.unsubscribe('global:activity');
  }

  /**
   * Unsubscribe from all channels
   */
  async unsubscribeAll(): Promise<void> {
    const promises = Array.from(this.channels.keys()).map(channelName =>
      this.unsubscribe(channelName)
    );
    await Promise.all(promises);
  }

  /**
   * Get active subscriptions
   */
  getActiveSubscriptions(): string[] {
    return Array.from(this.channels.keys());
  }

  /**
   * Handle database changes and notify all handlers
   */
  private handleDatabaseChange(table: string, payload: RealtimePostgresChangesPayload<any>): void {
    const event: RealtimeEvent = {
      type: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
      table: table as any,
      record: payload.new,
      old_record: payload.old,
    };

    // Find all handlers that should receive this event
    const relevantChannels = this.findRelevantChannels(table, payload);
    
    relevantChannels.forEach(channelName => {
      const handlers = this.handlers.get(channelName) || [];
      handlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error(`Error in real-time event handler for ${channelName}:`, error);
        }
      });
    });
  }

  /**
   * Find which channels should receive this database change
   */
  private findRelevantChannels(table: string, payload: RealtimePostgresChangesPayload<any>): string[] {
    const channels: string[] = [];
    const record = payload.new || payload.old;

    // Always include global activity channel for activity logs
    if (table === 'activity_logs') {
      channels.push('global:activity');
    }

    // Include project-specific channels
    if (record?.project_id) {
      channels.push(`project:${record.project_id}`);
    }

    // Include task-specific channels
    if (table === 'tasks' && record?.id) {
      channels.push(`task:${record.id}`);
    }

    // For comments, check if it's a task comment
    if (table === 'comments' && record?.entity_id && record?.entity_type === 'task') {
      channels.push(`task:${record.entity_id}`);
    }

    // Include global channel for project invitations
    if (table === 'project_invitations') {
      channels.push('global:activity');
    }

    return channels.filter(channel => this.channels.has(channel));
  }

  /**
   * Send a custom real-time message to a channel
   */
  async sendMessage(channelName: string, event: string, payload: any): Promise<void> {
    const channel = this.channels.get(channelName);
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event,
        payload,
      });
    }
  }

  /**
   * Listen for custom broadcast messages
   */
  onBroadcast(channelName: string, event: string, callback: (payload: any) => void): void {
    const channel = this.channels.get(channelName);
    if (channel) {
      channel.on('broadcast', { event }, callback);
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): string {
    // Return the status of the first channel as a representative
    const firstChannel = Array.from(this.channels.values())[0];
    return firstChannel?.state || 'CLOSED';
  }
}

// Create and export a singleton instance
export const realtimeService = new RealtimeService();

// Cleanup on window unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    realtimeService.unsubscribeAll();
  });
} 