import React, { useState, useMemo } from 'react'
import { 
  usePermission, 
  useProjectRole, 
  useUserPermissions, 
  useProjectPermissions,
  usePermissionSummary 
} from '../../hooks/usePermissions'
import PermissionGuard, { 
  ProjectPermissionGuard, 
  RoleGuard, 
  AdminOnly, 
  OwnerOnly 
} from '../auth/PermissionGuard'
import { useAuth } from '../../contexts/AuthContext'
import type { ProjectRole, Permission } from '../../types/permissions'

const PermissionDemo: React.FC = () => {
  const { user } = useAuth()
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [testPermission, setTestPermission] = useState<Permission>('project.view')

  // Memoize the permission context to prevent object recreation
  const permissionContext = useMemo(() => ({
    projectId: selectedProjectId || undefined
  }), [selectedProjectId])

  // Hooks for testing
  const projectRole = useProjectRole(selectedProjectId || undefined)
  const userPermissions = useUserPermissions(selectedProjectId || undefined)
  const projectPermissions = useProjectPermissions(selectedProjectId || undefined)
  const permissionSummary = usePermissionSummary(selectedProjectId || undefined)
  const specificPermission = usePermission(testPermission, permissionContext)

  // Mock project data for demo - memoized to prevent recreation
  const mockProjects = useMemo(() => [
    { id: 'project-1', name: 'Demo Project 1' },
    { id: 'project-2', name: 'Demo Project 2' },
    { id: 'project-3', name: 'Demo Project 3' }
  ], [])

  const allPermissions = useMemo((): Permission[] => [
    'project.view', 'project.edit', 'project.delete',
    'task.view', 'task.create', 'task.edit', 'task.delete',
    'team.view', 'team.invite', 'team.remove',
    'comment.view', 'comment.create', 'comment.edit'
  ], [])

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Permission Management Demo</h1>
        <p className="text-gray-600">
          Test and explore the permission system functionality. Select a project and test different permissions and roles.
        </p>
        
        {user && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Current User:</strong> {user.email} (ID: {user.id})
            </p>
          </div>
        )}
      </div>

      {/* Project Selection */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4">Project Selection</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Project (for testing project-specific permissions)
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">No Project Selected</option>
              {mockProjects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Permission Testing */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4">Permission Testing</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Permission to Test
            </label>
            <select
              value={testPermission}
              onChange={(e) => setTestPermission(e.target.value as Permission)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              {allPermissions.map(permission => (
                <option key={permission} value={permission}>
                  {permission}
                </option>
              ))}
            </select>
          </div>
          
          <div className={`p-3 rounded-lg ${
            specificPermission.hasPermission 
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="font-medium">
              {specificPermission.hasPermission ? '✅ Permission Granted' : '❌ Permission Denied'}
            </div>
            {specificPermission.reason && (
              <div className="text-sm mt-1 text-gray-600">
                Reason: {specificPermission.reason}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Permission Guard Examples */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4">Permission Guard Examples</h2>
        <div className="space-y-6">
          {/* Basic Permission Guard */}
          <div>
            <h3 className="text-lg font-medium mb-2">Basic Permission Guard</h3>
            <div className="border border-gray-200 rounded-lg p-4">
                          <PermissionGuard
              requiredPermission="project.edit"
              projectId={selectedProjectId || undefined}
              fallback={<div className="text-red-600">❌ You need project.edit permission to see this content</div>}
              showReason={true}
            >
                <div className="text-green-600 font-medium">
                  ✅ You have project edit permission! This content is visible.
                </div>
              </PermissionGuard>
            </div>
          </div>

          {/* Role Guard */}
          <div>
            <h3 className="text-lg font-medium mb-2">Role Guard (Admin+)</h3>
            <div className="border border-gray-200 rounded-lg p-4">
                          <RoleGuard
              projectId={selectedProjectId || undefined}
              minimumRole="admin"
              fallback={<div className="text-yellow-600">⚠️ Admin or Owner role required</div>}
              showReason={true}
            >
                <div className="text-green-600 font-medium">
                  ✅ You have admin privileges! This admin content is visible.
                </div>
              </RoleGuard>
            </div>
          </div>

          {/* Owner Only */}
          <div>
            <h3 className="text-lg font-medium mb-2">Owner Only Content</h3>
            <div className="border border-gray-200 rounded-lg p-4">
                          <OwnerOnly
              projectId={selectedProjectId || undefined}
              fallback={<div className="text-red-600">🔒 Owner-only content</div>}
            >
                <div className="text-purple-600 font-medium">
                  👑 You are the project owner! This exclusive content is visible.
                </div>
              </OwnerOnly>
            </div>
          </div>
        </div>
      </div>

      {/* Debug Info */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
        <div className="space-y-2 text-sm">
          <div>Selected Project: {selectedProjectId || 'None'}</div>
          <div>Current Role: {projectRole.role || 'None'}</div>
          <div>Loading: {projectRole.loading ? 'Yes' : 'No'}</div>
          <div>Permission Count: {userPermissions.permissions.length}</div>
        </div>
      </div>
    </div>
  )
}

export default PermissionDemo 