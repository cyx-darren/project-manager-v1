import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import type { Project, Task } from '../types/supabase'
import { projectService } from '../services'
import LoadingSpinner from '../components/LoadingSpinner'
import { 
  ProjectHeader, 
  ProjectTabs, 
  ProjectOverview, 
  ProjectTaskList,
  ProjectTeam 
} from '../components/projects'
import { CustomKanbanBoard } from '../components/projects/CustomKanbanBoard'
import { CalendarView } from '../components/calendar'
import { TaskModal } from '../components/tasks'
import { useAuth } from '../contexts/AuthContext'
import { useTaskContext } from '../contexts/TaskContext'
import { useProject } from '../contexts/ProjectContext'

type TabType = 'overview' | 'tasks' | 'team' | 'calendar' | 'board'

// Memoized loading fallback component
const TabContentLoader = React.memo(() => (
  <div className="flex items-center justify-center py-8">
    <LoadingSpinner />
  </div>
))

TabContentLoader.displayName = 'TabContentLoader'

// Memoized tab content wrapper
const TabContentWrapper = React.memo<{
  children: React.ReactNode
  className?: string
}>(({ children, className = "px-4 sm:px-6 py-4 sm:py-6 overflow-y-auto" }) => (
  <div className={className}>
    {children}
  </div>
))

TabContentWrapper.displayName = 'TabContentWrapper'

