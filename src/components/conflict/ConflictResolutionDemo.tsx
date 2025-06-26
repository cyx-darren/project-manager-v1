import React, { useState } from 'react';
import { useConflictResolution } from '../../hooks/useConflictResolution';
import { useAuth } from '../../contexts/AuthContext';

const ConflictResolutionDemo: React.FC = () => {
  const { user } = useAuth();
  const [selectedResource, setSelectedResource] = useState<{
    id: string;
    type: 'task' | 'project' | 'comment';
  }>({
    id: 'test-resource-1',
    type: 'task'
  });
  const [editContent, setEditContent] = useState('');
  const [logs, setLogs] = useState<string[]>([]);

  const {
    conflicts,
    operations,
    isLoading,
    error,
    hasConflicts,
    operationsCount,
    conflictsCount,
    handleConcurrentEdit,
    simulateConflict,
    resolveConflict,
    clearConflicts,
    clearPendingOperations,
    getServiceStats
  } = useConflictResolution({
    resourceId: selectedResource.id,
    resourceType: selectedResource.type,
    userId: user?.id || 'demo-user'
  });

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]);
  };

  const handleEdit = async () => {
    if (!editContent.trim()) {
      addLog('Error: Content cannot be empty');
      return;
    }

    try {
      addLog(`Attempting to edit ${selectedResource.type}: "${editContent}"`);
      const result = await handleConcurrentEdit(editContent);
      
      if (result.success) {
        addLog(`✅ Edit applied successfully`);
        if (result.conflicts) {
          addLog(`⚠️ Conflict detected and resolved`);
        }
      } else {
        addLog(`❌ Edit failed`);
      }
      
      setEditContent('');
    } catch (err) {
      addLog(`❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleSimulateConflict = async () => {
    try {
      addLog('Simulating concurrent edit conflict...');
      const conflict = await simulateConflict();
      
      if (conflict.hasConflict) {
        addLog(`⚠️ Conflict simulated: ${conflict.conflictType}`);
        addLog(`Involved operations: ${conflict.conflictingOperations?.length || 0}`);
      } else {
        addLog('No conflict detected in simulation');
      }
    } catch (err) {
      addLog(`❌ Simulation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleResolveConflict = async (conflictIndex: number) => {
    const conflict = conflicts[conflictIndex];
    if (!conflict?.suggestedResolution) {
      addLog('No resolution available for this conflict');
      return;
    }

    try {
      addLog(`Resolving conflict using ${conflict.suggestedResolution.strategy} strategy...`);
      const resolvedOp = await resolveConflict(conflict.suggestedResolution);
      addLog(`✅ Conflict resolved: ${resolvedOp.id}`);
    } catch (err) {
      addLog(`❌ Resolution failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleClearOperations = async () => {
    try {
      await clearPendingOperations();
      addLog('🧹 Cleared all pending operations');
    } catch (err) {
      addLog(`❌ Clear failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const stats = getServiceStats();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Conflict Resolution Demo</h3>
        
        {/* Resource Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Test Resource
          </label>
          <div className="flex space-x-4">
            <select
              value={selectedResource.id}
              onChange={(e) => setSelectedResource(prev => ({ ...prev, id: e.target.value }))}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="test-resource-1">Test Resource 1</option>
              <option value="test-resource-2">Test Resource 2</option>
              <option value="test-resource-3">Test Resource 3</option>
            </select>
            <select
              value={selectedResource.type}
              onChange={(e) => setSelectedResource(prev => ({ ...prev, type: e.target.value as 'task' | 'project' | 'comment' }))}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="task">Task</option>
              <option value="project">Project</option>
              <option value="comment">Comment</option>
            </select>
          </div>
        </div>

        {/* Status Display */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-blue-50 p-3 rounded">
            <div className="text-sm text-blue-600">Operations</div>
            <div className="text-lg font-semibold text-blue-800">{operationsCount}</div>
          </div>
          <div className="bg-yellow-50 p-3 rounded">
            <div className="text-sm text-yellow-600">Conflicts</div>
            <div className="text-lg font-semibold text-yellow-800">{conflictsCount}</div>
          </div>
          <div className="bg-green-50 p-3 rounded">
            <div className="text-sm text-green-600">Pending Ops</div>
            <div className="text-lg font-semibold text-green-800">{stats.pendingOperationsCount}</div>
          </div>
          <div className="bg-purple-50 p-3 rounded">
            <div className="text-sm text-purple-600">Versions</div>
            <div className="text-lg font-semibold text-purple-800">{stats.versionVectorsCount}</div>
          </div>
        </div>

        {/* Edit Interface */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Edit Content
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Enter content to edit..."
              className="flex-1 border border-gray-300 rounded-md px-3 py-2"
              disabled={isLoading}
            />
            <button
              onClick={handleEdit}
              disabled={isLoading || !editContent.trim()}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              Apply Edit
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={handleSimulateConflict}
            disabled={isLoading}
            className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 disabled:opacity-50"
          >
            Simulate Conflict
          </button>
          <button
            onClick={clearConflicts}
            disabled={isLoading || !hasConflicts}
            className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 disabled:opacity-50"
          >
            Clear Conflicts
          </button>
          <button
            onClick={handleClearOperations}
            disabled={isLoading}
            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 disabled:opacity-50"
          >
            Clear Operations
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <div className="text-red-800">{error}</div>
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="text-blue-600 mb-4">Processing...</div>
        )}

        {/* Active Conflicts */}
        {hasConflicts && (
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-2">Active Conflicts</h4>
            <div className="space-y-2">
              {conflicts.map((conflict, index) => (
                <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-yellow-800">
                        {conflict.conflictType} conflict
                      </div>
                      <div className="text-sm text-yellow-600">
                        {conflict.conflictingOperations?.length || 0} conflicting operations
                      </div>
                      {conflict.suggestedResolution && (
                        <div className="text-sm text-yellow-600">
                          Suggested strategy: {conflict.suggestedResolution.strategy}
                        </div>
                      )}
                    </div>
                    {conflict.suggestedResolution && (
                      <button
                        onClick={() => handleResolveConflict(index)}
                        className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                      >
                        Resolve
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Operations History */}
        {operations.length > 0 && (
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-2">Operations History</h4>
            <div className="bg-gray-50 rounded-md p-3 max-h-32 overflow-y-auto">
              {operations.slice(0, 5).map((op) => (
                <div key={op.id} className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">{op.type}</span> by {op.userId}: "{op.content}" 
                  <span className="text-xs text-gray-500 ml-2">
                    v{op.version} at {new Date(op.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
              {operations.length > 5 && (
                <div className="text-xs text-gray-500">
                  ... and {operations.length - 5} more operations
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Activity Log */}
      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="font-medium text-gray-900 mb-2">Activity Log</h4>
        <div className="bg-gray-900 text-green-400 rounded-md p-3 h-64 overflow-y-auto font-mono text-sm">
          {logs.length === 0 ? (
            <div className="text-gray-500">No activity yet...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">{log}</div>
            ))
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Testing Instructions</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use "Apply Edit" to simulate content changes</li>
          <li>• Click "Simulate Conflict" to test conflict detection</li>
          <li>• Resolve conflicts using the suggested strategies</li>
          <li>• Monitor the operations history and version tracking</li>
          <li>• Test with different resource types and IDs</li>
        </ul>
      </div>
    </div>
  );
};

export default ConflictResolutionDemo; 