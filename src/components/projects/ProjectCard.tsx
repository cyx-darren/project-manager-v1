import React from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Users, MoreVertical, Archive, Trash2, Settings } from 'lucide-react'
import type { ProjectWithMembers } from '../../types/supabase'
import { useProjectPermissions } from '../../hooks/usePermissions'
import PermissionGuard from '../auth/PermissionGuard'

interface ProjectCardProps {
  project: ProjectWithMembers
  onArchive?: (projectId: string) => void
  onDelete?: (projectId: string) => void
  onEdit?: (projectId: string) => void
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onArchive,
  onDelete,
  onEdit
}) => {
  const projectPermissions = useProjectPermissions(project.id)
  
  // Get status styling
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'archived':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'template':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Get project color or default
  const projectColor = project.color || '#6366f1'

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Project Header */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            {/* Project Title */}
            <Link 
              to={`/projects/${project.id}`}
              className="text-lg font-semibold text-gray-900 hover:text-indigo-600 transition-colors"
            >
              {project.title}
            </Link>
            
            {/* Project Status */}
            <div className="flex items-center gap-2 mt-2">
              <span 
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyle(project.status || 'active')}`}
              >
                {project.status || 'active'}
              </span>
              
              {project.is_template && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                  Template
                </span>
              )}
            </div>
          </div>

          {/* Project Actions */}
          <PermissionGuard requiredPermission="project.edit" projectId={project.id}>
            <div className="relative group">
              <button 
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Project options"
              >
                <MoreVertical size={16} />
              </button>
              
              {/* Dropdown Menu */}
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                <div className="py-1">
                  <PermissionGuard requiredPermission="project.edit" projectId={project.id}>
                    <button
                      onClick={() => onEdit?.(project.id)}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Settings size={14} />
                      Edit Project
                    </button>
                  </PermissionGuard>
                  
                  <PermissionGuard requiredPermission="project.archive" projectId={project.id}>
                    <button
                      onClick={() => onArchive?.(project.id)}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Archive size={14} />
                      {project.status === 'archived' ? 'Restore' : 'Archive'}
                    </button>
                  </PermissionGuard>
                  
                  <PermissionGuard requiredPermission="project.delete" projectId={project.id}>
                    <button
                      onClick={() => onDelete?.(project.id)}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                      Delete Project
                    </button>
                  </PermissionGuard>
                </div>
              </div>
            </div>
          </PermissionGuard>
        </div>

        {/* Project Description */}
        {project.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {project.description}
          </p>
        )}

        {/* Project Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-500">
          {/* Team Members */}
          <div className="flex items-center gap-1">
            <Users size={14} />
            <span>{project.project_members?.length || 0} members</span>
          </div>

          {/* Created Date */}
          <div className="flex items-center gap-1">
            <Calendar size={14} />
            <span>
              {new Date(project.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Project Color Bar */}
      <div 
        className="h-1 rounded-b-lg"
        style={{ backgroundColor: projectColor }}
      />
    </div>
  )
}

export default ProjectCard 