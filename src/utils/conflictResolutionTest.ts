import { conflictResolutionService } from '../services/conflictResolutionService';
import type { Operation, ConflictDetectionResult } from '../services/conflictResolutionService';

// Test utilities for conflict resolution
export const runConflictResolutionTests = async (): Promise<void> => {
  console.log('🔄 Starting Conflict Resolution Tests...');
  
  try {
    // Test 1: Basic operation application
    console.log('\n1. Testing basic operation application...');
    const result1 = await conflictResolutionService.handleConcurrentEdit(
      'test-resource-1',
      'task',
      'user1',
      'Initial content'
    );
    console.log(`✅ Basic operation: ${result1.success ? 'Success' : 'Failed'}`);

    // Test 2: Conflict simulation
    console.log('\n2. Testing conflict simulation...');
    const conflict = await conflictResolutionService.simulateConflict('test-resource-1', 'task');
    console.log(`✅ Conflict simulation: ${conflict.hasConflict ? 'Conflict detected' : 'No conflict'}`);
    console.log(`   Conflict type: ${conflict.conflictType}`);
    console.log(`   Operations involved: ${conflict.conflictingOperations?.length || 0}`);

    // Test 3: Conflict resolution
    if (conflict.hasConflict && conflict.suggestedResolution) {
      console.log('\n3. Testing conflict resolution...');
      const resolvedOp = await conflictResolutionService.resolveConflict(conflict.suggestedResolution);
      console.log(`✅ Conflict resolved: ${resolvedOp.id}`);
      console.log(`   Strategy used: ${conflict.suggestedResolution.strategy}`);
    }

    // Test 4: Operational Transformation
    console.log('\n4. Testing Operational Transformation...');
    const op1: Operation = {
      id: 'op1',
      type: 'insert',
      position: 5,
      content: 'Hello',
      userId: 'user1',
      timestamp: Date.now(),
      resourceType: 'task',
      resourceId: 'test-resource-2',
      version: 1
    };

    const op2: Operation = {
      id: 'op2',
      type: 'insert',
      position: 3,
      content: 'World',
      userId: 'user2',
      timestamp: Date.now() + 100,
      resourceType: 'task',
      resourceId: 'test-resource-2',
      version: 1
    };

    const transformedOp = conflictResolutionService.transformOperation(op1, op2);
    console.log(`✅ Operation transformation: Position adjusted from ${op1.position} to ${transformedOp.position}`);

    // Test 5: Version management
    console.log('\n5. Testing version management...');
    const version1 = await conflictResolutionService.updateVersion('test-resource-3', 'project', 'user1');
    const version2 = await conflictResolutionService.updateVersion('test-resource-3', 'project', 'user2');
    console.log(`✅ Version tracking: v${version1.version} -> v${version2.version}`);

    // Test 6: Service statistics
    console.log('\n6. Testing service statistics...');
    const stats = {
      pendingOperations: conflictResolutionService.getPendingOperationsCount(),
      versionVectors: conflictResolutionService.getVersionVectorsCount()
    };
    console.log(`✅ Service stats: ${stats.pendingOperations} pending ops, ${stats.versionVectors} version vectors`);

    // Test 7: Cleanup operations
    console.log('\n7. Testing cleanup operations...');
    await conflictResolutionService.clearPendingOperations('test-resource-1', 'task');
    await conflictResolutionService.clearPendingOperations('test-resource-2', 'task');
    console.log('✅ Cleanup completed');

    console.log('\n🎉 All Conflict Resolution tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Conflict Resolution tests failed:', error);
    throw error;
  }
};

