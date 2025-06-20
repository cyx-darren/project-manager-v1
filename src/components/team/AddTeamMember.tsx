import React, { useState } from 'react'
import { teamService, type MemberRole } from '../../services/teamService'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../LoadingSpinner'


interface AddTeamMemberProps {
  projectId: string
  onMemberAdded?: () => void
  onCancel?: () => void
}

const AddTeamMember: React.FC<AddTeamMemberProps> = ({ 
  projectId, 
  onMemberAdded, 
  onCancel 
}) => {
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<MemberRole>('member')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      setError('Email is required')
      return
    }

    if (!user) {
      setError('You must be logged in to add team members')
      return
    }

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      // For now, we'll simulate adding a user by email
      // In a real implementation, you'd have a user lookup system
      // or send an invitation email
      
      // Check if user can manage team
      const canManage = await teamService.canManageTeam(projectId, user.id)
      if (!canManage) {
        setError('You do not have permission to add team members')
        return
      }

      // For demo purposes, we'll show a success message
      // In production, you'd implement proper user invitation flow
      setSuccess(`Invitation sent to ${email} as ${role}`)
      setEmail('')
      setRole('member')
      
      // Call the callback to refresh the member list
      onMemberAdded?.()
      
    } catch (err) {
      console.error('Error adding team member:', err)
      setError('Failed to add team member. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Future enhancement: Add existing user functionality
  // This would be used when implementing user search and direct user addition

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="mb-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Add Team Member
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Invite someone to join this project by entering their email address.
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Success</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>{success}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address *
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              placeholder="Enter team member's email"
              required
              disabled={loading}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
              Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as MemberRole)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              disabled={loading}
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <p className="mt-1 text-sm text-gray-500">
              {role === 'admin' 
                ? 'Admins can manage team members and project settings'
                : 'Members can view and contribute to the project'
              }
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={loading}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Sending Invitation...
                </>
              ) : (
                'Send Invitation'
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 border-t border-gray-200 pt-6">
          <div className="text-sm text-gray-500">
            <p className="mb-2">
              <strong>Note:</strong> This is a demo implementation. In a production environment:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Email invitations would be sent through Supabase Auth</li>
              <li>Users would receive invitation links to join the project</li>
              <li>Role assignments would be handled during the invitation acceptance</li>
              <li>Proper user search and validation would be implemented</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddTeamMember 