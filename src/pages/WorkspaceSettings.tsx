import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { workspaceService, type Workspace } from '../services/workspaceService'
import { WorkspaceMemberManagement } from '../components/workspace/WorkspaceMemberManagement'
import { type WorkspaceRole } from '../types/permissions'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../hooks/useToast'
import { useZodForm } from '../hooks/useZodForm'
import { z } from 'zod'

const workspaceUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  logo_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  settings: z.object({
    allow_public_projects: z.boolean(),
    require_invitation: z.boolean(),
    default_project_visibility: z.enum(['private', 'workspace', 'public'])
  })
})

type WorkspaceUpdateData = z.infer<typeof workspaceUpdateSchema>

export const WorkspaceSettings: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showToast } = useToast()

  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [userRole, setUserRole] = useState<WorkspaceRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'general' | 'members' | 'advanced'>('general')
  const [isUpdating, setIsUpdating] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch
  } = useZodForm(workspaceUpdateSchema)

  useEffect(() => {
    if (workspaceId) {
      loadWorkspaceData()
    }
  }, [workspaceId])

  const loadWorkspaceData = async () => {
    if (!workspaceId) return

    try {
      setLoading(true)
      const [workspaceData, role] = await Promise.all([
        workspaceService.getWorkspace(workspaceId),
        workspaceService.getUserRole(workspaceId)
      ])

      if (!workspaceData) {
        showToast('error', 'Workspace not found')
        navigate('/workspaces')
        return
      }

      if (!role) {
        showToast('error', 'You do not have access to this workspace')
        navigate('/workspaces')
        return
      }

      setWorkspace(workspaceData)
      setUserRole(role)

      // Reset form with workspace data
      reset({
        name: workspaceData.name,
        description: workspaceData.description || '',
        logo_url: workspaceData.logo_url || '',
        settings: workspaceData.settings || {
          allow_public_projects: false,
          require_invitation: true,
          default_project_visibility: 'workspace'
        }
      })
    } catch (error) {
      console.error('Failed to load workspace:', error)
      showToast('error', 'Failed to load workspace data')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: WorkspaceUpdateData) => {
    if (!workspaceId || !workspace) return

    try {
      setIsUpdating(true)
      const updatedWorkspace = await workspaceService.updateWorkspace(workspaceId, {
        name: data.name,
        description: data.description,
        logo_url: data.logo_url || undefined,
        settings: data.settings
      })

      setWorkspace(updatedWorkspace)
      showToast('success', 'Workspace updated successfully')
      reset(data) // Reset form dirty state
    } catch (error) {
      console.error('Failed to update workspace:', error)
      showToast('error', 'Failed to update workspace')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteWorkspace = async () => {
    if (!workspaceId || !workspace) return

    try {
      await workspaceService.deleteWorkspace(workspaceId)
      showToast('success', 'Workspace deleted successfully')
      navigate('/workspaces')
    } catch (error) {
      console.error('Failed to delete workspace:', error)
      showToast('error', 'Failed to delete workspace')
    }
  }

  const canEdit = userRole === 'owner' || userRole === 'admin'
  const canDelete = userRole === 'owner'

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="space-y-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!workspace || !userRole) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-8 text-gray-500">
          Workspace not found or access denied.
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" data-testid="workspace-name">
              {workspace.name}
            </h1>
            <p className="text-gray-500 mt-1">
              Workspace Settings
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-500">
              Your role: <span className="font-medium capitalize">{userRole}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {['general', 'members', 'advanced'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              data-testid={`${tab}-tab`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Basic Information
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Workspace Name *
                  </label>
                  <input
                    {...register('name')}
                    type="text"
                    disabled={!canEdit}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    data-testid="workspace-name-input"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    disabled={!canEdit}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    data-testid="workspace-description-input"
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo URL
                  </label>
                  <input
                    {...register('logo_url')}
                    type="url"
                    disabled={!canEdit}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    data-testid="workspace-logo-input"
                  />
                  {errors.logo_url && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.logo_url.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Workspace Settings
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    {...register('settings.allow_public_projects')}
                    type="checkbox"
                    disabled={!canEdit}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                    data-testid="allow-public-projects-checkbox"
                  />
                  <div className="ml-3">
                    <label className="text-sm font-medium text-gray-700">
                      Allow Public Projects
                    </label>
                    <p className="text-sm text-gray-500">
                      Members can create projects visible to everyone
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    {...register('settings.require_invitation')}
                    type="checkbox"
                    disabled={!canEdit}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                    data-testid="require-invitation-checkbox"
                  />
                  <div className="ml-3">
                    <label className="text-sm font-medium text-gray-700">
                      Require Invitation
                    </label>
                    <p className="text-sm text-gray-500">
                      Users must be invited to join this workspace
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Project Visibility
                  </label>
                  <select
                    {...register('settings.default_project_visibility')}
                    disabled={!canEdit}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    data-testid="default-visibility-select"
                  >
                    <option value="private">Private (only project members)</option>
                    <option value="workspace">Workspace (all workspace members)</option>
                    <option value="public">Public (anyone with link)</option>
                  </select>
                </div>
              </div>
            </div>

            {canEdit && (
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!isDirty || isUpdating}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  data-testid="save-workspace-button"
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {activeTab === 'members' && userRole && (
        <WorkspaceMemberManagement workspaceId={workspaceId!} userRole={userRole} />
      )}

      {activeTab === 'advanced' && (
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Advanced Settings
            </h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Workspace ID</h4>
                <div className="flex items-center space-x-2">
                  <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                    {workspaceId}
                  </code>
                  <button
                    onClick={() => navigator.clipboard.writeText(workspaceId!)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Created</h4>
                <p className="text-sm text-gray-600">
                  {new Date(workspace.created_at).toLocaleDateString()}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Subscription</h4>
                <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                  {workspace.subscription_tier}
                </span>
              </div>
            </div>
          </div>

          {canDelete && (
            <div className="bg-white shadow rounded-lg p-6 border-l-4 border-red-400">
              <h3 className="text-lg font-medium text-red-900 mb-4">
                Danger Zone
              </h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-red-800 mb-2">
                    Delete Workspace
                  </h4>
                  <p className="text-sm text-red-600 mb-4">
                    This action cannot be undone. All projects, tasks, and data will be permanently deleted.
                  </p>
                  
                  {showDeleteConfirm ? (
                    <div className="space-y-3">
                      <p className="text-sm text-red-600 font-medium">
                        Are you absolutely sure? This will permanently delete the workspace "{workspace.name}" and all its data.
                      </p>
                      <div className="flex space-x-3">
                        <button
                          onClick={handleDeleteWorkspace}
                          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                          data-testid="confirm-delete-workspace"
                        >
                          Yes, Delete Workspace
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200"
                      data-testid="delete-workspace-button"
                    >
                      Delete Workspace
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 