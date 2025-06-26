import { useState, useEffect, useCallback } from 'react';
import { versionHistoryService, type VersionHistoryEntry, type VersionComparison } from '../services/versionHistoryService';
import { useAuth } from '../contexts/AuthContext';

export interface UseVersionHistoryProps {
  entityType: string;
  entityId: string;
  enabled?: boolean;
}

export interface UseVersionHistoryReturn {
  // State
  versions: VersionHistoryEntry[];
  isLoading: boolean;
  error: string | null;
  hasHistory: boolean;
  
  // Actions
  loadVersionHistory: () => Promise<void>;
  rollbackToVersion: (versionNumber: number, summary?: string) => Promise<void>;
  compareVersions: (fromVersion: number, toVersion: number) => Promise<VersionComparison[]>;
  createVersion: (content: Record<string, any>, summary: string) => Promise<void>;
  
  // Utilities
  getVersionByNumber: (versionNumber: number) => VersionHistoryEntry | undefined;
  getLatestVersion: () => VersionHistoryEntry | undefined;
}

export function useVersionHistory({
  entityType,
  entityId,
  enabled = true
}: UseVersionHistoryProps): UseVersionHistoryReturn {
  const { user } = useAuth();
  const [versions, setVersions] = useState<VersionHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasHistory, setHasHistory] = useState(false);

  const loadVersionHistory = useCallback(async () => {
    if (!enabled || !entityType || !entityId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const [versionHistory, hasVersions] = await Promise.all([
        versionHistoryService.getVersionHistory(entityType, entityId),
        versionHistoryService.hasVersionHistory(entityType, entityId)
      ]);
      
      setVersions(versionHistory);
      setHasHistory(hasVersions);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load version history';
      setError(errorMessage);
      console.error('Error loading version history:', err);
    } finally {
      setIsLoading(false);
    }
  }, [entityType, entityId, enabled]);

  const rollbackToVersion = useCallback(async (versionNumber: number, summary?: string) => {
    if (!user?.id) {
      throw new Error('User must be authenticated to rollback versions');
    }

    setIsLoading(true);
    setError(null);

    try {
      await versionHistoryService.rollbackToVersion(
        entityType,
        entityId,
        versionNumber,
        user.id,
        summary
      );
      
      // Reload version history after rollback
      await loadVersionHistory();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to rollback to version';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [entityType, entityId, user?.id, loadVersionHistory]);

  const compareVersions = useCallback(async (fromVersion: number, toVersion: number): Promise<VersionComparison[]> => {
    setError(null);
    
    try {
      return await versionHistoryService.compareVersions(entityType, entityId, fromVersion, toVersion);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to compare versions';
      setError(errorMessage);
      throw err;
    }
  }, [entityType, entityId]);

  const createVersion = useCallback(async (content: Record<string, any>, summary: string) => {
    if (!user?.id) {
      throw new Error('User must be authenticated to create versions');
    }

    setIsLoading(true);
    setError(null);

    try {
      await versionHistoryService.createVersion(entityType, entityId, content, summary, user.id);
      
      // Reload version history after creating new version
      await loadVersionHistory();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create version';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [entityType, entityId, user?.id, loadVersionHistory]);

  const getVersionByNumber = useCallback((versionNumber: number): VersionHistoryEntry | undefined => {
    return versions.find(v => v.version.version_number === versionNumber);
  }, [versions]);

  const getLatestVersion = useCallback((): VersionHistoryEntry | undefined => {
    return versions.length > 0 ? versions[0] : undefined;
  }, [versions]);

  // Load version history on mount and when dependencies change
  useEffect(() => {
    if (enabled) {
      loadVersionHistory();
    }
  }, [loadVersionHistory, enabled]);

  return {
    // State
    versions,
    isLoading,
    error,
    hasHistory,
    
    // Actions
    loadVersionHistory,
    rollbackToVersion,
    compareVersions,
    createVersion,
    
    // Utilities
    getVersionByNumber,
    getLatestVersion
  };
} 