// Test concurrent editing scenarios
export const testConcurrentEditingScenarios = async (): Promise<void> => {
  console.log('🔄 Testing Concurrent Editing Scenarios...');
  
  const resourceId = 'concurrent-test-resource';
  const resourceType = 'task';
  
  try {
    // Scenario 1: Two users editing at the same time
    console.log('\n1. Scenario: Two users editing simultaneously...');
    
    const edit1Promise = conflictResolutionService.handleConcurrentEdit(
      resourceId, resourceType, 'user1', 'User 1 content', 0
    );
    
    const edit2Promise = conflictResolutionService.handleConcurrentEdit(
      resourceId, resourceType, 'user2', 'User 2 content', 0
    );
    
    const [result1, result2] = await Promise.all([edit1Promise, edit2Promise]);
    
    console.log(`✅ User 1 edit: ${result1.success ? 'Success' : 'Failed'}`);
    console.log(`✅ User 2 edit: ${result2.success ? 'Success' : 'Failed'}`);
    
    if (result1.conflicts || result2.conflicts) {
      console.log('⚠️ Conflicts detected during concurrent editing');
    }

    // Scenario 2: Sequential edits with version conflicts
    console.log('\n2. Scenario: Sequential edits with version conflicts...');
    
    // Simulate version mismatch
    const oldVersionOp: Operation = {
      id: 'old-op',
      type: 'update',
      position: 0,
      content: 'Old version content',
      userId: 'user3',
      timestamp: Date.now(),
      resourceType: resourceType as any,
      resourceId,
      version: 1 // Old version
    };
    
    const conflictResult = await conflictResolutionService.detectConflicts(oldVersionOp);
    console.log(`✅ Version conflict detection: ${conflictResult.hasConflict ? 'Detected' : 'None'}`);

    // Scenario 3: Multiple rapid edits
    console.log('\n3. Scenario: Multiple rapid edits...');
    
    const rapidEdits = [
      'Edit 1', 'Edit 2', 'Edit 3', 'Edit 4', 'Edit 5'
    ].map((content, index) => 
      conflictResolutionService.handleConcurrentEdit(
        `rapid-${resourceId}`, resourceType, `user${index % 2 + 1}`, content, index
      )
    );
    
    const rapidResults = await Promise.all(rapidEdits);
    const successCount = rapidResults.filter(r => r.success).length;
    console.log(`✅ Rapid edits: ${successCount}/${rapidResults.length} successful`);

    // Get operation history
    const history = await conflictResolutionService.getOperationHistory(resourceId, resourceType);
    console.log(`✅ Operation history: ${history.length} operations recorded`);

    console.log('\n🎉 Concurrent editing scenarios completed!');
    
  } catch (error) {
    console.error('❌ Concurrent editing tests failed:', error);
    throw error;
  }
};

// Test different resolution strategies
export const testResolutionStrategies = async (): Promise<void> => {
  console.log('🔄 Testing Resolution Strategies...');
  
  try {
    const resourceId = 'strategy-test-resource';
    const resourceType = 'project';
    
    // Create conflicting operations
    const op1: Operation = {
      id: 'strategy-op1',
      type: 'update',
      position: 0,
      content: 'Strategy test content 1',
      userId: 'user1',
      timestamp: Date.now(),
      resourceType: resourceType as any,
      resourceId,
      version: 1
    };
    
    const op2: Operation = {
      id: 'strategy-op2',
      type: 'update',
      position: 0,
      content: 'Strategy test content 2',
      userId: 'user2',
      timestamp: Date.now() + 50,
      resourceType: resourceType as any,
      resourceId,
      version: 1
    };

    // Test Last Write Wins strategy
    console.log('\n1. Testing Last Write Wins strategy...');
    const lwwResolution = {
      id: 'lww-resolution',
      conflictType: 'concurrent_edit' as const,
      operations: [op1, op2],
      resolvedOperation: op2, // Placeholder
      strategy: 'last_write_wins' as const,
      timestamp: Date.now(),
      involvedUsers: ['user1', 'user2']
    };
    
    const lwwResult = await conflictResolutionService.resolveConflict(lwwResolution);
    console.log(`✅ Last Write Wins: Selected operation ${lwwResult.id}`);

    // Test Operational Transform strategy
    console.log('\n2. Testing Operational Transform strategy...');
    const otResolution = {
      id: 'ot-resolution',
      conflictType: 'concurrent_edit' as const,
      operations: [op1, op2],
      resolvedOperation: op1, // Placeholder
      strategy: 'operational_transform' as const,
      timestamp: Date.now(),
      involvedUsers: ['user1', 'user2']
    };
    
    const otResult = await conflictResolutionService.resolveConflict(otResolution);
    console.log(`✅ Operational Transform: Resolved to operation ${otResult.id}`);

    // Test Merge strategy
    console.log('\n3. Testing Merge strategy...');
    const mergeResolution = {
      id: 'merge-resolution',
      conflictType: 'concurrent_edit' as const,
      operations: [op1, op2],
      resolvedOperation: op1, // Placeholder
      strategy: 'merge' as const,
      timestamp: Date.now(),
      involvedUsers: ['user1', 'user2']
    };
    
    const mergeResult = await conflictResolutionService.resolveConflict(mergeResolution);
    console.log(`✅ Merge: Created merged operation ${mergeResult.id}`);
    console.log(`   Merged content: "${mergeResult.content}"`);

    console.log('\n🎉 Resolution strategies testing completed!');
    
  } catch (error) {
    console.error('❌ Resolution strategies tests failed:', error);
    throw error;
  }
};

// Comprehensive test suite
export const runComprehensiveConflictTests = async (): Promise<void> => {
  console.log('🚀 Running Comprehensive Conflict Resolution Tests...');
  
  try {
    await runConflictResolutionTests();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testConcurrentEditingScenarios();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testResolutionStrategies();
    
    console.log('\n🎉 All comprehensive conflict resolution tests completed!');
    
  } catch (error) {
    console.error('❌ Comprehensive tests failed:', error);
    throw error;
  }
}; 