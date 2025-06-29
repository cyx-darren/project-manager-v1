// React import not needed with modern JSX transform
import type { EnhancedActivity } from '../../services/activityService'
import { 
  User, 
  FileText, 
  MessageSquare, 
  CheckSquare, 
  UserPlus, 
  Settings,
  Edit3,
  Calendar,
  AlertCircle
} from 'lucide-react'

interface ActivityItemProps {
  activity: EnhancedActivity
}

const getActivityIcon = (action: string, entityType: string) => {
  switch (action) {
    case 'created':
      return <FileText className="w-4 h-4 text-green-600" />
    case 'updated':
    case 'edited':
      return <Edit3 className="w-4 h-4 text-blue-600" />
    case 'completed':
      return <CheckSquare className="w-4 h-4 text-green-600" />
    case 'commented':
      return <MessageSquare className="w-4 h-4 text-purple-600" />
    case 'assigned':
    case 'unassigned':
      return <UserPlus className="w-4 h-4 text-orange-600" />
    case 'due_date_changed':
      return <Calendar className="w-4 h-4 text-yellow-600" />
    case 'status_changed':
      return <Settings className="w-4 h-4 text-gray-600" />
    default:
      if (entityType === 'user' || entityType === 'project_member') {
        return <User className="w-4 h-4 text-blue-600" />
      }
      return <AlertCircle className="w-4 h-4 text-gray-600" />
  }
}

const getEntityTypeLabel = (entityType: string) => {
  switch (entityType) {
    case 'task':
      return 'Task'
    case 'project':
      return 'Project'
    case 'comment':
      return 'Comment'
    case 'project_member':
      return 'Team'
    case 'workspace':
      return 'Workspace'
    case 'attachment':
      return 'File'
    default:
      return entityType.charAt(0).toUpperCase() + entityType.slice(1)
  }
}

export const ActivityItem = ({ activity }: ActivityItemProps) => {
  const {
    user,
    project,
    entity,
    action,
    entity_type,
    timeAgo,
    formattedAction,
    details
  } = activity

  const userName = user?.full_name || user?.email || 'Unknown User'
  const projectName = project?.title || 'Unknown Project'
  const detailsObj = details as any
  const entityName = entity?.title || entity?.name || detailsObj?.task_title || 'Unknown Item'

  return (
    <div className="flex items-start gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
      {/* Avatar */}
      <div className="flex-shrink-0">
        {user?.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={userName}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-gray-600" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Activity Description */}
            <div className="flex items-center gap-2 mb-1">
              {getActivityIcon(action, entity_type)}
              <p className="text-sm text-gray-900">
                <span className="font-medium">{userName}</span>
                {' '}
                <span className="text-gray-600">{formattedAction}</span>
                {entityName && entityName !== 'Unknown Item' && (
                  <>
                    {' in '}
                    <span className="font-medium text-gray-900">{entityName}</span>
                  </>
                )}
              </p>
            </div>

            {/* Project Context */}
            {project && (
              <div className="flex items-center gap-1 mb-2">
                <span className="text-xs text-gray-500">
                  {getEntityTypeLabel(entity_type)} in
                </span>
                <span className="text-xs font-medium text-blue-600">{projectName}</span>
              </div>
            )}

            {/* Additional Details */}
            {detailsObj && (
              <div className="mt-2">
                {detailsObj.new_status && detailsObj.previous_status && (
                  <div className="text-xs text-gray-500">
                    Status changed from{' '}
                    <span className="font-medium capitalize">{detailsObj.previous_status}</span>
                    {' '} to{' '}
                    <span className="font-medium capitalize">{detailsObj.new_status}</span>
                  </div>
                )}
                {detailsObj.assigned_to && (
                  <div className="text-xs text-gray-500">
                    Assigned to user ID: {detailsObj.assigned_to}
                  </div>
                )}
                {detailsObj.content && (
                  <div className="text-xs text-gray-600 mt-1 p-2 bg-gray-50 rounded border">
                    {detailsObj.content.length > 100 
                      ? `${detailsObj.content.substring(0, 100)}...` 
                      : detailsObj.content
                    }
                  </div>
                )}
                {detailsObj.new_due_date && (
                  <div className="text-xs text-gray-500">
                    Due date set to: {new Date(detailsObj.new_due_date).toLocaleDateString()}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Timestamp */}
          <div className="flex-shrink-0 ml-4">
            <span className="text-xs text-gray-400">{timeAgo}</span>
          </div>
        </div>
      </div>
    </div>
  )
} 