const ProjectDetail: React.FC = () => {
  const { projectId, taskId } = useParams<{ projectId: string; taskId?: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { user } = useAuth() // Used for TaskModal user context
  const { tasks, loading: tasksLoading, loadTasks, clearTasks, getTaskById } = useTaskContext()
  const { setCurrentProject } = useProject()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Task modal state for calendar interactions and URL-driven behavior
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [newTaskDueDate, setNewTaskDueDate] = useState<string | null>(null)
  const [taskModalMode, setTaskModalMode] = useState<'view' | 'edit'>('edit')
  
  // Parse URL parameters for task modal behavior
  const isNewTaskMode = searchParams.get('new') === 'true'
  const urlDueDate = searchParams.get('due_date')
  const urlMode = searchParams.get('mode') as 'view' | 'edit' | null
  
  // Memoize user preference functions
  const getUserPreferredTab = useCallback((projectId: string): TabType => {
    try {
      const saved = localStorage.getItem(`project-${projectId}-preferred-tab`)
      if (saved && ['overview', 'tasks', 'team', 'calendar', 'board'].includes(saved)) {
        return saved as TabType
      }
    } catch (error) {
      console.warn('Failed to get user preferred tab:', error)
    }
    return 'overview'
  }, [])

  const saveUserPreferredTab = useCallback((projectId: string, tab: TabType) => {
    try {
      localStorage.setItem(`project-${projectId}-preferred-tab`, tab)
    } catch (error) {
      console.warn('Failed to save user preferred tab:', error)
    }
  }, [])

  // Memoize URL parsing for task and tab detection
  const parseUrlForTaskAndTab = useCallback(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean)
    
    // Expected patterns:
    // /projects/:projectId/:tab
    // /projects/:projectId/:tab/:taskId
    
    let detectedTab: TabType = 'overview'
    let detectedTaskId: string | null = null
    
    if (pathSegments.length >= 3) {
      const tabSegment = pathSegments[2]
      if (['overview', 'tasks', 'team', 'calendar', 'board'].includes(tabSegment)) {
        detectedTab = tabSegment as TabType
      }
    }
    
    // Check for task ID in URL pattern: /:tab/:taskId
    if (pathSegments.length >= 4) {
      const potentialTaskId = pathSegments[3]
      // Only treat as task ID if it's not 'new' and looks like a UUID or valid ID
      if (potentialTaskId !== 'new' && potentialTaskId.length > 0) {
        detectedTaskId = potentialTaskId
      }
    }
    
    return { tab: detectedTab, taskId: detectedTaskId }
  }, [location.pathname])

  // Memoize initial tab calculation
  const getInitialTab = useCallback((): TabType => {
    const { tab } = parseUrlForTaskAndTab()
    
    if (projectId && tab === 'overview') {
      return getUserPreferredTab(projectId)
    }
    
    return tab
  }, [parseUrlForTaskAndTab, projectId, getUserPreferredTab])

  // Memoize active tab state
  const [activeTab, setActiveTab] = useState<TabType>(() => getInitialTab())

  // Memoize tab change handler with task URL support
  const handleTabChange = useCallback((tab: TabType) => {
    if (!projectId) return
    
    // Save user preference
    saveUserPreferredTab(projectId, tab)
    
    // Update URL - preserve task ID if present
    const { taskId: currentTaskId } = parseUrlForTaskAndTab()
    let newUrl = `/projects/${projectId}/${tab}`
    
    if (currentTaskId) {
      newUrl += `/${currentTaskId}`
      // Preserve query parameters
      const currentSearch = location.search
      if (currentSearch) {
        newUrl += currentSearch
      }
    }
    
    navigate(newUrl, { replace: true })
    
    // Update state
    setActiveTab(tab)
  }, [projectId, navigate, saveUserPreferredTab, parseUrlForTaskAndTab, location.search])

  // Memoize task URL navigation helper
  const navigateToTask = useCallback((taskId: string, mode: 'view' | 'edit' = 'edit') => {
    if (!projectId) return
    
    const searchParams = new URLSearchParams()
    if (mode === 'view') {
      searchParams.set('mode', 'view')
    }
    
    const queryString = searchParams.toString()
    const url = `/projects/${projectId}/${activeTab}/${taskId}${queryString ? `?${queryString}` : ''}`
    
    navigate(url, { replace: false })
  }, [projectId, activeTab, navigate])

  // Memoize new task URL navigation helper
  const navigateToNewTask = useCallback((dueDate?: string) => {
    if (!projectId) return
    
    const searchParams = new URLSearchParams()
    searchParams.set('new', 'true')
    if (dueDate) {
      searchParams.set('due_date', dueDate)
    }
    
    const queryString = searchParams.toString()
    const url = `/projects/${projectId}/${activeTab}/new${queryString ? `?${queryString}` : ''}`
    
    navigate(url, { replace: false })
  }, [projectId, activeTab, navigate])

  // Memoize close task modal navigation helper
  const navigateAwayFromTask = useCallback(() => {
    if (!projectId) return
    
    const url = `/projects/${projectId}/${activeTab}`
    navigate(url, { replace: false })
  }, [projectId, activeTab, navigate])

  // Memoize project update handler
  const handleProjectUpdate = useCallback(async (updates: Partial<Project>) => {
    if (!project || !projectId) return

    try {
      const response = await projectService.updateProject(projectId, updates)
      if (response.success && response.data) {
        setProject(response.data)
      } else {
        throw new Error(response.error || 'Failed to update project')
      }
    } catch (err) {
      console.error('Error updating project:', err)
      setError(err instanceof Error ? err.message : 'Failed to update project')
    }
  }, [project, projectId])

  // Memoize project delete handler
  const handleProjectDelete = useCallback(async () => {
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
  }, [projectId, navigate])

  // Memoize task update handler (kept for backward compatibility)
  const handleTasksUpdate = useCallback((updatedTasks: Task[]) => {
    // No longer needed - TaskContext handles state updates
    // This is kept for backward compatibility with existing components
  }, [])

  // Enhanced task click handler with URL navigation
  const handleTaskClick = useCallback((task: Task, mode: 'view' | 'edit' = 'edit') => {
    navigateToTask(task.id, mode)
  }, [navigateToTask])

  // Enhanced date click handler with URL navigation
  const handleDateClick = useCallback((date: Date) => {
    // Format date for task creation (YYYY-MM-DD format)
    const formattedDate = date.toISOString().split('T')[0]
    navigateToNewTask(formattedDate)
  }, [navigateToNewTask])

  // Enhanced task modal close handler with URL navigation
  const handleTaskModalClose = useCallback(() => {
    navigateAwayFromTask()
  }, [navigateAwayFromTask])

  const handleTaskCreated = useCallback((task: Task) => {
    // TaskContext already handles the task creation and state updates
    // Navigate to the newly created task
    navigateToTask(task.id, 'view')
  }, [navigateToTask])

  const handleTaskUpdated = useCallback((task: Task) => {
    // TaskContext already handles the task updates and state updates
    // This is just for any additional logic needed
    console.log('Task updated from URL modal:', task)
  }, [])

  // Handler for new task creation from components
  const handleNewTaskClick = useCallback((dueDate?: string) => {
    navigateToNewTask(dueDate)
  }, [navigateToNewTask])

  // Memoize filtered tasks for current project
  const projectTasks = useMemo(() => {
    return tasks.filter(task => task.project_id === projectId)
  }, [tasks, projectId])

  // Effect for initial data loading
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

  // Effect for URL-driven task modal behavior
  useEffect(() => {
    const { taskId: urlTaskId } = parseUrlForTaskAndTab()
    
    if (urlTaskId && urlTaskId !== 'new') {
      // Open existing task modal
      const task = getTaskById(urlTaskId)
      if (task) {
        setSelectedTask(task)
        setNewTaskDueDate(null)
        setTaskModalMode(urlMode || 'edit')
        setIsTaskModalOpen(true)
      } else {
        // Task not found, redirect to tab without task
        navigateAwayFromTask()
      }
    } else if (urlTaskId === 'new' && isNewTaskMode) {
      // Open new task modal
      setSelectedTask(null)
      setNewTaskDueDate(urlDueDate)
      setTaskModalMode('edit')
      setIsTaskModalOpen(true)
    } else {
      // No task in URL, close modal
      setIsTaskModalOpen(false)
      setSelectedTask(null)
      setNewTaskDueDate(null)
    }
  }, [location.pathname, location.search, parseUrlForTaskAndTab, getTaskById, urlMode, isNewTaskMode, urlDueDate, navigateAwayFromTask])

  // Cleanup tasks and project context when leaving project
  useEffect(() => {
    return () => {
      clearTasks()
      setCurrentProject(null)
    }
  }, [clearTasks, setCurrentProject])

  // Effect for URL synchronization
  useEffect(() => {
    const newTab = getInitialTab()
    if (newTab !== activeTab) {
      setActiveTab(newTab)
    }
  }, [location.pathname, getInitialTab, activeTab])

  // Effect for handling base project URL redirect
  useEffect(() => {
    if (!projectId) return
    
    const pathSegments = location.pathname.split('/')
    const isBaseProjectUrl = pathSegments.length === 3 && pathSegments[1] === 'projects'
    
    if (isBaseProjectUrl) {
      const preferredTab = getUserPreferredTab(projectId)
      navigate(`/projects/${projectId}/${preferredTab}`, { replace: true })
    }
  }, [location.pathname, projectId, getUserPreferredTab, navigate])

  // Memoize tab content rendering
  const renderTabContent = useCallback(() => {
    if (!project) return null

    const commonProps = {
      project,
      tasks: projectTasks,
      onTasksUpdate: handleTasksUpdate
    }

    switch (activeTab) {
      case 'overview':
        return (
          <TabContentWrapper>
            <ProjectOverview 
              project={project} 
              tasks={projectTasks}
              onProjectUpdate={handleProjectUpdate}
            />
          </TabContentWrapper>
        )
      case 'tasks':
        return (
          <TabContentWrapper>
            <ProjectTaskList 
              {...commonProps}
              onTaskClick={handleTaskClick}
              onNewTaskClick={handleNewTaskClick}
            />
          </TabContentWrapper>
        )
      case 'team':
        return (
          <TabContentWrapper>
            <ProjectTeam 
              project={project}
              onProjectUpdate={handleProjectUpdate}
            />
          </TabContentWrapper>
        )
      case 'calendar':
        return (
          <TabContentWrapper className="px-2 sm:px-6 py-4 sm:py-6 overflow-y-auto">
            <CalendarView 
              project={project}
              tasks={projectTasks}
              onTaskClick={handleTaskClick}
              onDateClick={handleDateClick}
            />
          </TabContentWrapper>
        )
      case 'board':
        return (
          <TabContentWrapper className="flex-1 flex flex-col min-h-0 px-2 sm:px-4">
            <CustomKanbanBoard 
              project={project}
              onTasksUpdate={handleTasksUpdate}
              onTaskClick={handleTaskClick}
            />
          </TabContentWrapper>
        )
      default:
        return null
    }
  }, [activeTab, project, projectTasks, handleProjectUpdate, handleTasksUpdate, handleTaskClick, handleDateClick])

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

  return (
    <div className="min-h-full flex flex-col">
      {/* Project Header - responsive padding */}
      <div className="px-4 sm:px-6 py-3 sm:py-4">
        <ProjectHeader 
          project={project}
          onUpdate={handleProjectUpdate}
          onDelete={handleProjectDelete}
        />
      </div>
      
      {/* Tabs - responsive padding and sticky on mobile */}
      <div className="px-2 sm:px-6 border-b border-gray-200 bg-white sticky top-0 z-10 sm:relative sm:top-auto sm:z-auto">
        <ProjectTabs 
          activeTab={activeTab}
          onTabChange={handleTabChange}
          project={project}
        />
      </div>
      
      {/* Tab content - flexible area with responsive padding */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {renderTabContent()}
      </div>
      
      {/* Task Modal for calendar interactions and URL-driven behavior */}
      {projectId && (
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={handleTaskModalClose}
          onTaskCreated={handleTaskCreated}
          onTaskUpdated={handleTaskUpdated}
          projectId={projectId}
          task={selectedTask}
          initialDueDate={newTaskDueDate}
          mode={taskModalMode}
        />
      )}
    </div>
  )
}

export default React.memo(ProjectDetail) 