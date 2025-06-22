import React from 'react'
import { Users, UserPlus, Crown, Shield, User } from 'lucide-react'
import type { Project } from '../../types/supabase'
import { usePermission } from '../../hooks/usePermissions'

interface ProjectTeamProps {
  project: Project
  onProjectUpdate: (updates: Partial<Project>) => void
}

export const ProjectTeam: React.FC<ProjectTeamProps> = ({
  project,
  onProjectUpdate
}) => {
  const canInviteMembers = usePermission('team.invite', { projectId: project.id })
  const canManageTeam = usePermission('team.role.change', { projectId: project.id })

  // Mock team data for now - in a real app this would come from the database
  const teamMembers = [
    {
      id: project.owner_id,
      email: 'owner@example.com',
      role: 'owner' as 'owner' | 'admin' | 'member',
      joinedAt: project.created_at,
      isCurrentUser: true
    }
  ]

  const getRoleIcon = (role: string) => {
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

  const getRoleColor = (role: string) => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Team Members</h2>
          <p className="mt-1 text-sm text-gray-500">
            {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}
          </p>
        </div>
        {canInviteMembers && (
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Member
          </button>
        )}
      </div>

      {/* Team Members List */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <ul className="divide-y divide-gray-200">
          {teamMembers.map((member) => (
            <li key={member.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <User className="h-6 w-6 text-gray-600" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900">
                        {member.email}
                      </p>
                      {member.isCurrentUser && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      Joined {new Date(member.joinedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                    {getRoleIcon(member.role)}
                    <span className="ml-1 capitalize">{member.role}</span>
                  </span>
                  
                  {canManageTeam && !member.isCurrentUser && (
                    <button className="text-gray-400 hover:text-gray-600">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Team Statistics */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Team Overview
          </h3>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {teamMembers.length}
              </div>
              <div className="text-sm text-gray-500">Total Members</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {teamMembers.filter(m => m.role === 'owner' || m.role === 'admin').length}
              </div>
              <div className="text-sm text-gray-500">Administrators</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {teamMembers.filter(m => m.role === 'member' || m.role === 'owner').length}
              </div>
              <div className="text-sm text-gray-500">Active Members</div>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Section */}
      {canInviteMembers && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Invite New Members
            </h3>
          </div>
          <div className="px-6 py-5">
            <div className="text-center py-6">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Expand your team
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Invite team members to collaborate on this project.
              </p>
              <div className="mt-6">
                <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Send Invitation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 