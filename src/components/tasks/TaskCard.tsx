import React, { useState, useEffect } from 'react'
import { Calendar, User, Edit, Trash2 } from 'lucide-react'
import type { Task } from '../../types/supabase'
import { usePermission } from '../../hooks/usePermissions'
import { AssigneeAvatar } from '../common'
import { teamService } from '../../services/teamService'
import { taskService } from '../../services/taskService'
import type { AssignableUser } from '../../services/teamService'
import InlineTaskEdit from './InlineTaskEdit'
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities'

interface TaskCardProps {
  task: Task
  projectId: string
  onTaskUpdated?: (task: Task) => void
  onTaskDeleted?: (taskId: string) => void
  onEditTask?: (task: Task) => void
  isDragOverlay?: boolean
  className?: string
  dragListeners?: SyntheticListenerMap
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  projectId,
  onTaskUpdated,
  onTaskDeleted,
  onEditTask,
  isDragOverlay = false,
  className = '',
  dragListeners
}) => {
  const canEditTasks = usePermission('task.edit', { projectId })
  const canDeleteTasks = usePermission('task.delete', { projectId })
  const [assignee, setAssignee] = useState<AssignableUser | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Load assignee details when task changes
  useEffect(() => {
    const loadAssignee = async () => {
      if (task.assignee_id && projectId) {
        try {
          const { data: assignees } = await teamService.getProjectAssignees(projectId)
          if (assignees) {
            const taskAssignee = assignees.find(user => user.id === task.assignee_id)
            setAssignee(taskAssignee || null)
          }
        } catch (error) {
          console.error('Error loading assignee:', error)
        }
      } else {
        setAssignee(null)
      }
    }

    loadAssignee()
  }, [task.assignee_id, projectId])

  const handleDeleteTask = async () => {
    if (!canDeleteTasks || isDeleting) return
    
    setIsDeleting(true)
    try {
      const result = await taskService.deleteTask(task.id)
      if (result.success) {
        onTaskDeleted?.(task.id)
        setShowDeleteConfirm(false)
      } else {
        alert('Failed to delete task: ' + result.error)
      }
    } catch (error) {
      console.error('Error deleting task:', error)
      alert('Failed to delete task')
    } finally {
      setIsDeleting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'todo':
        return 'To Do'
      case 'in_progress':
        return 'In Progress'
      case 'done':
        return 'Done'
      default:
        return status
    }
  }

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return null
    const date = new Date(dueDate)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays === -1) return 'Yesterday'
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`
    if (diffDays <= 7) return `${diffDays} days`
    
    return date.toLocaleDateString()
  }

  return (
    <div
      className={`
        p-4 space-y-3 bg-white border border-gray-200 rounded-lg shadow-sm
        ${isDragOverlay ? 'shadow-2xl transform rotate-3 scale-105' : 'hover:shadow-md'}
        transition-all duration-200
        ${className}
      `}
    >
      {/* Header with title and action buttons */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0" {...dragListeners}>
          {canEditTasks && !isDragOverlay && onTaskUpdated ? (
            <InlineTaskEdit 
              task={task} 
              onTaskUpdated={onTaskUpdated}
            />
          ) : (
            <h3 className="font-semibold text-base text-gray-900 leading-tight cursor-grab active:cursor-grabbing">
              {task.title}
            </h3>
          )}
        </div>
        
        {/* Action buttons */}
        {!isDragOverlay && (
          <div className="flex items-center gap-1 ml-3 flex-shrink-0">
            {canEditTasks && onEditTask && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEditTask(task)
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title="Edit task"
              >
                <Edit size={14} />
              </button>
            )}
            {canDeleteTasks && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowDeleteConfirm(true)
                }}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Delete task"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Description */}
      {task.description && (
        <div className="text-sm text-gray-600 line-clamp-2 leading-relaxed cursor-grab active:cursor-grabbing" {...dragListeners}>
          {task.description}
        </div>
      )}
      
      {/* Badges row */}
      <div className="flex gap-2 items-center flex-wrap cursor-grab active:cursor-grabbing" {...dragListeners}>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(task.status)}`}>
          {getStatusLabel(task.status)}
        </span>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPriorityColor(task.priority)}`}>
          {task.priority || 'medium'}
        </span>
        {isOverdue(task.due_date) && task.status !== 'done' && (
          <span className="text-xs px-2 py-1 rounded-full font-medium bg-red-100 text-red-800">
            Overdue
          </span>
        )}
      </div>
      
      {/* Footer with date and assignee */}
      <div className="flex justify-between items-center text-xs text-gray-500 cursor-grab active:cursor-grabbing" {...dragListeners}>
        <div className="flex items-center gap-1">
          {task.due_date && (
            <>
              <Calendar size={12} />
              <span className={isOverdue(task.due_date) && task.status !== 'done' ? 'text-red-600 font-medium' : ''}>
                {formatDueDate(task.due_date)}
              </span>
            </>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {assignee ? (
            <div className="flex items-center gap-1">
              <AssigneeAvatar 
                user={assignee} 
                size="xs" 
                showTooltip={true}
              />
               <span className="hidden sm:inline">{assignee.user_metadata?.full_name || assignee.email}</span>
            </div>
          ) : task.assignee_id ? (
            <div className="flex items-center gap-1">
              <User size={12} />
              <span>Assigned</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-gray-400">
              <User size={12} />
              <span>Unassigned</span>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={() => setShowDeleteConfirm(false)}>
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-2">Delete Task</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this task? This action cannot be undone.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-24 mr-2 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteTask}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md w-24 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 