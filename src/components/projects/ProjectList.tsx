import React, { useState, useEffect, useMemo } from 'react'
import { Plus, Folder, AlertCircle } from 'lucide-react'
import ProjectCard from './ProjectCard'
import ProjectFiltersComponent, { type ProjectFilters } from './ProjectFilters'
import CreateProjectModal from './CreateProjectModal'
import LoadingSpinner from '../LoadingSpinner'
import LoadingSkeleton from '../LoadingSkeleton'
import PermissionGuard from '../auth/PermissionGuard'
import { projectService } from '../../services'
import type { ProjectWithMembers } from '../../types/supabase'

const ProjectList: React.FC = () => {
  const [projects, setProjects] = useState<ProjectWithMembers[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [filters, setFilters] = useState<ProjectFilters>({
    search: '',
    status: 'all',
    sortBy: 'created',
    sortOrder: 'desc'
  })

  // Fetch projects
  const fetchProjects = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await projectService.getProjects()
      if (response.success && response.data) {
        setProjects(response.data as ProjectWithMembers[])
      } else {
        setError(response.error || 'Failed to load projects')
      }
    } catch (err) {
      console.error('Error fetching projects:', err)
      setError('Failed to load projects')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let filtered = projects

    // Apply search filter
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(project => 
        project.title.toLowerCase().includes(searchTerm) ||
        (project.description && project.description.toLowerCase().includes(searchTerm))
      )
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(project => {
        const status = project.status || 'active'
        return status === filters.status
      })
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (filters.sortBy) {
        case 'name':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case 'created':
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
          break
        case 'updated':
          aValue = new Date(a.updated_at).getTime()
          bValue = new Date(b.updated_at).getTime()
          break
        default:
          return 0
      }

      if (filters.sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered
  }, [projects, filters])

  // Handle project actions
  const handleProjectCreated = (newProject: ProjectWithMembers) => {
    setProjects(prev => [newProject, ...prev])
    setIsCreateModalOpen(false)
  }

  const handleArchiveProject = async (projectId: string) => {
    try {
      const project = projects.find(p => p.id === projectId)
      if (!project) return

      const isArchived = project.status === 'archived'
      const response = isArchived 
        ? await projectService.restoreProject(projectId)
        : await projectService.archiveProject(projectId)

      if (response.success && response.data) {
        setProjects(prev => 
          prev.map(p => p.id === projectId ? { ...p, ...response.data } : p)
        )
      }
    } catch (error) {
      console.error('Error toggling project archive status:', error)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return
    }

    try {
      const response = await projectService.deleteProject(projectId)
      if (response.success) {
        setProjects(prev => prev.filter(p => p.id !== projectId))
      }
    } catch (error) {
      console.error('Error deleting project:', error)
    }
  }

  const handleEditProject = (projectId: string) => {
    // TODO: Implement edit functionality in future subtask
    console.log('Edit project:', projectId)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Skeleton */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <LoadingSkeleton className="h-8 w-48 mb-2" />
            <LoadingSkeleton className="h-4 w-96" />
          </div>
        </div>

        {/* Filters Skeleton */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex gap-4">
              <LoadingSkeleton className="h-10 w-80" />
              <LoadingSkeleton className="h-10 w-32" />
              <LoadingSkeleton className="h-10 w-40" />
            </div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <LoadingSkeleton key={i} className="h-48 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Projects</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchProjects}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
              <p className="text-gray-600 mt-1">
                Manage and organize your work across different projects
              </p>
            </div>
            
            <PermissionGuard requiredPermission="workspace.create_projects">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus size={16} />
                New Project
              </button>
            </PermissionGuard>
          </div>
        </div>
      </div>

      {/* Filters */}
      <ProjectFiltersComponent
        filters={filters}
        onFiltersChange={setFilters}
        projectCount={projects.length}
      />

      {/* Project Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            <Folder className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {projects.length === 0 ? 'No projects yet' : 'No projects match your filters'}
            </h3>
            <p className="text-gray-600 mb-6">
              {projects.length === 0 
                ? 'Get started by creating your first project'
                : 'Try adjusting your search or filter criteria'
              }
            </p>
            {projects.length === 0 && (
              <PermissionGuard requiredPermission="workspace.create_projects">
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex items-center gap-2 mx-auto px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Plus size={16} />
                  Create Your First Project
                </button>
              </PermissionGuard>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onArchive={handleArchiveProject}
                onDelete={handleDeleteProject}
                onEdit={handleEditProject}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  )
}

export default ProjectList 