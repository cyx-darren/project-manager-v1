import React, { useState, useEffect } from 'react'
import { Users, UserPlus, Settings, Mail, Shield, AlertCircle, CheckCircle, Info } from 'lucide-react'
import { UserInvitationForm } from './UserInvitationForm'
import { UserRoleManager } from './UserRoleManager'
import { UserDirectory } from './UserDirectory'
import { InvitationManager } from './InvitationManager'
import { useAuth } from '../../contexts/AuthContext'
import { workspaceService } from '../../services/workspaceService'
import { teamService } from '../../services/teamService'
import type { WorkspaceRole } from '../../types/permissions'
import type { MemberRole } from '../../types/supabase'

interface UserManagementDemoProps {
  className?: string
}

export const UserManagementDemo: React.FC<UserManagementDemoProps> = ({
  className = ''
}) => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'directory' | 'invitations' | 'invite' | 'roles'>('directory')
  const [contextType, setContextType] = useState<'workspace' | 'project'>('project')
  const [contextId, setContextId] = useState('demo-project-1')
  const [userRole, setUserRole] = useState<WorkspaceRole | MemberRole>('admin')
  const [availableContexts, setAvailableContexts] = useState<Array<{ id: string; name: string; type: 'workspace' | 'project' }>>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null)

  useEffect(() => {
    loadAvailableContexts()
  }, [])

  const loadAvailableContexts = async () => {
    try {
      setLoading(true)
      
      // Load available workspaces and projects
      const contexts: Array<{ id: string; name: string; type: 'workspace' | 'project' }> = []
      
      // Add demo contexts for testing
      contexts.push(
        { id: 'demo-workspace-1', name: 'Demo Workspace', type: 'workspace' },
        { id: 'demo-project-1', name: 'Demo Project Alpha', type: 'project' },
        { id: 'demo-project-2', name: 'Demo Project Beta', type: 'project' }
      )
      
      // Try to load real workspaces if available
      try {
        const workspaces = await workspaceService.getUserWorkspaces()
        workspaces.forEach(workspace => {
          contexts.push({
            id: workspace.id,
            name: workspace.name,
            type: 'workspace'
          })
        })
      } catch (err) {
        console.log('Could not load real workspaces, using demo data')
      }
      
      setAvailableContexts(contexts)
    } catch (err) {
      console.error('Error loading contexts:', err)
      setMessage({ type: 'error', text: 'Failed to load available contexts' })
    } finally {
      setLoading(false)
    }
  }

  const handleContextChange = (newContextId: string) => {
    const context = availableContexts.find(c => c.id === newContextId)
    if (context) {
      setContextId(newContextId)
      setContextType(context.type)
      setMessage({ type: 'info', text: `Switched to ${context.type}: ${context.name}` })
    }
  }

  const handleInvitationSent = (email: string, role: string) => {
    setMessage({ type: 'success', text: `Invitation sent to ${email} as ${role}` })
    // Optionally switch to invitations tab to show the new invitation
    setActiveTab('invitations')
  }

  const handleRoleUpdated = (newRole: string) => {
    setMessage({ type: 'success', text: `User role updated to ${newRole}` })
  }

  const tabs = [
    { id: 'directory', label: 'User Directory', icon: Users, description: 'Browse and manage team members' },
    { id: 'invitations', label: 'Invitations', icon: Mail, description: 'Manage pending invitations' },
    { id: 'invite', label: 'Invite Users', icon: UserPlus, description: 'Send new invitations' },
    { id: 'roles', label: 'Role Management', icon: Shield, description: 'Manage user permissions' }
  ] as const

  const getCurrentUserPermissions = () => {
    return {
      canInvite: userRole === 'admin' || userRole === 'owner',
      canManage: userRole === 'admin' || userRole === 'owner',
      canViewAll: true
    }
  }

  const permissions = getCurrentUserPermissions()

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Users className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">User Management Demo</h2>
              <p className="text-sm text-gray-600">Comprehensive user management and invitation system</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Context Selector */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Context:</label>
              <select
                value={contextId}
                onChange={(e) => handleContextChange(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="context-selector"
              >
                {availableContexts.map(context => (
                  <option key={context.id} value={context.id}>
                    {context.name} ({context.type})
                  </option>
                ))}
              </select>
            </div>
            
            {/* Role Selector */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Your Role:</label>
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value as WorkspaceRole | MemberRole)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="role-selector"
              >
                <option value="member">Member</option>
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
              </select>
            </div>
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <div className={`mb-4 p-3 rounded-md flex items-start ${
            message.type === 'success' ? 'bg-green-50 border border-green-200' :
            message.type === 'error' ? 'bg-red-50 border border-red-200' :
            'bg-blue-50 border border-blue-200'
          }`}>
            {message.type === 'success' && <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />}
            {message.type === 'error' && <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />}
            {message.type === 'info' && <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />}
            <div className={`text-sm ${
              message.type === 'success' ? 'text-green-700' :
              message.type === 'error' ? 'text-red-700' :
              'text-blue-700'
            }`}>
              {message.text}
            </div>
            <button
              onClick={() => setMessage(null)}
              className="ml-auto text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              data-testid={`tab-${tab.id}`}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* Permissions Info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Current Permissions</h3>
          <div className="flex items-center space-x-4 text-xs text-gray-600">
            <span className={permissions.canInvite ? 'text-green-600' : 'text-red-600'}>
              {permissions.canInvite ? '✓' : '✗'} Can invite users
            </span>
            <span className={permissions.canManage ? 'text-green-600' : 'text-red-600'}>
              {permissions.canManage ? '✓' : '✗'} Can manage roles
            </span>
            <span className={permissions.canViewAll ? 'text-green-600' : 'text-red-600'}>
              {permissions.canViewAll ? '✓' : '✗'} Can view directory
            </span>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'directory' && (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">User Directory</h3>
              <p className="text-sm text-gray-600">
                Browse and search team members, view their roles and permissions.
              </p>
            </div>
            <UserDirectory
              type={contextType}
              contextId={contextId}
              currentUserRole={userRole}
              canInvite={permissions.canInvite}
              canManage={permissions.canManage}
            />
          </div>
        )}

        {activeTab === 'invitations' && (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Invitation Management</h3>
              <p className="text-sm text-gray-600">
                View and manage pending invitations, resend or revoke as needed.
              </p>
            </div>
            <InvitationManager
              type={contextType}
              contextId={contextId}
              currentUserRole={userRole}
              canManage={permissions.canManage}
            />
          </div>
        )}

        {activeTab === 'invite' && (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Invite New Users</h3>
              <p className="text-sm text-gray-600">
                Send invitations to new team members with appropriate roles and permissions.
              </p>
            </div>
            {permissions.canInvite ? (
              <UserInvitationForm
                type={contextType}
                contextId={contextId}
                userRole={userRole}
                onInvitationSent={handleInvitationSent}
              />
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Permission Required</h3>
                <p className="text-gray-600">
                  You need admin or owner permissions to invite new users.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'roles' && (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Role Management</h3>
              <p className="text-sm text-gray-600">
                Manage user roles and permissions. This demo shows role management for a sample user.
              </p>
            </div>
            {permissions.canManage && user ? (
              <UserRoleManager
                type={contextType}
                contextId={contextId}
                userId={user.id}
                currentUserRole={userRole}
                onRoleUpdated={handleRoleUpdated}
                compact={false}
              />
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Permission Required</h3>
                <p className="text-gray-600">
                  You need admin or owner permissions to manage user roles.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Testing Instructions</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <p>1. <strong>Switch contexts</strong> using the dropdown to test workspace vs project management</p>
          <p>2. <strong>Change your role</strong> to see how permissions affect available actions</p>
          <p>3. <strong>Navigate tabs</strong> to explore different user management features</p>
          <p>4. <strong>Try inviting users</strong> with different roles (admin/owner required)</p>
          <p>5. <strong>Test role management</strong> to see permission-based UI changes</p>
        </div>
      </div>
    </div>
  )
} 