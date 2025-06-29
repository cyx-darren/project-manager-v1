import { useState, useEffect } from 'react';
import { Save, FileText, History, Database, AlertCircle, CheckCircle } from 'lucide-react';
import { VersionHistoryPanel } from '../components/version-history/VersionHistoryPanel';
import { versionHistoryService } from '../services/versionHistoryService';
import { useAuth } from '../contexts/AuthContext';

interface MockEntity {
  id: string;
  type: 'task' | 'project';
  title: string;
  description: string;
  status: string;
  priority?: string;
}

export function VersionHistoryDemo() {
  const { user } = useAuth();
  const [selectedEntity, setSelectedEntity] = useState<MockEntity>({
    id: '550e8400-e29b-41d4-a716-446655440001',
    type: 'task',
    title: 'Sample Task for Version History Demo',
    description: 'This is a demo task to showcase version history and rollback functionality.',
    status: 'in_progress',
    priority: 'high'
  });

  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [versionMessage, setVersionMessage] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Mock entities for testing - using proper UUID format
  const mockEntities: MockEntity[] = [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      type: 'task',
      title: 'Sample Task for Version History Demo',
      description: 'This is a demo task to showcase version history and rollback functionality.',
      status: 'in_progress',
      priority: 'high'
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      type: 'project',
      title: 'Sample Project for Version Testing',
      description: 'This project demonstrates how version history works across different entity types.',
      status: 'active',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      type: 'task',
      title: 'Another Demo Task',
      description: 'Another task to test version history with different content.',
      status: 'todo',
      priority: 'medium'
    }
  ];

  const handleEntityChange = (entity: MockEntity) => {
    setSelectedEntity(entity);
    setFeedback(null);
  };

  const handleFieldChange = (field: keyof MockEntity, value: string) => {
    setSelectedEntity(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const createVersion = async () => {
    if (!user?.id) {
      setFeedback({ type: 'error', message: 'You must be logged in to create versions' });
      return;
    }

    if (!versionMessage.trim()) {
      setFeedback({ type: 'error', message: 'Please enter a version summary' });
      return;
    }

    setIsCreatingVersion(true);
    setFeedback(null);

    try {
      const content = {
        title: selectedEntity.title,
        description: selectedEntity.description,
        status: selectedEntity.status,
        ...(selectedEntity.priority && { priority: selectedEntity.priority })
      };

      await versionHistoryService.createVersion(
        selectedEntity.type,
        selectedEntity.id,
        content,
        versionMessage,
        user.id
      );

      setVersionMessage('');
      setFeedback({ 
        type: 'success', 
        message: `Version created successfully for ${selectedEntity.type} "${selectedEntity.title}"` 
      });
    } catch (error) {
      console.error('Error creating version:', error);
      setFeedback({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Failed to create version' 
      });
    } finally {
      setIsCreatingVersion(false);
    }
  };

  const handleRollback = (versionNumber: number) => {
    setFeedback({ 
      type: 'success', 
      message: `Successfully rolled back to version ${versionNumber}` 
    });
  };

  // Clear feedback after 5 seconds
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <History className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Version History & Rollback Demo</h1>
          </div>
          <p className="text-gray-600 max-w-3xl">
            This demo showcases the version history and rollback functionality. You can create versions, 
            view history, compare changes, and rollback to previous versions.
          </p>
        </div>

        {/* Feedback Messages */}
        {feedback && (
          <div className={`mb-6 p-4 rounded-lg flex items-center ${
            feedback.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {feedback.type === 'success' ? (
              <CheckCircle className="w-5 h-5 mr-2" />
            ) : (
              <AlertCircle className="w-5 h-5 mr-2" />
            )}
            {feedback.message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Entity Editor */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <FileText className="w-6 h-6 text-gray-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Entity Editor</h2>
            </div>

            {/* Entity Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Entity to Edit
              </label>
              <select
                value={selectedEntity.id}
                onChange={(e) => {
                  const entity = mockEntities.find(entity => entity.id === e.target.value);
                  if (entity) handleEntityChange(entity);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {mockEntities.map(entity => (
                  <option key={entity.id} value={entity.id}>
                    {entity.type.toUpperCase()}: {entity.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Entity Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={selectedEntity.title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={selectedEntity.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={selectedEntity.status}
                  onChange={(e) => handleFieldChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {selectedEntity.type === 'task' ? (
                    <>
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="done">Done</option>
                    </>
                  ) : (
                    <>
                      <option value="active">Active</option>
                      <option value="archived">Archived</option>
                      <option value="completed">Completed</option>
                    </>
                  )}
                </select>
              </div>

              {selectedEntity.type === 'task' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={selectedEntity.priority || 'medium'}
                    onChange={(e) => handleFieldChange('priority', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              )}
            </div>

            {/* Version Creation */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create Version</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Version Summary
                  </label>
                  <input
                    type="text"
                    value={versionMessage}
                    onChange={(e) => setVersionMessage(e.target.value)}
                    placeholder="Describe what changed in this version..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={createVersion}
                  disabled={isCreatingVersion || !versionMessage.trim()}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingVersion ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Version...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Version
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Version History Panel */}
          <div>
            <VersionHistoryPanel
              entityType={selectedEntity.type}
              entityId={selectedEntity.id}
              onRollback={handleRollback}
              className="h-fit"
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <Database className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-3">How to Test Version History</h3>
              <ol className="list-decimal list-inside space-y-2 text-blue-800">
                <li>Make changes to the entity fields (title, description, status, etc.)</li>
                <li>Enter a descriptive summary of your changes</li>
                <li>Click "Save Version" to create a new version</li>
                <li>Repeat steps 1-3 to create multiple versions</li>
                <li>Use the Version History panel to:
                  <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                    <li>View all versions and their summaries</li>
                    <li>Compare versions to see what changed</li>
                    <li>Rollback to previous versions</li>
                  </ul>
                </li>
                <li>Switch between different entities to test version history across different types</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 