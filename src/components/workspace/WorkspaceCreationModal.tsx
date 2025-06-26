import React, { useState } from 'react'
import { useZodForm } from '../../hooks/useZodForm'
import { z } from 'zod'
import { workspaceService } from '../../services/workspaceService'
import { useToast } from '../../hooks/useToast'
import { usePermissions } from '../../hooks/usePermissions'

const workspaceSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  logo_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  settings: z.object({
    allow_public_projects: z.boolean().default(false),
    require_invitation: z.boolean().default(true),
    default_project_visibility: z.enum(['private', 'workspace', 'public']).default('workspace')
  }).default({
    allow_public_projects: false,
    require_invitation: true,
    default_project_visibility: 'workspace'
  })
})

type WorkspaceFormData = z.infer<typeof workspaceSchema>

interface WorkspaceCreationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (workspace: any) => void
}

export const WorkspaceCreationModal: React.FC<WorkspaceCreationModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { showToast } = useToast()
  const { refreshPermissions } = usePermissions()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useZodForm(workspaceSchema)

  // Set default values after form initialization
  React.useEffect(() => {
    reset({
      name: '',
      description: '',
      logo_url: '',
      settings: {
        allow_public_projects: false,
        require_invitation: true,
        default_project_visibility: 'workspace' as const
      }
    })
  }, [])

  const settings = watch('settings')

  const onSubmit = async (data: WorkspaceFormData) => {
    try {
      setIsSubmitting(true)
      
      // Generate slug from name
      const slug = data.name.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()

      const workspaceData = {
        ...data,
        slug,
        logo_url: data.logo_url || undefined
      }

      const workspace = await workspaceService.createWorkspace(workspaceData)
      
      showToast('success', 'Workspace created successfully!')
      
      // Refresh permissions to include new workspace
      await refreshPermissions()
      
      reset()
      onSuccess?.(workspace)
      onClose()
      
    } catch (error) {
      console.error('Failed to create workspace:', error)
      showToast(
        'error',
        error instanceof Error ? error.message : 'Failed to create workspace'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      reset()
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Create New Workspace</h2>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 text-2xl"
              data-testid="close-workspace-modal"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Basic Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Workspace Name *
                </label>
                <input
                  {...register('name')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="My Awesome Workspace"
                  data-testid="workspace-name-input"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600" data-testid="workspace-name-error">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of this workspace..."
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/logo.png"
                  data-testid="workspace-logo-input"
                />
                {errors.logo_url && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.logo_url.message}
                  </p>
                )}
              </div>
            </div>

            {/* Workspace Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Settings</h3>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings?.allow_public_projects || false}
                    onChange={(e) => setValue('settings.allow_public_projects', e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
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
                    type="checkbox"
                    checked={settings?.require_invitation || true}
                    onChange={(e) => setValue('settings.require_invitation', e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
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
                    value={settings?.default_project_visibility || 'workspace'}
                    onChange={(e) => setValue('settings.default_project_visibility', e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    data-testid="default-visibility-select"
                  >
                    <option value="private">Private (only project members)</option>
                    <option value="workspace">Workspace (all workspace members)</option>
                    <option value="public">Public (anyone with link)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                data-testid="cancel-workspace-creation"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                data-testid="create-workspace-button"
              >
                {isSubmitting ? 'Creating...' : 'Create Workspace'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 