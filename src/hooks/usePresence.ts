import { useState, useEffect, useRef, useCallback } from 'react';
import { presenceService } from '../services/presenceService';
import type { EntityPresence, TypingIndicator } from '../services/presenceService';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface UsePresenceOptions {
  entityType: 'task' | 'project' | 'comment';
  entityId: string;
  autoSetPresence?: boolean;
  presenceType?: 'viewing' | 'editing' | 'commenting';
}

export interface UsePresenceReturn {
  // Presence data
  presence: EntityPresence[];
  typingIndicators: TypingIndicator[];
  currentUserPresence: EntityPresence | null;
  
  // Actions
  setPresence: (presenceType: 'viewing' | 'editing' | 'commenting', cursorPosition?: any) => Promise<void>;
  removePresence: (presenceType?: 'viewing' | 'editing' | 'commenting') => Promise<void>;
  updateTyping: (fieldName: string, isTyping: boolean, cursorPosition?: number, selectionStart?: number, selectionEnd?: number) => Promise<void>;
  
  // State
  isLoading: boolean;
  error: string | null;
  
  // Utilities
  getUsersCount: () => number;
  getActiveEditors: () => EntityPresence[];
  getActiveViewers: () => EntityPresence[];
  isUserTyping: (userId: string, fieldName?: string) => boolean;
}

export function usePresence({
  entityType,
  entityId,
  autoSetPresence = true,
  presenceType = 'viewing'
}: UsePresenceOptions): UsePresenceReturn {
  const [presence, setPresence] = useState<EntityPresence[]>([]);
  const [typingIndicators, setTypingIndicators] = useState<TypingIndicator[]>([]);
  const [currentUserPresence, setCurrentUserPresence] = useState<EntityPresence | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const channelRef = useRef<RealtimeChannel | null>(null);
  const currentUserId = presenceService.getCurrentUserId();

  // Handle presence changes
  const handlePresenceChange = useCallback((newPresence: EntityPresence[]) => {
    setPresence(newPresence);
    
    // Update current user presence
    const userPresence = newPresence.find(p => p.user_id === currentUserId);
    setCurrentUserPresence(userPresence || null);
    
    setIsLoading(false);
  }, [currentUserId]);

  // Handle typing indicator changes
  const handleTypingChange = useCallback((newTyping: TypingIndicator[]) => {
    setTypingIndicators(newTyping);
  }, []);

  // Set user presence
  const setUserPresence = useCallback(async (
    presenceType: 'viewing' | 'editing' | 'commenting',
    cursorPosition?: any
  ) => {
    try {
      setError(null);
      const result = await presenceService.setEntityPresence(
        entityType,
        entityId,
        presenceType,
        cursorPosition
      );
      
      if (!result.success) {
        setError(result.error || 'Failed to set presence');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [entityType, entityId]);

  // Remove user presence
  const removeUserPresence = useCallback(async (presenceType?: 'viewing' | 'editing' | 'commenting') => {
    try {
      setError(null);
      const result = await presenceService.removeEntityPresence(
        entityType,
        entityId,
        presenceType
      );
      
      if (!result.success) {
        setError(result.error || 'Failed to remove presence');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [entityType, entityId]);

  // Update typing indicator
  const updateTypingIndicator = useCallback(async (
    fieldName: string,
    isTyping: boolean,
    cursorPosition: number = 0,
    selectionStart?: number,
    selectionEnd?: number
  ) => {
    try {
      setError(null);
      const result = await presenceService.updateTypingIndicator(
        entityType,
        entityId,
        fieldName,
        isTyping,
        cursorPosition,
        selectionStart,
        selectionEnd
      );
      
      if (!result.success) {
        setError(result.error || 'Failed to update typing indicator');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [entityType, entityId]);

  // Utility functions
  const getUsersCount = useCallback(() => {
    return new Set(presence.map(p => p.user_id)).size;
  }, [presence]);

  const getActiveEditors = useCallback(() => {
    return presence.filter(p => p.presence_type === 'editing');
  }, [presence]);

  const getActiveViewers = useCallback(() => {
    return presence.filter(p => p.presence_type === 'viewing');
  }, [presence]);

  const isUserTyping = useCallback((userId: string, fieldName?: string) => {
    if (fieldName) {
      return typingIndicators.some(t => t.user_id === userId && t.field_name === fieldName && t.is_typing);
    }
    return typingIndicators.some(t => t.user_id === userId && t.is_typing);
  }, [typingIndicators]);

  // Initialize presence subscription
  useEffect(() => {
    if (!entityType || !entityId) return;

    const channel = presenceService.subscribeToPresence(
      entityType,
      entityId,
      handlePresenceChange,
      handleTypingChange
    );

    channelRef.current = channel;

    // Set initial presence if auto-set is enabled
    if (autoSetPresence) {
      setUserPresence(presenceType);
    }

    return () => {
      // Clean up presence when component unmounts
      if (autoSetPresence) {
        removeUserPresence();
      }
      
      presenceService.unsubscribeFromPresence(entityType, entityId);
      channelRef.current = null;
    };
  }, [entityType, entityId, autoSetPresence, presenceType, setUserPresence, removeUserPresence, handlePresenceChange, handleTypingChange]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        presenceService.unsubscribeFromPresence(entityType, entityId);
      }
    };
  }, [entityType, entityId]);

  return {
    // Data
    presence,
    typingIndicators,
    currentUserPresence,
    
    // Actions
    setPresence: setUserPresence,
    removePresence: removeUserPresence,
    updateTyping: updateTypingIndicator,
    
    // State
    isLoading,
    error,
    
    // Utilities
    getUsersCount,
    getActiveEditors,
    getActiveViewers,
    isUserTyping
  };
} 