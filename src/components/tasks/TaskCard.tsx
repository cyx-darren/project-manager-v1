import React, { useState, useEffect } from 'react'
import { Calendar, User, Edit, Trash2 } from 'lucide-react'
import type { Task } from '../../types/supabase'
import { usePermission } from '../../hooks/usePermissions'
import { AssigneeAvatar } from '../common'
import { teamService } from '../../services/teamService'
import { useTaskContext } from '../../contexts/TaskContext'
import { useToastContext } from '../../contexts/ToastContext'
import type { AssignableUser } from '../../services/teamService'
import InlineTaskEdit from './InlineTaskEdit'
import { DragHandle } from './DragHandle'
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
  const { showSuccess, showError } = useToastContext()
  const { deleteTask } = useTaskContext()
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
      await deleteTask(task.id)
      onTaskDeleted?.(task.id)
      setShowDeleteConfirm(false)
      // TaskContext handles success/error toasts automatically
    } catch (error) {
      console.error('Error deleting task:', error)
      showError('Delete Failed', 'An unexpected error occurred while deleting the task')
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

  // Handle task card click for URL navigation
  const handleTaskCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on action buttons or drag handles
    if ((e.target as HTMLElement).closest('button') || 
        (e.target as HTMLElement).closest('[data-drag-handle]')) {
      return
    }
    
    // Navigate to task if onEditTask is provided (URL navigation)
    if (onEditTask && !isDragOverlay) {
      e.preventDefault()
      e.stopPropagation()
      onEditTask(task)
    }
  }

  return (
    <div
      className={`
        p-4 space-y-3 bg-white border border-gray-200 rounded-lg shadow-sm
        ${isDragOverlay 
          ? 'shadow-2xl transform rotate-3 scale-110 bg-blue-50 border-blue-300' 
          : 'hover:shadow-lg hover:border-gray-300 hover:-translate-y-1'
        }
        ${onEditTask && !isDragOverlay ? 'cursor-pointer' : ''}
        transition-all duration-300 ease-out
        ${className}
      `}
      onClick={handleTaskCardClick}
    >
      {/* Header with drag handle, title and action buttons */}
      <div className="flex items-start gap-2">
        {/* Drag Handle */}
        <DragHandle 
          listeners={dragListeners}
          disabled={!canEditTasks || isDragOverlay}
          data-drag-handle="true"
        />
        
        {/* Title */}
          <div className="flex-1 min-w-0">
              {canEditTasks && !isDragOverlay && onTaskUpdated ? (
                  <InlineTaskEdit 
                    task={task} 
                    onTaskUpdated={onTaskUpdated}
                  />
              ) : (
            <h3 className="font-semibold text-base text-gray-900 leading-tight">
                  {task.title}
                </h3>
              )}
        </div>
        
        {/* Action buttons */}
        {!isDragOverlay && (
          <div className="flex items-center gap-1 flex-shrink-0">
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
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" 
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div 
            className="relative bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Task</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete this task? This action cannot be undone.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteTask}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50 transition-colors"
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