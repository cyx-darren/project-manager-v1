import React, { useState, useMemo } from 'react'
import { Plus, Search, Filter, CheckCircle, Clock, AlertTriangle, Edit, Trash2 } from 'lucide-react'
import type { Project, Task } from '../../types/supabase'
import { usePermission } from '../../hooks/usePermissions'
import { TaskModal, InlineTaskEdit } from '../tasks'
import { taskService } from '../../services/taskService'

import { useTaskContext } from '../../contexts/TaskContext'

interface ProjectTaskListProps {
  project: Project
  tasks: Task[]
  onTasksUpdate: (tasks: Task[]) => void
  onTaskClick?: (task: Task, mode?: 'view' | 'edit') => void
  onNewTaskClick?: (dueDate?: string) => void
}

export const ProjectTaskList: React.FC<ProjectTaskListProps> = ({
  project,
  tasks: propTasks, // Keep for backward compatibility
  onTasksUpdate,
  onTaskClick,
  onNewTaskClick
}) => {

  const { tasks, deleteTask } = useTaskContext()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all')
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high' | 'urgent'>('all')
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  const canCreateTasks = usePermission('task.create', { projectId: project.id })
  const canEditTasks = usePermission('task.edit', { projectId: project.id })
  const canDeleteTasks = usePermission('task.delete', { projectId: project.id })

  // Filter tasks based on search and filters
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter
    
    return matchesSearch && matchesStatus && matchesPriority
  })

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

  const handleCreateTask = () => {
    if (onNewTaskClick) {
      onNewTaskClick()
    } else {
      // Fallback to modal if URL navigation not available
      setEditingTask(null)
      setIsTaskModalOpen(true)
    }
  }

  const handleEditTask = (task: Task) => {
    if (onTaskClick) {
      onTaskClick(task, 'edit')
    } else {
      // Fallback to modal if URL navigation not available
      setEditingTask(task)
      setIsTaskModalOpen(true)
    }
  }

  const handleTaskCreated = (newTask: Task) => {
    // TaskContext automatically handles task creation
    onTasksUpdate?.([...tasks, newTask]) // For backward compatibility
  }

  const handleTaskUpdated = (updatedTask: Task) => {
    // TaskContext automatically handles task updates
    onTasksUpdate?.(tasks.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    )) // For backward compatibility
  }

  const handleCloseModal = () => {
    setIsTaskModalOpen(false)
    setEditingTask(null)
  }

  const handleTaskDeleted = async (taskId: string) => {
    if (!canDeleteTasks) return
    
    // Use TaskContext for deletion with optimistic updates
    const success = await deleteTask(taskId)
    if (success) {
      setShowDeleteConfirm(null)
      onTasksUpdate?.(tasks.filter(task => task.id !== taskId)) // For backward compatibility
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Task Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tasks</h2>
          <p className="mt-1 text-sm text-gray-500">
            {filteredTasks.length} of {tasks.length} tasks
          </p>
        </div>
        {canCreateTasks && (
          <button 
            onClick={handleCreateTask}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Priority</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        {filteredTasks.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {filteredTasks.map((task) => (
              <li key={task.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {getStatusIcon(task.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        {canEditTasks ? (
                          <div className="flex-1 min-w-0">
                            <InlineTaskEdit 
                              task={task} 
                              onTaskUpdated={handleTaskUpdated}
                            />
                          </div>
                        ) : (
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {task.title}
                          </h3>
                        )}
                        {isOverdue(task.due_date) && task.status !== 'done' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 flex-shrink-0">
                            Overdue
                          </span>
                        )}
                      </div>
                      {task.description && (
                        <p 
                          className="mt-1 text-sm text-gray-500 line-clamp-2 hover:line-clamp-none transition-all duration-200 cursor-help" 
                          title={task.description}
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            wordBreak: 'break-word'
                          }}
                        >
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
                  
                  <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority || 'medium'}
                    </span>
                    {canEditTasks && (
                      <button
                        onClick={() => handleEditTask(task)}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title="Edit task"
                      >
                        <Edit size={14} />
                      </button>
                    )}
                    {canDeleteTasks && (
                      <button
                        onClick={() => setShowDeleteConfirm(task.id)}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete task"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <Filter className="h-12 w-12" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {tasks.length === 0 ? 'No tasks yet' : 'No tasks match your filters'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {tasks.length === 0 
                ? 'Get started by creating your first task.'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
            {canCreateTasks && tasks.length === 0 && (
              <div className="mt-6">
                <button 
                  onClick={handleCreateTask}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Task
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={handleCloseModal}
        onTaskCreated={handleTaskCreated}
        onTaskUpdated={handleTaskUpdated}
        projectId={project.id}
        task={editingTask}
        teamMembers={[]} // TODO: Add real team members when team management is implemented
      />

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
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
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleTaskDeleted(showDeleteConfirm)}
                    className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 