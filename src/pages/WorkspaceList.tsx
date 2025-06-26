import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { workspaceService, type Workspace } from '../services/workspaceService'
import { WorkspaceCreationModal } from '../components/workspace/WorkspaceCreationModal'
import { useToast } from '../hooks/useToast'
import { useAuth } from '../contexts/AuthContext'

export const WorkspaceList: React.FC = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const { showToast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    loadWorkspaces()
  }, [])

  const loadWorkspaces = async () => {
    try {
      setLoading(true)
      const userWorkspaces = await workspaceService.getUserWorkspaces()
      setWorkspaces(userWorkspaces)
    } catch (error) {
      console.error('Failed to load workspaces:', error)
      showToast('error', 'Failed to load workspaces')
    } finally {
      setLoading(false)
    }
  }

  const handleWorkspaceCreated = (workspace: Workspace) => {
    setWorkspaces(prev => [...prev, workspace])
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workspaces</h1>
          <p className="text-gray-500 mt-1">
            Manage your workspaces and collaboration settings
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          data-testid="create-workspace-button"
        >
          Create Workspace
        </button>
      </div>

      {workspaces.length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
              <svg fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No workspaces yet
            </h3>
            <p className="text-gray-500 mb-6">
              Get started by creating your first workspace to organize your projects and collaborate with your team.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              data-testid="create-first-workspace-button"
            >
              Create Your First Workspace
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map((workspace) => (
            <div
              key={workspace.id}
              className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow"
              data-testid={`workspace-${workspace.id}`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {workspace.logo_url ? (
                      <img
                        src={workspace.logo_url}
                        alt={workspace.name}
                        className="w-10 h-10 rounded-lg"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-lg">
                          {workspace.name[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {workspace.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {workspace.subscription_tier}
                      </p>
                    </div>
                  </div>
                </div>

                {workspace.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {workspace.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>Created {workspace.created_at ? new Date(workspace.created_at).toLocaleDateString() : 'Unknown'}</span>
                </div>

                <div className="flex space-x-2">
                  <Link
                    to={`/workspaces/${workspace.id}/settings`}
                    className="flex-1 px-3 py-2 text-sm font-medium text-center text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    data-testid={`workspace-settings-${workspace.id}`}
                  >
                    Settings
                  </Link>
                  <Link
                    to={`/projects?workspace=${workspace.id}`}
                    className="flex-1 px-3 py-2 text-sm font-medium text-center text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    data-testid={`workspace-projects-${workspace.id}`}
                  >
                    Projects
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <WorkspaceCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleWorkspaceCreated}
      />
    </div>
  )
} 