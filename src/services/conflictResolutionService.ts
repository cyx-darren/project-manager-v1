// Conflict Resolution Service for Multi-User Collaboration
import { supabase } from '../config/supabase';

// Types for Operational Transformation
export interface Operation {
  id: string;
  type: 'insert' | 'delete' | 'update' | 'move';
  position: number;
  content?: string;
  length?: number;
  userId: string;
  timestamp: number;
  resourceType: 'task' | 'project' | 'comment';
  resourceId: string;
  version: number;
}

export interface ConflictResolution {
  id: string;
  conflictType: 'concurrent_edit' | 'version_mismatch' | 'permission_conflict';
  operations: Operation[];
  resolvedOperation: Operation;
  strategy: 'last_write_wins' | 'operational_transform' | 'merge' | 'user_choice';
  timestamp: number;
  involvedUsers: string[];
}

export interface VersionVector {
  resourceId: string;
  resourceType: string;
  version: number;
  lastModified: number;
  lastModifiedBy: string;
}

export interface ConflictDetectionResult {
  hasConflict: boolean;
  conflictType?: string;
  conflictingOperations?: Operation[];
  suggestedResolution?: ConflictResolution;
}

class ConflictResolutionService {
  private pendingOperations: Map<string, Operation[]> = new Map();
  private versionVectors: Map<string, VersionVector> = new Map();

  // Operational Transformation Functions
  transformOperation(op1: Operation, op2: Operation): Operation {
    // Transform op1 against op2 (op2 has priority)
    const transformedOp = { ...op1 };

    if (op1.resourceId !== op2.resourceId) {
      return transformedOp; // No transformation needed for different resources
    }

    switch (op1.type) {
      case 'insert':
        if (op2.type === 'insert') {
          // Both insertions - adjust position if op2 comes before op1
          if (op2.position <= op1.position) {
            transformedOp.position += op2.content?.length || 0;
          }
        } else if (op2.type === 'delete') {
          // Insert vs Delete
          if (op2.position < op1.position) {
            transformedOp.position -= op2.length || 0;
          }
        }
        break;

      case 'delete':
        if (op2.type === 'insert') {
          // Delete vs Insert
          if (op2.position <= op1.position) {
            transformedOp.position += op2.content?.length || 0;
          }
        } else if (op2.type === 'delete') {
          // Both deletions
          if (op2.position < op1.position) {
            transformedOp.position -= op2.length || 0;
          } else if (op2.position === op1.position) {
            // Same position - merge deletions
            transformedOp.length = Math.max(op1.length || 0, op2.length || 0);
          }
        }
        break;

      case 'update':
        if (op2.type === 'update' && op1.position === op2.position) {
          // Concurrent updates at same position - use timestamp for resolution
          if (op2.timestamp > op1.timestamp) {
            transformedOp.content = this.mergeContent(op1.content || '', op2.content || '');
          }
        }
        break;
    }

    return transformedOp;
  }

  // Detect conflicts between operations
  async detectConflicts(newOperation: Operation): Promise<ConflictDetectionResult> {
    try {
      const resourceKey = `${newOperation.resourceType}:${newOperation.resourceId}`;
      const pendingOps = this.pendingOperations.get(resourceKey) || [];
      
      // Check for version conflicts
      const currentVersion = await this.getCurrentVersion(newOperation.resourceId, newOperation.resourceType);
      if (currentVersion && newOperation.version < currentVersion.version) {
        return {
          hasConflict: true,
          conflictType: 'version_mismatch',
          conflictingOperations: [newOperation],
          suggestedResolution: await this.createResolution(
            'version_mismatch',
            [newOperation],
            'operational_transform'
          )
        };
      }

      // Check for concurrent operations
      const concurrentOps = pendingOps.filter(op => 
        Math.abs(op.timestamp - newOperation.timestamp) < 1000 && // Within 1 second
        op.userId !== newOperation.userId
      );

      if (concurrentOps.length > 0) {
        return {
          hasConflict: true,
          conflictType: 'concurrent_edit',
          conflictingOperations: [...concurrentOps, newOperation],
          suggestedResolution: await this.createResolution(
            'concurrent_edit',
            [...concurrentOps, newOperation],
            'operational_transform'
          )
        };
      }

      return { hasConflict: false };
    } catch (error) {
      console.error('Error detecting conflicts:', error);
      return { hasConflict: false };
    }
  }

  // Resolve conflicts using specified strategy
  async resolveConflict(conflict: ConflictResolution): Promise<Operation> {
    switch (conflict.strategy) {
      case 'operational_transform':
        return this.resolveWithOT(conflict.operations);
      
      case 'last_write_wins':
        return this.resolveWithLastWriteWins(conflict.operations);
      
      case 'merge':
        return this.resolveWithMerge(conflict.operations);
      
      default:
        return conflict.operations[0]; // Fallback to first operation
    }
  }

