import React from 'react'
import { Bell, Volume2, VolumeX } from 'lucide-react'
import { notificationService, type NotificationPreferences } from '../../services/notificationService'

interface NotificationPreferencesProps {
  preferences: NotificationPreferences
  onUpdatePreferences: (updates: Partial<NotificationPreferences>) => void
  className?: string
}

export const NotificationPreferencesComponent: React.FC<NotificationPreferencesProps> = ({
  preferences,
  onUpdatePreferences,
  className = ''
}) => {
  const handleToggle = (key: keyof NotificationPreferences) => {
    onUpdatePreferences({ [key]: !preferences[key] })
  }

  const preferenceItems = [
    {
      key: 'taskAssigned' as keyof NotificationPreferences,
      label: 'Task Assignments',
      description: 'When you are assigned to or removed from tasks'
    },
    {
      key: 'taskCompleted' as keyof NotificationPreferences,
      label: 'Task Completions',
      description: 'When tasks you\'re involved with are completed'
    },
    {
      key: 'taskCommented' as keyof NotificationPreferences,
      label: 'New Comments',
      description: 'When someone comments on tasks you\'re involved with'
    },
    {
      key: 'projectInvited' as keyof NotificationPreferences,
      label: 'Project Invitations',
      description: 'When you are invited to join projects'
    },
    {
      key: 'projectJoined' as keyof NotificationPreferences,
      label: 'New Team Members',
      description: 'When new members join your projects'
    },
    {
      key: 'taskStatusChanged' as keyof NotificationPreferences,
      label: 'Task Status Changes',
      description: 'When task statuses are updated'
    },
    {
      key: 'taskDueDateChanged' as keyof NotificationPreferences,
      label: 'Due Date Changes',
      description: 'When task due dates are modified'
    },
    {
      key: 'projectUpdated' as keyof NotificationPreferences,
      label: 'Project Updates',
      description: 'When project details are modified'
    },
    {
      key: 'taskCreated' as keyof NotificationPreferences,
      label: 'New Tasks',
      description: 'When new tasks are created in your projects'
    }
  ]

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <Bell className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Notification Preferences</h3>
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        <div className="border-b border-gray-200 pb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">General Settings</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Show In-App Notifications
                </label>
                <p className="text-xs text-gray-500">
                  Display collaborative notifications within the application
                </p>
              </div>
              <button
                onClick={() => handleToggle('showInApp')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.showInApp
                    ? 'bg-blue-600'
                    : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.showInApp ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {preferences.playSound ? (
                  <Volume2 className="h-4 w-4 text-gray-600" />
                ) : (
                  <VolumeX className="h-4 w-4 text-gray-400" />
                )}
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Sound Notifications
                  </label>
                  <p className="text-xs text-gray-500">
                    Play a sound when receiving notifications
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('playSound')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  preferences.playSound
                    ? 'bg-blue-600'
                    : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.playSound ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Notification Types */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Notification Types</h4>
          <div className="space-y-3">
            {preferenceItems.map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    {item.label}
                  </label>
                  <p className="text-xs text-gray-500">
                    {item.description}
                  </p>
                </div>
                <button
                  onClick={() => handleToggle(item.key)}
                  disabled={!preferences.showInApp}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    preferences[item.key] && preferences.showInApp
                      ? 'bg-blue-600'
                      : 'bg-gray-200'
                  } ${!preferences.showInApp ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      preferences[item.key] && preferences.showInApp ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Helper Text */}
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>💡 Tip:</strong> Notifications will only appear for collaborative activities that involve you 
            (tasks you're assigned to, projects you're a member of, etc.).
          </p>
        </div>
      </div>
    </div>
  )
}

export default NotificationPreferencesComponent 