import React, { useState } from 'react';
import CollaborationPanel from '../components/collaboration/CollaborationPanel';
import UserPresenceIndicator from '../components/collaboration/UserPresenceIndicator';
import TypingIndicator from '../components/collaboration/TypingIndicator';
import { usePresence } from '../hooks/usePresence';

const CollaborationDemo: React.FC = () => {
  const [taskTitle, setTaskTitle] = useState('Sample Task Title');
  const [taskDescription, setTaskDescription] = useState('This is a sample task description that can be edited collaboratively.');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);

  // Use presence for the task
  const taskPresence = usePresence({
    entityType: 'task',
    entityId: 'demo-task-1',
    autoSetPresence: true,
    presenceType: 'viewing'
  });

  // Use presence for a project
  const projectPresence = usePresence({
    entityType: 'project',
    entityId: 'demo-project-1',
    autoSetPresence: true,
    presenceType: 'viewing'
  });

  // Handle typing indicators
  const handleTitleFocus = () => {
    setIsEditingTitle(true);
    taskPresence.setPresence('editing');
    taskPresence.updateTyping('title', true);
  };

  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    taskPresence.setPresence('viewing');
    taskPresence.updateTyping('title', false);
  };

  const handleDescriptionFocus = () => {
    setIsEditingDescription(true);
    taskPresence.setPresence('editing');
    taskPresence.updateTyping('description', true);
  };

  const handleDescriptionBlur = () => {
    setIsEditingDescription(false);
    taskPresence.setPresence('viewing');
    taskPresence.updateTyping('description', false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">
                Real-time Collaboration Demo
              </h1>
              <div className="text-sm text-gray-500">
                Subtask 9.15 Implementation
              </div>
            </div>
          </div>

          {/* Demo Content */}
          <div className="p-6 space-y-8">
            {/* Task Collaboration Example */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">
                  Task Collaboration Example
                </h2>
                <CollaborationPanel
                  entityType="task"
                  entityId="demo-task-1"
                  showDetailedView={true}
                  className="ml-4"
                />
              </div>

              {/* Editable Task Title */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Task Title
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    onFocus={handleTitleFocus}
                    onBlur={handleTitleBlur}
                    className={`
                      w-full px-3 py-2 border border-gray-300 rounded-md
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      ${isEditingTitle ? 'ring-2 ring-blue-500 border-blue-500' : ''}
                    `}
                    placeholder="Enter task title..."
                  />
                  {isEditingTitle && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                  )}
                </div>
                <TypingIndicator
                  typingIndicators={taskPresence.typingIndicators}
                  fieldName="title"
                />
              </div>

              {/* Editable Task Description */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Task Description
                </label>
                <div className="relative">
                  <textarea
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    onFocus={handleDescriptionFocus}
                    onBlur={handleDescriptionBlur}
                    rows={4}
                    className={`
                      w-full px-3 py-2 border border-gray-300 rounded-md
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      ${isEditingDescription ? 'ring-2 ring-blue-500 border-blue-500' : ''}
                    `}
                    placeholder="Enter task description..."
                  />
                  {isEditingDescription && (
                    <div className="absolute right-2 top-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                  )}
                </div>
                <TypingIndicator
                  typingIndicators={taskPresence.typingIndicators}
                  fieldName="description"
                />
              </div>

              {/* Presence Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Current Collaboration Status:
                </h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div>
                    <strong>Active Users:</strong> {taskPresence.getUsersCount()}
                  </div>
                  <div>
                    <strong>Currently Editing:</strong> {taskPresence.getActiveEditors().length}
                  </div>
                  <div>
                    <strong>Currently Viewing:</strong> {taskPresence.getActiveViewers().length}
                  </div>
                  <div>
                    <strong>Your Status:</strong> {taskPresence.currentUserPresence?.presence_type || 'Unknown'}
                  </div>
                </div>
              </div>
            </div>

            {/* Project Collaboration Example */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">
                  Project Collaboration Example
                </h2>
                <CollaborationPanel
                  entityType="project"
                  entityId="demo-project-1"
                  showDetailedView={false}
                  className="ml-4"
                />
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="text-base font-medium text-gray-800 mb-2">
                  Project Dashboard
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  This simulates a project view where multiple users can collaborate.
                  The presence indicator shows who is currently viewing or working on this project.
                </p>
                
                <div className="flex items-center justify-between">
                  <UserPresenceIndicator
                    presence={projectPresence.presence}
                    maxVisible={5}
                    size="lg"
                    showTooltip={true}
                  />
                  <div className="text-sm text-gray-500">
                    {projectPresence.getUsersCount()} collaborator{projectPresence.getUsersCount() === 1 ? '' : 's'}
                  </div>
                </div>
              </div>
            </div>

            {/* Features Overview */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Real-time Collaboration Features
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                      👁️
                    </div>
                    <h3 className="font-medium text-blue-900">User Presence</h3>
                  </div>
                  <p className="text-sm text-blue-800">
                    See who is currently viewing or editing content in real-time.
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">
                      ✏️
                    </div>
                    <h3 className="font-medium text-green-900">Editing Indicators</h3>
                  </div>
                  <p className="text-sm text-green-800">
                    Visual indicators show which users are actively editing content.
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white text-sm">
                      ⌨️
                    </div>
                    <h3 className="font-medium text-yellow-900">Typing Indicators</h3>
                  </div>
                  <p className="text-sm text-yellow-800">
                    See when users are typing in specific fields with animated indicators.
                  </p>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-gray-100 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-3">
                How to Test Collaboration Features
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500">1.</span>
                  <span>Click on the input fields above to start editing and see presence indicators change</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500">2.</span>
                  <span>Open this page in multiple browser tabs to simulate multiple users</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500">3.</span>
                  <span>Use the "Show details" button to see expanded collaboration information</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500">4.</span>
                  <span>Toggle between editing and viewing modes using the status buttons</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollaborationDemo; 