  // Operational Transformation resolution
  private resolveWithOT(operations: Operation[]): Operation {
    if (operations.length === 0) {
      throw new Error('No operations to resolve');
    }

    // Sort operations by timestamp
    const sortedOps = [...operations].sort((a, b) => a.timestamp - b.timestamp);
    let resolvedOp = sortedOps[0];

    // Transform each subsequent operation against the resolved operation
    for (let i = 1; i < sortedOps.length; i++) {
      const transformedOp = this.transformOperation(sortedOps[i], resolvedOp);
      resolvedOp = this.combineOperations(resolvedOp, transformedOp);
    }

    return resolvedOp;
  }

  // Last Write Wins resolution
  private resolveWithLastWriteWins(operations: Operation[]): Operation {
    return operations.reduce((latest, current) => 
      current.timestamp > latest.timestamp ? current : latest
    );
  }

  // Merge resolution (for compatible operations)
  private resolveWithMerge(operations: Operation[]): Operation {
    const baseOp = operations[0];
    const mergedContent = operations.reduce((content, op) => {
      return this.mergeContent(content, op.content || '');
    }, baseOp.content || '');

    return {
      ...baseOp,
      content: mergedContent,
      id: `merged_${Date.now()}`,
      timestamp: Date.now()
    };
  }

  // Combine two operations into one
  private combineOperations(op1: Operation, op2: Operation): Operation {
    if (op1.type === 'update' && op2.type === 'update') {
      return {
        ...op1,
        content: this.mergeContent(op1.content || '', op2.content || ''),
        timestamp: Math.max(op1.timestamp, op2.timestamp)
      };
    }

    // For other types, return the later operation
    return op1.timestamp > op2.timestamp ? op1 : op2;
  }

  // Smart content merging
  private mergeContent(content1: string, content2: string): string {
    if (content1 === content2) return content1;
    
    // Simple merge strategy - could be enhanced with more sophisticated algorithms
    const lines1 = content1.split('\n');
    const lines2 = content2.split('\n');
    
    const merged = [...new Set([...lines1, ...lines2])];
    return merged.join('\n');
  }

  // Version management
  async getCurrentVersion(resourceId: string, resourceType: string): Promise<VersionVector | null> {
    try {
      // Mock implementation - in real app this would query a versions table
      const versionKey = `${resourceType}:${resourceId}`;
      return this.versionVectors.get(versionKey) || null;
    } catch (error) {
      console.error('Error getting current version:', error);
      return null;
    }
  }

  async updateVersion(resourceId: string, resourceType: string, userId: string): Promise<VersionVector> {
    try {
      const versionKey = `${resourceType}:${resourceId}`;
      const currentVersion = this.versionVectors.get(versionKey);
      const newVersion: VersionVector = {
        resourceId,
        resourceType,
        version: (currentVersion?.version || 0) + 1,
        lastModified: Date.now(),
        lastModifiedBy: userId
      };
      
      this.versionVectors.set(versionKey, newVersion);
      return newVersion;
    } catch (error) {
      console.error('Error updating version:', error);
      throw error;
    }
  }

  private async getNextVersion(resourceId: string, resourceType: string): Promise<number> {
    const current = await this.getCurrentVersion(resourceId, resourceType);
    return (current?.version || 0) + 1;
  }

  // Operation management
  async applyOperation(operation: Operation): Promise<boolean> {
    try {
      // Detect conflicts first
      const conflictResult = await this.detectConflicts(operation);
      
      if (conflictResult.hasConflict && conflictResult.suggestedResolution) {
        // Resolve conflict and apply resolved operation
        const resolvedOp = await this.resolveConflict(conflictResult.suggestedResolution);
        return this.executeOperation(resolvedOp);
      } else {
        // No conflict, apply operation directly
        return this.executeOperation(operation);
      }
    } catch (error) {
      console.error('Error applying operation:', error);
      return false;
    }
  }

  private async executeOperation(operation: Operation): Promise<boolean> {
    try {
      // Store operation in history
      await this.storeOperation(operation);
      
      // Update resource version
      await this.updateVersion(operation.resourceId, operation.resourceType, operation.userId);
      
      // Apply operation to actual resource
      return this.applyToResource(operation);
    } catch (error) {
      console.error('Error executing operation:', error);
      return false;
    }
  }

