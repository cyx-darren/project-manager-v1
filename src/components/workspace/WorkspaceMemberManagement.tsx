import React, { useState, useEffect } from 'react'
import { workspaceService, type WorkspaceMember } from '../../services/workspaceService'
import { type WorkspaceRole } from '../../types/permissions'
import { useToast } from '../../hooks/useToast'
import { usePermissions } from '../../hooks/usePermissions'
import { useAuth } from '../../contexts/AuthContext'

interface WorkspaceMemberManagementProps {
  workspaceId: string
  userRole: WorkspaceRole
}

export const WorkspaceMemberManagement: React.FC<WorkspaceMemberManagementProps> = ({
  workspaceId,
  userRole
}) => {
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>('member')
  const [isInviting, setIsInviting] = useState(false)
  const [showInviteForm, setShowInviteForm] = useState(false)
  
  const { showToast } = useToast()
  const { hasPermission } = usePermissions()
  const { user } = useAuth()

  const canInviteMembers = userRole === 'owner' || userRole === 'admin'
  const canManageRoles = userRole === 'owner' || userRole === 'admin'
  const canRemoveMembers = userRole === 'owner' || userRole === 'admin'

  useEffect(() => {
    loadMembers()
  }, [workspaceId])

  const loadMembers = async () => {
    try {
      setLoading(true)
      const workspaceMembers = await workspaceService.getWorkspaceMembers(workspaceId)
      setMembers(workspaceMembers)
    } catch (error) {
      console.error('Failed to load members:', error)
      showToast('error', 'Failed to load workspace members')
    } finally {
      setLoading(false)
    }
  }

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return

    try {
      setIsInviting(true)
      const result = await workspaceService.inviteMember(workspaceId, {
        email: inviteEmail,
        role: inviteRole
      })

      if (result.success) {
        showToast('success', 'Member invited successfully')
        setInviteEmail('')
        setShowInviteForm(false)
        await loadMembers()
      } else {
        showToast('error', result.message)
      }
    } catch (error) {
      console.error('Failed to invite member:', error)
      showToast('error', 'Failed to invite member')
    } finally {
      setIsInviting(false)
    }
  }

  const handleRoleChange = async (memberId: string, userId: string, newRole: WorkspaceRole) => {
    try {
      await workspaceService.updateMemberRole(workspaceId, userId, newRole)
      showToast('success', 'Member role updated successfully')
      await loadMembers()
    } catch (error) {
      console.error('Failed to update role:', error)
      showToast('error', 'Failed to update member role')
    }
  }

  const handleRemoveMember = async (memberId: string, userId: string, memberName?: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName || 'this member'} from the workspace?`)) {
      return
    }

    try {
      await workspaceService.removeMember(workspaceId, userId)
      showToast('success', 'Member removed successfully')
      await loadMembers()
    } catch (error) {
      console.error('Failed to remove member:', error)
      showToast('error', 'Failed to remove member')
    }
  }

  const getRoleDisplayName = (role: WorkspaceRole): string => {
    const roleNames = {
      owner: 'Owner',
      admin: 'Admin',
      member: 'Member',
      viewer: 'Viewer',
      billing_manager: 'Billing Manager'
    }
    return roleNames[role] || role
  }

  const getRoleBadgeColor = (role: WorkspaceRole): string => {
    const colors = {
      owner: 'bg-purple-100 text-purple-800',
      admin: 'bg-blue-100 text-blue-800',
      member: 'bg-green-100 text-green-800',
      viewer: 'bg-gray-100 text-gray-800',
      billing_manager: 'bg-yellow-100 text-yellow-800'
    }
    return colors[role] || 'bg-gray-100 text-gray-800'
  }

  const canChangeRole = (member: WorkspaceMember): boolean => {
    if (!canManageRoles) return false
    if (member.user_id === user?.id) return false // Can't change own role
    if (member.role === 'owner' && userRole !== 'owner') return false
    return true
  }

  const canRemove = (member: WorkspaceMember): boolean => {
    if (!canRemoveMembers) return false
    if (member.user_id === user?.id) return false // Can't remove self
    if (member.role === 'owner') return false // Can't remove owner
    return true
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Members ({members.length})
        </h3>
        {canInviteMembers && (
          <button
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-testid="invite-member-button"
          >
            Invite Member
          </button>
        )}
      </div>

      {/* Invite Form */}
      {showInviteForm && canInviteMembers && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Invite New Member</h4>
          <form onSubmit={handleInviteMember} className="space-y-3">
            <div className="flex space-x-3">
              <div className="flex-1">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  data-testid="invite-email-input"
                  required
                />
              </div>
              <div>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as WorkspaceRole)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  data-testid="invite-role-select"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  {userRole === 'owner' && <option value="owner">Owner</option>}
                </select>
              </div>
              <button
                type="submit"
                disabled={isInviting || !inviteEmail.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                data-testid="send-invite-button"
              >
                {isInviting ? 'Inviting...' : 'Send Invite'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Members List */}
      <div className="space-y-3">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
            data-testid={`member-${member.user_id}`}
          >
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                {member.user?.avatar_url ? (
                  <img
                    src={member.user.avatar_url}
                    alt={member.user.full_name || member.user.email}
                    className="h-10 w-10 rounded-full"
                  />
                ) : (
                  <span className="text-sm font-medium text-gray-600">
                    {(member.user?.full_name || member.user?.email || 'U')[0].toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {member.user?.full_name || member.user?.email || 'Unknown User'}
                </div>
                <div className="text-xs text-gray-500">
                  {member.user?.email}
                </div>
                <div className="text-xs text-gray-400">
                  Joined {member.joined_at ? new Date(member.joined_at).toLocaleDateString() : 'Unknown'}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Role Badge/Selector */}
              {canChangeRole(member) && member.role ? (
                <select
                  value={member.role}
                  onChange={(e) => handleRoleChange(member.id, member.user_id, e.target.value as WorkspaceRole)}
                  className={`px-2 py-1 text-xs font-medium rounded-full border ${getRoleBadgeColor(member.role)}`}
                  data-testid={`role-select-${member.user_id}`}
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  {userRole === 'owner' && <option value="owner">Owner</option>}
                </select>
              ) : member.role ? (
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(member.role)}`}
                  data-testid={`role-badge-${member.user_id}`}
                >
                  {getRoleDisplayName(member.role)}
                </span>
              ) : (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                  No Role
                </span>
              )}

              {/* Remove Button */}
              {canRemove(member) && (
                <button
                  onClick={() => handleRemoveMember(
                    member.id, 
                    member.user_id, 
                    member.user?.full_name ?? member.user?.email ?? undefined
                  )}
                  className="text-sm text-red-600 hover:text-red-800"
                  data-testid={`remove-member-${member.user_id}`}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}

        {members.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No members found. Invite some members to get started!
          </div>
        )}
      </div>
    </div>
  )
} 