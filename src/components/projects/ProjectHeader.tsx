import React, { useState } from 'react'
import { Pencil, Trash2, Users, Calendar, MoreHorizontal } from 'lucide-react'
import type { Project } from '../../types/supabase'
import { usePermission } from '../../hooks/usePermissions'

interface ProjectHeaderProps {
  project: Project
  onUpdate: (updates: Partial<Project>) => void
  onDelete: () => void
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({
  project,
  onUpdate,
  onDelete
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(project.title)
  const [description, setDescription] = useState(project.description || '')

  const canEdit = usePermission('project.edit', { projectId: project.id })
  const canDelete = usePermission('project.delete', { projectId: project.id })

  const handleTitleSubmit = () => {
    if (title.trim() !== project.title) {
      onUpdate({ title: title.trim() })
    }
    setIsEditing(false)
  }

  const handleDescriptionSubmit = () => {
    if (description !== (project.description || '')) {
      onUpdate({ description: description.trim() || null })
    }
  }

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-blue-100 text-blue-800'
      case 'archived':
        return 'bg-gray-100 text-gray-800'
      case 'template':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          {/* Project Title */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              {isEditing ? (
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleTitleSubmit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleTitleSubmit()
                    if (e.key === 'Escape') {
                      setTitle(project.title)
                      setIsEditing(false)
                    }
                  }}
                  className="text-3xl font-bold text-gray-900 bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                  autoFocus
                />
              ) : (
                <h1 
                  className={`text-3xl font-bold text-gray-900 ${canEdit ? 'cursor-pointer hover:text-gray-700' : ''}`}
                  onClick={() => canEdit && setIsEditing(true)}
                >
                  {project.title}
                </h1>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                {project.status || 'active'}
              </span>

              {canEdit && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </button>
              )}

              {canDelete && (
                <button
                  onClick={onDelete}
                  className="inline-flex items-center px-3 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </button>
              )}

              <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Project Description */}
          <div className="mb-4">
            {canEdit ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleDescriptionSubmit}
                placeholder="Add a project description..."
                className="w-full text-gray-600 bg-transparent border-none outline-none resize-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                rows={description ? Math.max(1, description.split('\n').length) : 1}
              />
            ) : (
              <p 
                className={`text-gray-600 ${canEdit ? 'cursor-pointer hover:text-gray-800' : ''}`}
                onClick={() => canEdit && document.querySelector('textarea')?.focus()}
              >
                {project.description || 'No description provided.'}
              </p>
            )}
          </div>

          {/* Project Metadata */}
          <div className="flex items-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              Created {new Date(project.created_at).toLocaleDateString()}
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              {/* This will be populated when we have member data */}
              Team members
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 