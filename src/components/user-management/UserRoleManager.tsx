import React, { useState, useEffect } from 'react'
import { Shield, Crown, User, Settings, AlertTriangle, Check, X } from 'lucide-react'
import { teamService } from '../../services/teamService'
import { workspaceService } from '../../services/workspaceService'
import { permissionService } from '../../services/permissionService'
import { useAuth } from '../../contexts/AuthContext'
import type { MemberRole } from '../../types/supabase'
import type { WorkspaceRole, Permission } from '../../types/permissions'

interface UserRoleManagerProps {
  /** Type of context - workspace or project */
  type: 'workspace' | 'project'
  /** ID of the workspace or project */
  contextId: string
  /** User ID whose role to manage */
  userId: string
  /** Current user's role for permission checking */
  currentUserRole?: WorkspaceRole | MemberRole
  /** Callback when role is updated */
  onRoleUpdated?: (newRole: string) => void
  /** Whether to show in compact mode */
  compact?: boolean
}

interface UserWithRole {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  role: WorkspaceRole | MemberRole
  permissions: Permission[]
  joined_at: string
  last_active?: string
}

export const UserRoleManager: React.FC<UserRoleManagerProps> = ({
  type,
  contextId,
  userId,
  currentUserRole,
  onRoleUpdated,
  compact = false
}) => {
  const { user: currentUser } = useAuth()
  const [userDetails, setUserDetails] = useState<UserWithRole | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [pendingRole, setPendingRole] = useState<WorkspaceRole | MemberRole | null>(null)

  useEffect(() => {
    loadUserDetails()
  }, [userId, contextId, type])

  const loadUserDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      if (type === 'workspace') {
        // Load workspace member details
        const members = await workspaceService.getWorkspaceMembers(contextId)
        const member = members.find(m => m.user_id === userId)
        
        if (member) {
          const permissions = await permissionService.getUserPermissions(userId, { workspaceId: contextId })
          setUserDetails({
            id: member.user_id,
            email: member.user?.email || '',
            full_name: member.user?.full_name || undefined,
            avatar_url: member.user?.avatar_url || undefined,
            role: member.role || 'member',
            permissions,
            joined_at: member.joined_at || new Date().toISOString(),
            last_active: undefined
          })
        }
      } else {
        // Load project member details
        const { data: members } = await teamService.getProjectMembers(contextId)
        const member = members?.find(m => m.user_id === userId)
        
        if (member) {
          const permissions = await permissionService.getUserPermissions(userId, { projectId: contextId })
          setUserDetails({
            id: member.user_id,
            email: member.user?.email || '',
            full_name: member.user?.user_metadata?.full_name,
            avatar_url: member.user?.user_metadata?.avatar_url,
            role: member.role,
            permissions,
            joined_at: member.created_at,
            last_active: undefined
          })
        }
      }
    } catch (err) {
      console.error('Error loading user details:', err)
      setError('Failed to load user details')
    } finally {
      setLoading(false)
    }
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
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'member':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getAvailableRoles = () => {
    const canManageRoles = currentUserRole === 'owner' || currentUserRole === 'admin'
    if (!canManageRoles) return []

    if (type === 'workspace') {
      const roles: { value: WorkspaceRole; label: string; description: string }[] = [
        { value: 'member', label: 'Member', description: 'Can view and create projects' },
        { value: 'admin', label: 'Admin', description: 'Can manage workspace and members' }
      ]
      
      // Only owners can assign/modify owner role
      if (currentUserRole === 'owner') {
        roles.push({ value: 'owner', label: 'Owner', description: 'Full workspace control' })
      }
      
      return roles
    } else {
      const roles: { value: MemberRole; label: string; description: string }[] = [
        { value: 'member', label: 'Member', description: 'Can view and contribute to project' },
        { value: 'admin', label: 'Admin', description: 'Can manage project and team members' }
      ]
      
      // Only owners can assign/modify owner role
      if (currentUserRole === 'owner') {
        roles.push({ value: 'owner', label: 'Owner', description: 'Full project control' })
      }
      
      return roles
    }
  }

  const canModifyRole = () => {
    if (!userDetails || !currentUser) return false
    
    // Can't modify own role
    if (userDetails.id === currentUser.id) return false
    
    // Only owners and admins can modify roles
    if (currentUserRole !== 'owner' && currentUserRole !== 'admin') return false
    
    // Only owners can modify other owners
    if (userDetails.role === 'owner' && currentUserRole !== 'owner') return false
    
    return true
  }

  const handleRoleChange = (newRole: WorkspaceRole | MemberRole) => {
    setPendingRole(newRole)
    setShowConfirmation(true)
  }

  const confirmRoleChange = async () => {
    if (!pendingRole || !userDetails) return

    try {
      setUpdating(true)
      setError(null)

      if (type === 'workspace') {
        await workspaceService.updateMemberRole(contextId, userId, pendingRole as WorkspaceRole)
      } else {
        await teamService.updateMemberRole(contextId, userId, pendingRole as MemberRole)
      }

      // Update local state
      setUserDetails(prev => prev ? { ...prev, role: pendingRole } : null)
      onRoleUpdated?.(pendingRole)
      setShowConfirmation(false)
      setPendingRole(null)
    } catch (err) {
      console.error('Error updating role:', err)
      setError('Failed to update user role')
    } finally {
      setUpdating(false)
    }
  }

  const cancelRoleChange = () => {
    setShowConfirmation(false)
    setPendingRole(null)
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    )
  }

  if (error || !userDetails) {
    return (
      <div className="text-sm text-red-600 flex items-center">
        <AlertTriangle className="h-4 w-4 mr-1" />
        {error || 'User not found'}
      </div>
    )
  }

  const availableRoles = getAvailableRoles()
  const canModify = canModifyRole()

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getRoleColor(userDetails.role)}`}>
          {getRoleIcon(userDetails.role)}
          <span className="ml-1 capitalize">{userDetails.role}</span>
        </div>
        
        {canModify && availableRoles.length > 0 && (
          <select
            value={userDetails.role}
            onChange={(e) => handleRoleChange(e.target.value as WorkspaceRole | MemberRole)}
            className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
            data-testid={`role-select-${userId}`}
          >
            {availableRoles.map(role => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* User Info Header */}
      <div className="flex items-center space-x-3 mb-4">
        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
          {userDetails.avatar_url ? (
            <img
              src={userDetails.avatar_url}
              alt={userDetails.full_name || userDetails.email}
              className="h-10 w-10 rounded-full"
            />
          ) : (
            <span className="text-sm font-medium text-gray-600">
              {(userDetails.full_name || userDetails.email)[0].toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-900">
            {userDetails.full_name || userDetails.email}
          </div>
          <div className="text-xs text-gray-500">{userDetails.email}</div>
        </div>
      </div>

      {/* Current Role */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Current Role</label>
        <div className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium border ${getRoleColor(userDetails.role)}`}>
          {getRoleIcon(userDetails.role)}
          <span className="ml-2 capitalize">{userDetails.role}</span>
        </div>
      </div>

      {/* Role Change */}
      {canModify && availableRoles.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Change Role</label>
          <select
            value={userDetails.role}
            onChange={(e) => handleRoleChange(e.target.value as WorkspaceRole | MemberRole)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-testid={`role-select-${userId}`}
          >
            {availableRoles.map(role => (
              <option key={role.value} value={role.value}>
                {role.label} - {role.description}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Permissions Summary */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
        <div className="text-xs text-gray-600 space-y-1">
          {userDetails.permissions.slice(0, 5).map(permission => (
            <div key={permission} className="flex items-center">
              <Check className="h-3 w-3 text-green-500 mr-1" />
              <span className="capitalize">{permission.replace(/[._]/g, ' ')}</span>
            </div>
          ))}
          {userDetails.permissions.length > 5 && (
            <div className="text-gray-500">
              +{userDetails.permissions.length - 5} more permissions
            </div>
          )}
        </div>
      </div>

      {/* Member Since */}
      <div className="text-xs text-gray-500">
        Member since {new Date(userDetails.joined_at).toLocaleDateString()}
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && pendingRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
              <h3 className="text-lg font-semibold">Confirm Role Change</h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to change {userDetails.full_name || userDetails.email}'s role from{' '}
              <span className="font-medium capitalize">{userDetails.role}</span> to{' '}
              <span className="font-medium capitalize">{pendingRole}</span>?
            </p>
            
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={cancelRoleChange}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={updating}
              >
                Cancel
              </button>
              <button
                onClick={confirmRoleChange}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={updating}
                data-testid="confirm-role-change"
              >
                {updating ? 'Updating...' : 'Confirm Change'}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}
    </div>
  )
} 