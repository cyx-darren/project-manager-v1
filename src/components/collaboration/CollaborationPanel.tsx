import React, { useState } from 'react';
import { usePresence } from '../../hooks/usePresence';
import UserPresenceIndicator from './UserPresenceIndicator';
import TypingIndicator from './TypingIndicator';
// import type { EntityPresence } from '../../services/presenceService'; // Unused

interface CollaborationPanelProps {
  entityType: 'task' | 'project' | 'comment';
  entityId: string;
  fieldName?: string;
  showDetailedView?: boolean;
  className?: string;
}

const CollaborationPanel: React.FC<CollaborationPanelProps> = ({
  entityType,
  entityId,
  fieldName,
  showDetailedView = false,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const {
    presence,
    typingIndicators,
    currentUserPresence,
    setPresence,
    removePresence,
    updateTyping,
    isLoading,
    error,
    getUsersCount,
    getActiveEditors,
    getActiveViewers,
    isUserTyping
  } = usePresence({
    entityType,
    entityId,
    autoSetPresence: true,
    presenceType: 'viewing'
  });

  const handlePresenceChange = async (presenceType: 'viewing' | 'editing' | 'commenting') => {
    try {
      await setPresence(presenceType);
    } catch (err) {
      console.error('Failed to set presence:', err);
    }
  };

  const handleStartEditing = () => {
    handlePresenceChange('editing');
  };

  const handleStopEditing = () => {
    handlePresenceChange('viewing');
  };

  const handleStartTyping = (field: string) => {
    if (fieldName && field === fieldName) {
      updateTyping(field, true);
    }
  };

  const handleStopTyping = (field: string) => {
    if (fieldName && field === fieldName) {
      updateTyping(field, false);
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="animate-pulse flex space-x-1">
          <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
          <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
        </div>
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-sm text-red-500 ${className}`}>
        Error: {error}
      </div>
    );
  }

  const activeEditors = getActiveEditors();
  const activeViewers = getActiveViewers();
  const totalUsers = getUsersCount();

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Main presence indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <UserPresenceIndicator 
            presence={presence} 
            maxVisible={3}
            size="md"
            showTooltip={true}
          />
          
          {totalUsers > 0 && (
            <span className="text-sm text-gray-600">
              {totalUsers} user{totalUsers === 1 ? '' : 's'} active
            </span>
          )}
        </div>

        {/* Expand/collapse button for detailed view */}
        {showDetailedView && totalUsers > 0 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            {isExpanded ? 'Hide details' : 'Show details'}
          </button>
        )}
      </div>

      {/* Typing indicators */}
      <TypingIndicator 
        typingIndicators={typingIndicators}
        fieldName={fieldName}
      />

      {/* Detailed collaboration view */}
      {showDetailedView && isExpanded && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
          {/* Current user status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Your status:</span>
            <div className="flex space-x-2">
              <button
                onClick={handleStartEditing}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  currentUserPresence?.presence_type === 'editing'
                    ? 'bg-green-100 text-green-800 border border-green-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                ✏️ Editing
              </button>
              <button
                onClick={handleStopEditing}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  currentUserPresence?.presence_type === 'viewing'
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                👁️ Viewing
              </button>
            </div>
          </div>

          {/* Active editors */}
          {activeEditors.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Currently editing ({activeEditors.length}):
              </h4>
              <div className="space-y-1">
                {activeEditors.map((editor) => (
                  <div key={editor.id} className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>
                      {editor.user?.user_metadata?.full_name || editor.user?.email || 'Unknown'}
                    </span>
                    <span className="text-gray-500 text-xs">
                      since {new Date(editor.last_activity).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active viewers */}
          {activeViewers.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Currently viewing ({activeViewers.length}):
              </h4>
              <div className="space-y-1">
                {activeViewers.map((viewer) => (
                  <div key={viewer.id} className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>
                      {viewer.user?.user_metadata?.full_name || viewer.user?.email || 'Unknown'}
                    </span>
                    <span className="text-gray-500 text-xs">
                      since {new Date(viewer.last_activity).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Typing status */}
          {typingIndicators.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Currently typing:
              </h4>
              <div className="space-y-1">
                {typingIndicators.map((indicator) => (
                  <div key={indicator.id} className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span>
                      {indicator.user?.user_metadata?.full_name || indicator.user?.email || 'Unknown'}
                    </span>
                    <span className="text-gray-500 text-xs">
                      in {indicator.field_name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CollaborationPanel; 