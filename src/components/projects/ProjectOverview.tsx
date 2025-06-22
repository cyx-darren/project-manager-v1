import React from 'react'
import { CheckCircle, Clock, AlertCircle, Users, Calendar, Target } from 'lucide-react'
import type { Project, Task } from '../../types/supabase'

interface ProjectOverviewProps {
  project: Project
  tasks: Task[]
  onProjectUpdate: (updates: Partial<Project>) => void
}

export const ProjectOverview: React.FC<ProjectOverviewProps> = ({
  project,
  tasks,
  onProjectUpdate
}) => {
  // Calculate task statistics
  const taskStats = {
    total: tasks.length,
    completed: tasks.filter(task => task.status === 'done').length,
    inProgress: tasks.filter(task => task.status === 'in_progress').length,
    pending: tasks.filter(task => task.status === 'todo').length,
    overdue: tasks.filter(task => {
      if (!task.due_date) return false
      return new Date(task.due_date) < new Date() && task.status !== 'done'
    }).length
  }

  const completionPercentage = taskStats.total > 0 
    ? Math.round((taskStats.completed / taskStats.total) * 100) 
    : 0

  // Get upcoming tasks (next 7 days)
  const upcomingTasks = tasks
    .filter(task => {
      if (!task.due_date || task.status === 'done') return false
      const dueDate = new Date(task.due_date)
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)
      return dueDate <= nextWeek
    })
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Project Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Tasks
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {taskStats.total}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Completed
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {taskStats.completed}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    In Progress
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {taskStats.inProgress}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Overdue
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {taskStats.overdue}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Project Progress
          </h3>
        </div>
        <div className="px-6 py-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Overall Completion
            </span>
            <span className="text-sm font-medium text-gray-900">
              {completionPercentage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">
                {taskStats.completed}
              </div>
              <div className="text-gray-500">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-yellow-600">
                {taskStats.inProgress}
              </div>
              <div className="text-gray-500">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-600">
                {taskStats.pending}
              </div>
              <div className="text-gray-500">Pending</div>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Tasks */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Upcoming Tasks
          </h3>
        </div>
        <div className="px-6 py-5">
          {upcomingTasks.length > 0 ? (
            <div className="space-y-3">
              {upcomingTasks.map((task) => {
                const isOverdue = task.due_date && new Date(task.due_date) < new Date()
                return (
                  <div 
                    key={task.id} 
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {task.title}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {task.description}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        isOverdue 
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        <Calendar className="h-3 w-3 mr-1" />
                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        task.priority === 'high' ? 'bg-red-100 text-red-800' :
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {task.priority || 'medium'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-6">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No upcoming tasks
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                All tasks are either completed or don't have due dates.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Project Information */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Project Information
          </h3>
        </div>
        <div className="px-6 py-5">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900 capitalize">
                {project.status || 'active'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(project.created_at).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(project.updated_at).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Template</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {project.is_template ? 'Yes' : 'No'}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
} 