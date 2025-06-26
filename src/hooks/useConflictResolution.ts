import { useState, useEffect, useCallback } from 'react';
import { conflictResolutionService } from '../services/conflictResolutionService';
import type { Operation, ConflictDetectionResult, ConflictResolution } from '../services/conflictResolutionService';

interface UseConflictResolutionOptions {
  resourceId?: string;
  resourceType?: 'task' | 'project' | 'comment';
  userId?: string;
}

export const useConflictResolution = (options: UseConflictResolutionOptions = {}) => {
  const [conflicts, setConflicts] = useState<ConflictDetectionResult[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load operation history for the resource
  const loadOperationHistory = useCallback(async () => {
    if (!options.resourceId || !options.resourceType) return;

    try {
      setIsLoading(true);
      const history = await conflictResolutionService.getOperationHistory(
        options.resourceId,
        options.resourceType
      );
      setOperations(history);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load operation history');
    } finally {
      setIsLoading(false);
    }
  }, [options.resourceId, options.resourceType]);

  // Handle concurrent edit
  const handleConcurrentEdit = useCallback(async (
    content: string,
    position: number = 0
  ) => {
    if (!options.resourceId || !options.resourceType || !options.userId) {
      throw new Error('Missing required options for concurrent edit');
    }

    try {
      setIsLoading(true);
      setError(null);

      const result = await conflictResolutionService.handleConcurrentEdit(
        options.resourceId,
        options.resourceType,
        options.userId,
        content,
        position
      );

      if (result.conflicts) {
        setConflicts(prev => [...prev, result.conflicts!]);
      }

      // Reload operation history
      await loadOperationHistory();

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to handle concurrent edit';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [options.resourceId, options.resourceType, options.userId, loadOperationHistory]);

  // Simulate conflict for testing
  const simulateConflict = useCallback(async () => {
    if (!options.resourceId || !options.resourceType) {
      throw new Error('Missing required options for conflict simulation');
    }

    try {
      setIsLoading(true);
      setError(null);

      const conflict = await conflictResolutionService.simulateConflict(
        options.resourceId,
        options.resourceType
      );

      if (conflict.hasConflict) {
        setConflicts(prev => [...prev, conflict]);
      }

      return conflict;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to simulate conflict';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [options.resourceId, options.resourceType]);

  // Resolve conflict
  const resolveConflict = useCallback(async (conflictResolution: ConflictResolution) => {
    try {
      setIsLoading(true);
      setError(null);

      const resolvedOperation = await conflictResolutionService.resolveConflict(conflictResolution);

      // Remove resolved conflict from state
      setConflicts(prev => prev.filter(c => 
        c.suggestedResolution?.id !== conflictResolution.id
      ));

      // Reload operation history
      await loadOperationHistory();

      return resolvedOperation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resolve conflict';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [loadOperationHistory]);

  // Clear conflicts
  const clearConflicts = useCallback(() => {
    setConflicts([]);
    setError(null);
  }, []);

  // Clear pending operations
  const clearPendingOperations = useCallback(async () => {
    if (!options.resourceId || !options.resourceType) return;

    try {
      await conflictResolutionService.clearPendingOperations(
        options.resourceId,
        options.resourceType
      );
      await loadOperationHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear pending operations');
    }
  }, [options.resourceId, options.resourceType, loadOperationHistory]);

  // Get service statistics
  const getServiceStats = useCallback(() => {
    return {
      pendingOperationsCount: conflictResolutionService.getPendingOperationsCount(),
      versionVectorsCount: conflictResolutionService.getVersionVectorsCount()
    };
  }, []);

  // Load initial data
  useEffect(() => {
    if (options.resourceId && options.resourceType) {
      loadOperationHistory();
    }
  }, [loadOperationHistory]);

  return {
    // State
    conflicts,
    operations,
    isLoading,
    error,
    
    // Actions
    handleConcurrentEdit,
    simulateConflict,
    resolveConflict,
    clearConflicts,
    clearPendingOperations,
    loadOperationHistory,
    getServiceStats,
    
    // Computed values
    hasConflicts: conflicts.length > 0,
    operationsCount: operations.length,
    conflictsCount: conflicts.length
  };
}; 