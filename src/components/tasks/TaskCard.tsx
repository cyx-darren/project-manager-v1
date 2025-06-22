import React from 'react'
import { CheckCircle, Clock, AlertTriangle, Edit } from 'lucide-react'
import type { Task } from '../../types/supabase'
import { usePermission } from '../../hooks/usePermissions'
import InlineTaskEdit from './InlineTaskEdit'

interface TaskCardProps {
  task: Task
  projectId: string
  onTaskUpdated?: (task: Task) => void
  onEditTask?: (task: Task) => void
  isDragOverlay?: boolean
  className?: string
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  projectId,
  onTaskUpdated,
  onEditTask,
  isDragOverlay = false,
  className = ''
}) => {
  const canEditTasks = usePermission('task.edit', { projectId })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'in_progress':
        return <Clock className="h-5 w-5 text-yellow-600" />
      case 'todo':
        return <AlertTriangle className="h-5 w-5 text-gray-400" />
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800'
      case 'todo':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  return (
    <div
      className={`
        px-6 py-4 bg-white border border-gray-200 rounded-lg shadow-sm
        ${isDragOverlay ? 'shadow-2xl transform rotate-3 scale-105' : 'hover:shadow-md'}
        transition-shadow
        ${className}
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          {getStatusIcon(task.status)}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              {canEditTasks && !isDragOverlay && onTaskUpdated ? (
                <div className="flex-1">
                  <InlineTaskEdit 
                    task={task} 
                    onTaskUpdated={onTaskUpdated}
                  />
                </div>
              ) : (
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {task.title}
                </h3>
              )}
              {isOverdue(task.due_date) && task.status !== 'done' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Overdue
                </span>
              )}
            </div>
            {task.description && (
              <p className="mt-1 text-sm text-gray-500 truncate">
                {task.description}
              </p>
            )}
            <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
              {task.due_date && (
                <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
              )}
              {task.assignee_id && (
                <span>Assigned to: User {task.assignee_id}</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
            {task.status.replace('_', ' ')}
          </span>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
            {task.priority || 'medium'}
          </span>
          {canEditTasks && !isDragOverlay && onEditTask && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEditTask(task)
              }}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              title="Edit task"
            >
              <Edit size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
} 