  private async storeOperation(operation: Operation): Promise<void> {
    try {
      // Store operation in memory for demo purposes
      const resourceKey = `${operation.resourceType}:${operation.resourceId}`;
      const existing = this.pendingOperations.get(resourceKey) || [];
      existing.push(operation);
      this.pendingOperations.set(resourceKey, existing);
    } catch (error) {
      console.error('Error storing operation:', error);
      throw error;
    }
  }

  private async applyToResource(operation: Operation): Promise<boolean> {
    try {
      switch (operation.resourceType) {
        case 'task':
          return this.applyToTask(operation);
        case 'project':
          return this.applyToProject(operation);
        case 'comment':
          return this.applyToComment(operation);
        default:
          return false;
      }
    } catch (error) {
      console.error('Error applying to resource:', error);
      return false;
    }
  }

  private async applyToTask(operation: Operation): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          title: operation.content,
          updated_at: new Date().toISOString()
        })
        .eq('id', operation.resourceId);

      return !error;
    } catch (error) {
      console.error('Error applying to task:', error);
      return false;
    }
  }

  private async applyToProject(operation: Operation): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          name: operation.content,
          updated_at: new Date().toISOString()
        })
        .eq('id', operation.resourceId);

      return !error;
    } catch (error) {
      console.error('Error applying to project:', error);
      return false;
    }
  }

  private async applyToComment(operation: Operation): Promise<boolean> {
    try {
      // Mock implementation - would update comments table in real app
      console.log('Applying comment operation:', operation);
      return true;
    } catch (error) {
      console.error('Error applying to comment:', error);
      return false;
    }
  }

  // Utility methods
  private async createResolution(
    conflictType: string,
    operations: Operation[],
    strategy: string
  ): Promise<ConflictResolution> {
    return {
      id: `resolution_${Date.now()}`,
      conflictType: conflictType as any,
      operations,
      resolvedOperation: operations[0], // Placeholder
      strategy: strategy as any,
      timestamp: Date.now(),
      involvedUsers: [...new Set(operations.map(op => op.userId))]
    };
  }

  // Public API methods
  async handleConcurrentEdit(
    resourceId: string,
    resourceType: string,
    userId: string,
    content: string,
    position: number = 0
  ): Promise<{ success: boolean; resolvedContent?: string; conflicts?: ConflictDetectionResult }> {
    try {
      const operation: Operation = {
        id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'update',
        position,
        content,
        userId,
        timestamp: Date.now(),
        resourceType: resourceType as any,
        resourceId,
        version: await this.getNextVersion(resourceId, resourceType)
      };

      const success = await this.applyOperation(operation);
      return { success };
    } catch (error) {
      console.error('Error handling concurrent edit:', error);
      return { success: false };
    }
  }

  async getConflictHistory(resourceId: string, resourceType: string): Promise<ConflictResolution[]> {
    try {
      // Mock implementation - return empty array for demo
      // In real app this would query a conflict_resolutions table
      return [];
    } catch (error) {
      console.error('Error getting conflict history:', error);
      return [];
    }
  }

  async getOperationHistory(resourceId: string, resourceType: string): Promise<Operation[]> {
    try {
      const resourceKey = `${resourceType}:${resourceId}`;
      return this.pendingOperations.get(resourceKey) || [];
    } catch (error) {
      console.error('Error getting operation history:', error);
      return [];
    }
  }

  // Test methods for demonstration
  async simulateConflict(resourceId: string, resourceType: string): Promise<ConflictDetectionResult> {
    const user1Op: Operation = {
      id: 'op1',
      type: 'update',
      position: 0,
      content: 'User 1 content',
      userId: 'user1',
      timestamp: Date.now(),
      resourceType: resourceType as any,
      resourceId,
      version: 1
    };

    const user2Op: Operation = {
      id: 'op2',
      type: 'update',
      position: 0,
      content: 'User 2 content',
      userId: 'user2',
      timestamp: Date.now() + 100,
      resourceType: resourceType as any,
      resourceId,
      version: 1
    };

    // Add operations to pending
    const resourceKey = `${resourceType}:${resourceId}`;
    this.pendingOperations.set(resourceKey, [user1Op]);

    // Detect conflict with second operation
    return this.detectConflicts(user2Op);
  }

  async clearPendingOperations(resourceId: string, resourceType: string): Promise<void> {
    const resourceKey = `${resourceType}:${resourceId}`;
    this.pendingOperations.delete(resourceKey);
  }

  getPendingOperationsCount(): number {
    let total = 0;
    this.pendingOperations.forEach(ops => total += ops.length);
    return total;
  }

  getVersionVectorsCount(): number {
    return this.versionVectors.size;
  }
}

export const conflictResolutionService = new ConflictResolutionService();
export default conflictResolutionService; 