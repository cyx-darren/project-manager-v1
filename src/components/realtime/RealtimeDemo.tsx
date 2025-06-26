import React, { useState, useEffect } from 'react';
import { useProjectRealtime, useGlobalRealtime } from '../../hooks/useRealtime';
import { collaborationService } from '../../services/collaborationService';
import { projectService } from '../../services/projectService';
import { taskService } from '../../services/taskService';

interface Project {
  id: string;
  title: string;
}

export const RealtimeDemo: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [testMessage, setTestMessage] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);

  // Real-time hooks
  const projectRealtime = useProjectRealtime(selectedProjectId);
  const globalRealtime = useGlobalRealtime();

  // Add log entry
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)]);
  };

  // Load projects on mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await projectService.getProjects();
        const projectsData = response.data || [];
        setProjects(projectsData.slice(0, 10)); // Limit to first 10
        if (projectsData.length > 0) {
          setSelectedProjectId(projectsData[0].id);
        }
        addLog(`Loaded ${projectsData.length} projects`);
      } catch (error) {
        addLog(`Error loading projects: ${error}`);
      }
    };

    loadProjects();
  }, []);

  // Monitor real-time events
  useEffect(() => {
    if (projectRealtime.lastEvent) {
      addLog(`Project Event: ${projectRealtime.lastEvent.type} on ${projectRealtime.lastEvent.table}`);
    }
  }, [projectRealtime.lastEvent]);

  useEffect(() => {
    if (globalRealtime.lastEvent) {
      addLog(`Global Event: ${globalRealtime.lastEvent.type} on ${globalRealtime.lastEvent.table}`);
    }
  }, [globalRealtime.lastEvent]);

  // Test functions
  const testCreateTask = async () => {
    if (!selectedProjectId) {
      addLog('No project selected');
      return;
    }

    try {
      const response = await taskService.createTask({
        title: `Test Task ${Date.now()}`,
        description: 'Real-time test task',
        project_id: selectedProjectId,
        status: 'todo',
        priority: 'medium'
      });
      addLog(`Created task: ${response.data?.title || 'Unknown'}`);
    } catch (error) {
      addLog(`Error creating task: ${error}`);
    }
  };

  const testAddComment = async () => {
    if (!selectedProjectId) {
      addLog('No project selected');
      return;
    }

    try {
      await collaborationService.addComment({
        entity_id: selectedProjectId,
        entity_type: 'project',
        content: testMessage || `Test comment ${Date.now()}`
      });
      addLog(`Added comment to project`);
    } catch (error) {
      addLog(`Error adding comment: ${error}`);
    }
  };

  const testLogActivity = async () => {
    if (!selectedProjectId) {
      addLog('No project selected');
      return;
    }

    try {
      await collaborationService.logActivity({
        project_id: selectedProjectId,
        entity_id: selectedProjectId,
        entity_type: 'project',
        action: 'created',
        details: { message: testMessage || `Test activity ${Date.now()}` }
      });
      addLog(`Logged activity to project`);
    } catch (error) {
      addLog(`Error logging activity: ${error}`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Real-time Demo</h2>
        
        {/* Connection Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Project Real-time Status</h3>
            <div className="space-y-1 text-sm">
              <div>Status: <span className={`font-medium ${projectRealtime.isConnected ? 'text-green-600' : 'text-red-600'}`}>
                {projectRealtime.connectionStatus}
              </span></div>
              <div>Events: {projectRealtime.eventCount}</div>
              <div>Project: {selectedProjectId ? selectedProjectId.slice(0, 8) + '...' : 'None'}</div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Global Real-time Status</h3>
            <div className="space-y-1 text-sm">
              <div>Status: <span className={`font-medium ${globalRealtime.isConnected ? 'text-green-600' : 'text-red-600'}`}>
                {globalRealtime.connectionStatus}
              </span></div>
              <div>Events: {globalRealtime.eventCount}</div>
            </div>
          </div>
        </div>

        {/* Project Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Project for Testing
          </label>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a project...</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
        </div>

        {/* Test Message Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Test Message (optional)
          </label>
          <input
            type="text"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="Enter a test message..."
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Control Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <button
            onClick={() => {
              projectRealtime.subscribe();
              addLog('Subscribed to project real-time');
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Subscribe Project
          </button>
          
          <button
            onClick={() => {
              globalRealtime.subscribe();
              addLog('Subscribed to global real-time');
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Subscribe Global
          </button>
          
          <button
            onClick={() => {
              projectRealtime.unsubscribe();
              globalRealtime.unsubscribe();
              addLog('Unsubscribed from all real-time');
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Unsubscribe All
          </button>
          
          <button
            onClick={() => {
              projectRealtime.reconnect();
              globalRealtime.reconnect();
              addLog('Reconnecting to real-time...');
            }}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
          >
            Reconnect
          </button>
        </div>

        {/* Test Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={testCreateTask}
            disabled={!selectedProjectId}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Create Test Task
          </button>
          
          <button
            onClick={testAddComment}
            disabled={!selectedProjectId}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Add Test Comment
          </button>
          
          <button
            onClick={testLogActivity}
            disabled={!selectedProjectId}
            className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Log Test Activity
          </button>
        </div>

        {/* Event Logs */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800">Real-time Event Logs</h3>
            <button
              onClick={clearLogs}
              className="px-3 py-1 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 transition-colors"
            >
              Clear Logs
            </button>
          </div>
          
          <div className="bg-black text-green-400 p-4 rounded-md font-mono text-sm max-h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">No events logged yet...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-2">Instructions</h4>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>Select a project from the dropdown</li>
            <li>Click "Subscribe Project" to start listening for real-time events</li>
            <li>Click "Subscribe Global" to listen for global events</li>
            <li>Use the test buttons to trigger database changes</li>
            <li>Watch the event logs for real-time updates</li>
            <li>Open multiple browser tabs to test multi-user scenarios</li>
          </ol>
        </div>
      </div>
    </div>
  );
}; 