import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import type { Project, Task } from '../types/supabase'
import { projectService, taskService } from '../services'
import LoadingSpinner from '../components/LoadingSpinner'
import { 
  ProjectHeader, 
  ProjectTabs, 
  ProjectOverview, 
  ProjectTaskList,
  KanbanTaskBoard,
  ProjectTeam 
} from '../components/projects'
import { useAuth } from '../contexts/AuthContext'
import { useTaskContext } from '../contexts/TaskContext'

type TabType = 'overview' | 'tasks' | 'team' | 'calendar' | 'board'

const ProjectDetail: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { tasks, loading: tasksLoading, loadTasks, clearTasks } = useTaskContext()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('overview')

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
  }, [projectId, navigate, loadTasks])

  // Cleanup tasks when leaving project
  useEffect(() => {
    return () => {
      clearTasks()
    }
  }, [clearTasks])

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
          <ProjectOverview 
            project={project} 
            tasks={tasks}
            onProjectUpdate={handleProjectUpdate}
          />
        )
      case 'tasks':
        return (
          <ProjectTaskList 
            project={project}
            tasks={tasks}
            onTasksUpdate={handleTasksUpdate}
          />
        )
      case 'team':
        return (
          <ProjectTeam 
            project={project}
            onProjectUpdate={handleProjectUpdate}
          />
        )
      case 'calendar':
        return (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Calendar View</h3>
            <p className="text-gray-600">Calendar view coming soon...</p>
          </div>
        )
      case 'board':
        return (
          <div className="p-6">
            <KanbanTaskBoard 
              project={project}
              tasks={tasks}
              onTasksUpdate={handleTasksUpdate}
            />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProjectHeader 
        project={project}
        onUpdate={handleProjectUpdate}
        onDelete={handleProjectDelete}
      />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ProjectTabs 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          project={project}
        />
        
        <div className="mt-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  )
}

export default ProjectDetail 