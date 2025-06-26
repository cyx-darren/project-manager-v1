import { supabase } from '../config/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

// Types for user presence
export interface UserPresence {
  id: string;
  user_id: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  last_seen: string;
  current_page?: string;
  session_id?: string;
  device_info?: any;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
    };
  };
}

export interface EntityPresence {
  id: string;
  user_id: string;
  entity_type: 'task' | 'project' | 'comment';
  entity_id: string;
  presence_type: 'viewing' | 'editing' | 'commenting';
  cursor_position?: any;
  last_activity: string;
  session_id: string;
  created_at: string;
  user?: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
    };
  };
}

export interface TypingIndicator {
  id: string;
  user_id: string;
  entity_type: 'task' | 'project' | 'comment';
  entity_id: string;
  field_name: string;
  is_typing: boolean;
  cursor_position: number;
  selection_start?: number;
  selection_end?: number;
  session_id: string;
  started_at: string;
  last_keystroke: string;
  expires_at: string;
  user?: {
    id: string;
    email: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
    };
  };
}

export class PresenceService {
  private channels: Map<string, RealtimeChannel> = new Map();
  private currentSessionId: string;
  private currentUserId: string | null = null;

  constructor() {
    this.currentSessionId = this.generateSessionId();
    this.initializeUser();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async initializeUser(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      this.currentUserId = user?.id || null;
    } catch (error) {
      console.warn('Could not initialize user for presence service:', error);
      this.currentUserId = 'mock-user-id';
    }
  }

  async updatePresence(
    status: 'online' | 'away' | 'busy' | 'offline' = 'online',
    currentPage?: string,
    deviceInfo?: any
  ): Promise<{ success: boolean; data?: UserPresence; error?: string }> {
    try {
      if (!this.currentUserId) {
        return { success: false, error: 'User not authenticated' };
      }

      const mockData: UserPresence = {
        id: '1',
        user_id: this.currentUserId,
        status,
        last_seen: new Date().toISOString(),
        current_page: currentPage,
        session_id: this.currentSessionId,
        device_info: deviceInfo || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user: {
          id: this.currentUserId,
          email: 'user@example.com',
          user_metadata: {
            full_name: 'Current User',
            avatar_url: undefined
          }
        }
      };

      return { success: true, data: mockData };
    } catch (error) {
      console.error('Error updating presence:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async setEntityPresence(
    entityType: 'task' | 'project' | 'comment',
    entityId: string,
    presenceType: 'viewing' | 'editing' | 'commenting',
    cursorPosition?: any
  ): Promise<{ success: boolean; data?: EntityPresence; error?: string }> {
    try {
      if (!this.currentUserId) {
        return { success: false, error: 'User not authenticated' };
      }

      const mockData: EntityPresence = {
        id: '1',
        user_id: this.currentUserId,
        entity_type: entityType,
        entity_id: entityId,
        presence_type: presenceType,
        cursor_position: cursorPosition,
        session_id: this.currentSessionId,
        last_activity: new Date().toISOString(),
        created_at: new Date().toISOString(),
        user: {
          id: this.currentUserId,
          email: 'user@example.com',
          user_metadata: {
            full_name: 'Current User',
            avatar_url: undefined
          }
        }
      };

      return { success: true, data: mockData };
    } catch (error) {
      console.error('Error setting entity presence:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async removeEntityPresence(
    entityType: 'task' | 'project' | 'comment',
    entityId: string,
    presenceType?: 'viewing' | 'editing' | 'commenting'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.currentUserId) {
        return { success: false, error: 'User not authenticated' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error removing entity presence:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getEntityPresence(
    entityType: 'task' | 'project' | 'comment',
    entityId: string
  ): Promise<{ success: boolean; data?: EntityPresence[]; error?: string }> {
    try {
      const mockData: EntityPresence[] = [
        {
          id: '1',
          user_id: this.currentUserId || 'mock-user',
          entity_type: entityType,
          entity_id: entityId,
          presence_type: 'viewing',
          last_activity: new Date().toISOString(),
          session_id: this.currentSessionId,
          created_at: new Date().toISOString(),
          user: {
            id: this.currentUserId || 'mock-user',
            email: 'user@example.com',
            user_metadata: {
              full_name: 'Current User',
              avatar_url: undefined
            }
          }
        }
      ];

      return { success: true, data: mockData };
    } catch (error) {
      console.error('Error getting entity presence:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async updateTypingIndicator(
    entityType: 'task' | 'project' | 'comment',
    entityId: string,
    fieldName: string,
    isTyping: boolean,
    cursorPosition: number = 0,
    selectionStart?: number,
    selectionEnd?: number
  ): Promise<{ success: boolean; data?: TypingIndicator; error?: string }> {
    try {
      if (!this.currentUserId) {
        return { success: false, error: 'User not authenticated' };
      }

      const mockData: TypingIndicator = {
        id: '1',
        user_id: this.currentUserId,
        entity_type: entityType,
        entity_id: entityId,
        field_name: fieldName,
        is_typing: isTyping,
        cursor_position: cursorPosition,
        selection_start: selectionStart,
        selection_end: selectionEnd,
        session_id: this.currentSessionId,
        started_at: new Date().toISOString(),
        last_keystroke: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30000).toISOString(),
        user: {
          id: this.currentUserId,
          email: 'user@example.com',
          user_metadata: {
            full_name: 'Current User',
            avatar_url: undefined
          }
        }
      };

      return { success: true, data: mockData };
    } catch (error) {
      console.error('Error updating typing indicator:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getTypingIndicators(
    entityType: 'task' | 'project' | 'comment',
    entityId: string,
    fieldName?: string
  ): Promise<{ success: boolean; data?: TypingIndicator[]; error?: string }> {
    try {
      const mockData: TypingIndicator[] = [];
      return { success: true, data: mockData };
    } catch (error) {
      console.error('Error getting typing indicators:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  subscribeToPresence(
    entityType: 'task' | 'project' | 'comment',
    entityId: string,
    onPresenceChange: (presence: EntityPresence[]) => void,
    onTypingChange: (typing: TypingIndicator[]) => void
  ): RealtimeChannel {
    const channelName = `presence:${entityType}:${entityId}`;
    
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!;
    }

    const channel = supabase.channel(channelName);
    this.channels.set(channelName, channel);
    
    setTimeout(() => {
      this.getEntityPresence(entityType, entityId).then(result => {
        if (result.success && result.data) {
          onPresenceChange(result.data);
        }
      });
      
      this.getTypingIndicators(entityType, entityId).then(result => {
        if (result.success && result.data) {
          onTypingChange(result.data);
        }
      });
    }, 100);

    return channel;
  }

  unsubscribeFromPresence(entityType: 'task' | 'project' | 'comment', entityId: string): void {
    const channelName = `presence:${entityType}:${entityId}`;
    const channel = this.channels.get(channelName);
    
    if (channel) {
      supabase.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  async cleanup(): Promise<void> {
    try {
      if (!this.currentUserId) return;

      await this.updatePresence('offline');

      this.channels.forEach((channel) => {
        supabase.removeChannel(channel);
      });
      this.channels.clear();
    } catch (error) {
      console.error('Error during presence cleanup:', error);
    }
  }

  getSessionId(): string {
    return this.currentSessionId;
  }

  getCurrentUserId(): string | null {
    return this.currentUserId;
  }
}

export const presenceService = new PresenceService(); 