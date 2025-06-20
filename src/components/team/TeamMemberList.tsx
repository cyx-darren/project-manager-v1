import React, { useState, useEffect } from 'react'
import { teamService, type TeamMember, type MemberRole } from '../../services/teamService'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../LoadingSpinner'
// import { RoleGuard, AdminOnly } from '../auth/RoleGuard' // Future enhancement

interface TeamMemberListProps {
  projectId: string
  onMemberUpdate?: () => void
}

const TeamMemberList: React.FC<TeamMemberListProps> = ({ projectId, onMemberUpdate }) => {
  const { user } = useAuth()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [canManage, setCanManage] = useState(false)
  const [updatingMember, setUpdatingMember] = useState<string | null>(null)

  // Load team members
  useEffect(() => {
    loadMembers()
    checkManagementPermissions()
  }, [projectId])

  const loadMembers = async () => {
    try {
      setLoading(true)
      setError(null) // Clear any previous errors
      
      console.log('Loading members for project:', projectId)
      const { data, error } = await teamService.getProjectMembers(projectId)
      
      if (error) {
        setError('Failed to load team members')
        console.error('Error loading members:', error)
      } else {
        console.log('Loaded members:', data)
        setMembers(data || [])
      }
    } catch (err) {
      setError('Failed to load team members')
      console.error('Error loading members:', err)
    } finally {
      setLoading(false)
    }
  }

  const checkManagementPermissions = async () => {
    if (!user) return
    
    try {
      const canManageTeam = await teamService.canManageTeam(projectId, user.id)
      setCanManage(canManageTeam)
    } catch (err) {
      console.error('Error checking management permissions:', err)
    }
  }

  const handleRoleChange = async (memberId: string, userId: string, newRole: MemberRole) => {
    if (!canManage) return

    try {
      setUpdatingMember(memberId)
      const { error } = await teamService.updateMemberRole(projectId, userId, newRole)
      
      if (error) {
        setError('Failed to update member role')
        console.error('Error updating role:', error)
      } else {
        await loadMembers() // Refresh the list
        onMemberUpdate?.()
      }
    } catch (err) {
      setError('Failed to update member role')
      console.error('Error updating role:', err)
    } finally {
      setUpdatingMember(null)
    }
  }

  const handleRemoveMember = async (memberId: string, userId: string, memberEmail?: string) => {
    if (!canManage) return

    const confirmMessage = `Are you sure you want to remove ${memberEmail || 'this member'} from the project?`
    if (!window.confirm(confirmMessage)) return

    try {
      setUpdatingMember(memberId)
      const { error } = await teamService.removeMemberFromProject(projectId, userId)
      
      if (error) {
        setError('Failed to remove team member')
        console.error('Error removing member:', error)
      } else {
        await loadMembers() // Refresh the list
        onMemberUpdate?.()
      }
    } catch (err) {
      setError('Failed to remove team member')
      console.error('Error removing member:', err)
    } finally {
      setUpdatingMember(null)
    }
  }

  const getRoleBadgeColor = (role: MemberRole) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800'
      case 'admin':
        return 'bg-blue-100 text-blue-800'
      case 'member':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getDisplayName = (member: TeamMember) => {
    const fullName = member.user?.user_metadata?.full_name
    const email = member.user?.email
    return fullName || email || 'Unknown User'
  }

  const getInitials = (member: TeamMember) => {
    const name = getDisplayName(member)
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={loadMembers}
                className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Team Members
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {members.length} member{members.length !== 1 ? 's' : ''} in this project
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center space-x-3">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {member.user?.user_metadata?.avatar_url ? (
                    <img
                      className="h-10 w-10 rounded-full"
                      src={member.user.user_metadata.avatar_url}
                      alt={getDisplayName(member)}
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {getInitials(member)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Member Info */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {getDisplayName(member)}
                    {member.user_id === user?.id && (
                      <span className="ml-2 text-xs text-gray-500">(You)</span>
                    )}
                  </p>
                  <p className="text-sm text-gray-500">{member.user?.email}</p>
                </div>

                {/* Role Badge */}
                <div className="flex-shrink-0">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                    {member.role}
                  </span>
                </div>
              </div>

              {/* Actions */}
              {canManage && member.user_id !== user?.id && (
                <div className="flex items-center space-x-2">
                  {updatingMember === member.id ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      {/* Role Change Dropdown */}
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, member.user_id, e.target.value as MemberRole)}
                        className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        disabled={member.role === 'owner'}
                      >
                        <option value="member">Member</option>
                        <option value="admin">Admin</option>
                        {member.role === 'owner' && <option value="owner">Owner</option>}
                      </select>

                      {/* Remove Button */}
                      {member.role !== 'owner' && (
                        <button
                          onClick={() => handleRemoveMember(member.id, member.user_id, member.user?.email)}
                          className="text-red-600 hover:text-red-900 text-sm font-medium"
                        >
                          Remove
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {members.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No team members</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding team members to this project.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default TeamMemberList 