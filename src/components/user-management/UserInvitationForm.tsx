import React, { useState } from 'react'
import { Mail, UserPlus, AlertCircle, CheckCircle } from 'lucide-react'
import { collaborationService } from '../../services/collaborationService'
import { workspaceService } from '../../services/workspaceService'
import { adminService } from '../../services/adminService'
import type { MemberRole } from '../../types/supabase'
import type { WorkspaceRole } from '../../types/permissions'

interface UserInvitationFormProps {
  /** Type of invitation - workspace or project */
  type: 'workspace' | 'project'
  /** ID of the workspace or project */
  contextId: string
  /** Callback when invitation is sent successfully */
  onInvitationSent?: (email: string, role: string) => void
  /** Callback when form is cancelled */
  onCancel?: () => void
  /** Current user's role for permission checking */
  userRole?: WorkspaceRole | MemberRole
  /** Custom CSS classes */
  className?: string
}

export const UserInvitationForm: React.FC<UserInvitationFormProps> = ({
  type,
  contextId,
  onInvitationSent,
  onCancel,
  userRole,
  className = ''
}) => {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<WorkspaceRole | MemberRole>(type === 'workspace' ? 'member' : 'member')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Determine available roles based on context and user permissions
  const getAvailableRoles = () => {
    if (type === 'workspace') {
      const workspaceRoles: { value: WorkspaceRole; label: string; description: string }[] = [
        { value: 'member', label: 'Member', description: 'Can view and create projects' },
        { value: 'admin', label: 'Admin', description: 'Can manage workspace and members' }
      ]
      
      // Only owners can invite other owners
      if (userRole === 'owner') {
        workspaceRoles.push({ value: 'owner', label: 'Owner', description: 'Full workspace control' })
      }
      
      return workspaceRoles
    } else {
      const projectRoles: { value: MemberRole; label: string; description: string }[] = [
        { value: 'member', label: 'Member', description: 'Can view and contribute to project' },
        { value: 'admin', label: 'Admin', description: 'Can manage project and team members' }
      ]
      
      // Only owners can invite other owners
      if (userRole === 'owner') {
        projectRoles.push({ value: 'owner', label: 'Owner', description: 'Full project control' })
      }
      
      return projectRoles
    }
  }

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      setError('Email address is required')
      return
    }
    
    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      let result: { success: boolean; message?: string; error?: string | null }

      if (type === 'workspace') {
        result = await workspaceService.inviteMember(contextId, {
          email: email.trim(),
          role: role as WorkspaceRole,
          message: message.trim() || undefined
        })
      } else {
        const inviteResult = await collaborationService.inviteUser({
          email: email.trim(),
          role: role as MemberRole,
          projectId: contextId,
          message: message.trim() || undefined
        })
        result = inviteResult
      }

      if (result.success) {
        setSuccess(`Invitation sent successfully to ${email}`)
        setEmail('')
        setMessage('')
        setRole(type === 'workspace' ? 'member' : 'member')
        onInvitationSent?.(email, role)
      } else {
        setError(result.error || result.message || 'Failed to send invitation')
      }
    } catch (err) {
      console.error('Error sending invitation:', err)
      setError('Failed to send invitation. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const availableRoles = getAvailableRoles()

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center mb-4">
        <UserPlus className="h-5 w-5 text-blue-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">
          Invite to {type === 'workspace' ? 'Workspace' : 'Project'}
        </h3>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-start">
          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-sm text-green-700">{success}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Input */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              data-testid="invite-email-input"
              required
            />
          </div>
        </div>

        {/* Role Selection */}
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
            Role
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as WorkspaceRole | MemberRole)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            data-testid="invite-role-select"
          >
            {availableRoles.map((roleOption) => (
              <option key={roleOption.value} value={roleOption.value}>
                {roleOption.label} - {roleOption.description}
              </option>
            ))}
          </select>
        </div>

        {/* Optional Message */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            Personal Message (Optional)
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a personal message to the invitation..."
            rows={3}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            data-testid="invite-message-input"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              data-testid="cancel-invite-button"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading || !email.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="send-invite-button"
          >
            {isLoading ? 'Sending...' : 'Send Invitation'}
          </button>
        </div>
      </form>

      {/* Help Text */}
      <div className="mt-4 p-3 bg-gray-50 rounded-md">
        <p className="text-xs text-gray-600">
          <strong>Note:</strong> The invited user will receive an email with instructions to join the {type}. 
          They'll need to create an account if they don't have one already.
        </p>
      </div>
    </div>
  )
} 