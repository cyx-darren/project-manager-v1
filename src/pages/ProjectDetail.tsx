import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { Project, Task } from '../types/supabase'
import { projectService } from '../services'
import LoadingSpinner from '../components/LoadingSpinner'
import { 
  ProjectHeader, 
  ProjectTabs, 
  ProjectOverview, 
  ProjectTaskList,
  CustomKanbanBoard,
  ProjectTeam 
} from '../components/projects'
import { CalendarView } from '../components/calendar'
import { TaskModal } from '../components/tasks'
import { useAuth } from '../contexts/AuthContext'
import { useTaskContext } from '../contexts/TaskContext'
import { useProject } from '../contexts/ProjectContext'

type TabType = 'overview' | 'tasks' | 'team' | 'calendar' | 'board'

const ProjectDetail: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth() // Used for TaskModal user context
  const { tasks, loading: tasksLoading, loadTasks, clearTasks } = useTaskContext()
  const { setCurrentProject } = useProject()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  
  // Task modal state for calendar interactions
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [newTaskDueDate, setNewTaskDueDate] = useState<string | null>(null)

  useEffect(() => {
    if (!projectId) {
      navigate('/projects')
      return
    }

    const fetchProjectData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Check if user has access to this project
        const hasAccess = await projectService.hasProjectAccess(projectId)
        if (!hasAccess) {
          navigate('/unauthorized')
          return
        }

        // Fetch project details
        const projectResponse = await projectService.getProjectById(projectId)
        if (projectResponse.success && projectResponse.data) {
          setProject(projectResponse.data)
          // Set current project in ProjectContext for breadcrumb
          setCurrentProject(projectResponse.data)
        } else {
          throw new Error(projectResponse.error || 'Failed to fetch project')
        }

        // Load project tasks using TaskContext
        await loadTasks(projectId)

      } catch (err) {
        console.error('Error fetching project data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load project')
      } finally {
        setLoading(false)
      }
    }

    fetchProjectData()
  }, [projectId, navigate, loadTasks, setCurrentProject])

  // Cleanup tasks and project context when leaving project
  useEffect(() => {
    return () => {
      clearTasks()
      setCurrentProject(null)
    }
  }, [clearTasks, setCurrentProject])

  const handleProjectUpdate = async (updates: Partial<Project>) => {
    if (!project || !projectId) return

    try {
      const response = await projectService.updateProject(projectId, updates)
      if (response.success && response.data) {
        setProject(prev => prev ? { ...prev, ...response.data } : null)
      } else {
        throw new Error(response.error || 'Failed to update project')
      }
    } catch (err) {
      console.error('Error updating project:', err)
      setError(err instanceof Error ? err.message : 'Failed to update project')
    }
  }

  const handleProjectDelete = async () => {
    if (!projectId) return

    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      try {
        const response = await projectService.deleteProject(projectId)
        if (response.success) {
          navigate('/projects')
        } else {
          throw new Error(response.error || 'Failed to delete project')
        }
      } catch (err) {
        console.error('Error deleting project:', err)
        setError(err instanceof Error ? err.message : 'Failed to delete project')
      }
    }
  }

  // Task updates are now handled by TaskContext automatically
  const handleTasksUpdate = (updatedTasks: Task[]) => {
    // No longer needed - TaskContext handles state updates
    // This is kept for backward compatibility with existing components
  }

  // Calendar event handlers
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setNewTaskDueDate(null)
    setIsTaskModalOpen(true)
  }

  const handleDateClick = (date: Date) => {
    // Format date for task creation (YYYY-MM-DD format)
    const formattedDate = date.toISOString().split('T')[0]
    setSelectedTask(null)
    setNewTaskDueDate(formattedDate)
    setIsTaskModalOpen(true)
  }

  const handleTaskModalClose = () => {
    setIsTaskModalOpen(false)
    setSelectedTask(null)
    setNewTaskDueDate(null)
  }

  const handleTaskCreated = (task: Task) => {
    // TaskContext already handles the task creation and state updates
    // This is just for any additional logic needed
    console.log('New task created from calendar:', task)
  }

  const handleTaskUpdated = (task: Task) => {
    // TaskContext already handles the task updates and state updates
    // This is just for any additional logic needed
    console.log('Task updated from calendar:', task)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/projects')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Projects
          </button>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Project Not Found</h2>
          <p className="text-gray-600 mb-4">The project you're looking for doesn't exist or you don't have access to it.</p>
          <button
            onClick={() => navigate('/projects')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Projects
          </button>
        </div>
      </div>
    )
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="px-6 py-6">
            <ProjectOverview 
              project={project} 
              tasks={tasks}
              onProjectUpdate={handleProjectUpdate}
            />
          </div>
        )
      case 'tasks':
        return (
          <div className="px-6 py-6">
            <ProjectTaskList 
              project={project}
              tasks={tasks}
              onTasksUpdate={handleTasksUpdate}
            />
          </div>
        )
      case 'team':
        return (
          <div className="px-6 py-6">
            <ProjectTeam 
              project={project}
              onProjectUpdate={handleProjectUpdate}
            />
          </div>
        )
      case 'calendar':
        return (
          <div className="px-6 py-6">
            <CalendarView 
              project={project}
              tasks={tasks}
              onTaskClick={handleTaskClick}
              onDateClick={handleDateClick}
            />
          </div>
        )
      case 'board':
        return (
          <div className="flex-1 flex flex-col min-h-0">
            <CustomKanbanBoard 
              project={project}
              onTasksUpdate={handleTasksUpdate}
            />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-full flex flex-col">
      {/* Project Header - scrollable content */}
      <div className="px-6 py-4">
        <ProjectHeader 
          project={project}
          onUpdate={handleProjectUpdate}
          onDelete={handleProjectDelete}
        />
      </div>
      
      {/* Tabs - fixed position */}
      <div className="px-6 border-b border-gray-200">
        <ProjectTabs 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          project={project}
        />
      </div>
      
      {/* Tab content - flexible area */}
      <div className="flex-1 flex flex-col min-h-0">
        {renderTabContent()}
      </div>
      
      {/* Task Modal for calendar interactions */}
      {projectId && (
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={handleTaskModalClose}
          onTaskCreated={handleTaskCreated}
          onTaskUpdated={handleTaskUpdated}
          projectId={projectId}
          task={selectedTask}
          initialDueDate={newTaskDueDate}
        />
      )}
    </div>
  )
}

export default ProjectDetail 