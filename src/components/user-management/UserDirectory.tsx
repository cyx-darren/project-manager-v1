import React, { useState, useEffect } from 'react'
import { Search, Users, Filter, UserPlus, MoreVertical, Mail, Shield, Crown, User } from 'lucide-react'
import { workspaceService } from '../../services/workspaceService'
import { teamService } from '../../services/teamService'
import { adminService } from '../../services/adminService'
import { UserRoleManager } from './UserRoleManager'
import { UserInvitationForm } from './UserInvitationForm'
import type { WorkspaceRole } from '../../types/permissions'
import type { MemberRole } from '../../types/supabase'

interface UserDirectoryProps {
  /** Type of context - workspace or project */
  type: 'workspace' | 'project'
  /** ID of the workspace or project */
  contextId: string
  /** Current user's role for permission checking */
  currentUserRole?: WorkspaceRole | MemberRole
  /** Whether the current user can invite users */
  canInvite?: boolean
  /** Whether the current user can manage users */
  canManage?: boolean
}

interface DirectoryUser {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  role: WorkspaceRole | MemberRole
  joined_at: string
  last_active?: string
  status: 'active' | 'invited' | 'inactive'
}

export const UserDirectory: React.FC<UserDirectoryProps> = ({
  type,
  contextId,
  currentUserRole,
  canInvite = false,
  canManage = false
}) => {
  const [users, setUsers] = useState<DirectoryUser[]>([])
  const [filteredUsers, setFilteredUsers] = useState<DirectoryUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')

  useEffect(() => {
    loadUsers()
  }, [contextId, type])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm, roleFilter, statusFilter])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      let loadedUsers: DirectoryUser[] = []

      if (type === 'workspace') {
        const members = await workspaceService.getWorkspaceMembers(contextId)
                 loadedUsers = members.map(member => ({
           id: member.user_id,
           email: member.user?.email || '',
           full_name: member.user?.full_name || undefined,
           avatar_url: member.user?.avatar_url || undefined,
           role: member.role || 'member',
           joined_at: member.joined_at || new Date().toISOString(),
           last_active: undefined,
           status: 'active' as const
         }))
      } else {
        const { data: members } = await teamService.getProjectMembers(contextId)
        if (members) {
          loadedUsers = members.map(member => ({
            id: member.user_id,
            email: member.user?.email || '',
            full_name: member.user?.user_metadata?.full_name || undefined,
            avatar_url: member.user?.user_metadata?.avatar_url || undefined,
            role: member.role,
            joined_at: member.created_at,
            last_active: undefined,
            status: 'active' as const
          }))
        }
      }

      setUsers(loadedUsers)
    } catch (err) {
      console.error('Error loading users:', err)
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = [...users]

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(term) ||
        (user.full_name && user.full_name.toLowerCase().includes(term))
      )
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter)
    }

    setFilteredUsers(filtered)
  }

  const getRoleIcon = (role: WorkspaceRole | MemberRole) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-600" />
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-600" />
      case 'member':
        return <User className="h-4 w-4 text-gray-600" />
      default:
        return <User className="h-4 w-4 text-gray-600" />
    }
  }

  const getRoleColor = (role: WorkspaceRole | MemberRole) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-800'
      case 'admin':
        return 'bg-blue-100 text-blue-800'
      case 'member':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'invited':
        return 'bg-yellow-100 text-yellow-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleUserRoleUpdated = () => {
    loadUsers() // Refresh the user list
  }

  const handleInvitationSent = () => {
    setShowInviteForm(false)
    loadUsers() // Refresh to show any new pending invitations
  }

  const availableRoles = type === 'workspace' 
    ? ['owner', 'admin', 'member'] 
    : ['owner', 'admin', 'member']

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <div className="text-red-600 mb-2">{error}</div>
          <button
            onClick={loadUsers}
            className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Users className="h-5 w-5 text-gray-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">
              {type === 'workspace' ? 'Workspace' : 'Project'} Members
            </h2>
            <span className="ml-2 text-sm text-gray-500">({filteredUsers.length})</span>
          </div>
          
          {canInvite && (
            <button
              onClick={() => setShowInviteForm(true)}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="invite-user-button"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Member
            </button>
          )}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or email..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              data-testid="user-search-input"
            />
          </div>

          {/* Role Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="role-filter-select"
            >
              <option value="all">All Roles</option>
              {availableRoles.map(role => (
                <option key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="status-filter-select"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="invited">Invited</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* User List */}
      <div className="p-6">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No members found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : `No members in this ${type} yet`}
            </p>
            {canInvite && !searchTerm && roleFilter === 'all' && statusFilter === 'all' && (
              <button
                onClick={() => setShowInviteForm(true)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Invite First Member
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                data-testid={`user-${user.id}`}
              >
                <div className="flex items-center space-x-4">
                  {/* Avatar */}
                  <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.full_name || user.email}
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-600">
                        {(user.full_name || user.email)[0].toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {user.full_name || user.email}
                    </div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                    <div className="text-xs text-gray-400">
                      Joined {new Date(user.joined_at).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Role and Status Badges */}
                  <div className="flex items-center space-x-2">
                    <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getRoleColor(user.role)}`}>
                      {getRoleIcon(user.role)}
                      <span className="ml-1 capitalize">{user.role}</span>
                    </div>
                    <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(user.status)}`}>
                      <span className="capitalize">{user.status}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  {canManage && (
                    <UserRoleManager
                      type={type}
                      contextId={contextId}
                      userId={user.id}
                      currentUserRole={currentUserRole}
                      onRoleUpdated={handleUserRoleUpdated}
                      compact
                    />
                  )}
                  
                  <button
                    onClick={() => setSelectedUser(selectedUser === user.id ? null : user.id)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                    data-testid={`user-menu-${user.id}`}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite Form Modal */}
      {showInviteForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <UserInvitationForm
              type={type}
              contextId={contextId}
              userRole={currentUserRole}
              onInvitationSent={handleInvitationSent}
              onCancel={() => setShowInviteForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
} 