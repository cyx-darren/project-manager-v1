import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react'
import { CustomKanbanBoard } from '../components/projects/CustomKanbanBoard'
import { TaskProvider } from '../contexts/TaskContext'
import { projectService } from '../services/projectService'
import type { Project } from '../types/supabase'

const CustomKanbanTest: React.FC = () => {
  const navigate = useNavigate()
  const { projectId } = useParams<{ projectId: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) {
        setError('No project ID provided')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const response = await projectService.getProjectById(projectId)
        if (response.success && response.data) {
          setProject(response.data)
        } else {
          setError(response.error || 'Failed to load project')
        }
      } catch (error) {
        console.error('Error loading project:', error)
        setError('Failed to load project')
      } finally {
        setLoading(false)
      }
    }

    loadProject()
  }, [projectId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg font-medium text-gray-900">Loading project...</p>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Error Loading Project</h2>
          <p className="mt-2 text-gray-600">{error || 'Project not found'}</p>
          <button
            onClick={() => navigate('/projects')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 bg-white shadow-sm border-b">
        <div className="w-full px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/projects')}
                className="inline-flex items-center text-gray-500 hover:text-gray-700 mr-4"
              >
                <ArrowLeft className="h-5 w-5 mr-1" />
                Back
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Custom Kanban Board Test
                </h1>
                <p className="text-sm text-gray-500">
                  Project: {project.title}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-green-700">
                Testing Environment
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Test Instructions */}
      <div className="flex-shrink-0 w-full px-6 py-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-blue-900 mb-2">
            Custom Kanban Board Test Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-blue-800">
            <div>
              <h4 className="font-medium">Column Management:</h4>
              <ul className="mt-1 space-y-1">
                <li>• Create new columns with custom names and colors</li>
                <li>• Edit existing column properties</li>
                <li>• Delete columns (moves tasks to first column)</li>
                <li>• Drag to reorder columns horizontally</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium">Task Management:</h4>
              <ul className="mt-1 space-y-1">
                <li>• Create tasks in specific columns</li>
                <li>• Drag tasks between columns</li>
                <li>• Reorder tasks within columns</li>
                <li>• Edit and delete tasks</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium">Layout Features:</h4>
              <ul className="mt-1 space-y-1">
                <li>• Full-width layout (no max-width constraints)</li>
                <li>• Horizontal scrolling for many columns</li>
                <li>• Fixed column width (~320px)</li>
                <li>• Responsive design</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board - Full Width */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full bg-white">
          <TaskProvider>
            <CustomKanbanBoard
              project={project}
              onTasksUpdate={(tasks) => {
                console.log('Tasks updated:', tasks)
              }}
            />
          </TaskProvider>
        </div>
      </div>
    </div>
  )
}

export default CustomKanbanTest 