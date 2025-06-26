import React, { useState, useEffect } from 'react'
import { Mail, Clock, CheckCircle, XCircle, RefreshCw, AlertTriangle, Calendar } from 'lucide-react'
import { collaborationService } from '../../services/collaborationService'
import { workspaceService } from '../../services/workspaceService'
import type { ProjectInvitation } from '../../types/supabase'
import type { WorkspaceRole } from '../../types/permissions'

interface InvitationManagerProps {
  /** Type of context - workspace or project */
  type: 'workspace' | 'project'
  /** ID of the workspace or project */
  contextId: string
  /** Current user's role for permission checking */
  currentUserRole?: WorkspaceRole
  /** Whether the current user can manage invitations */
  canManage?: boolean
}

interface InvitationWithDetails {
  id: string
  email: string
  role: string
  invited_by: string
  created_at: string
  expires_at: string
  accepted_at?: string
  token: string
  status: 'pending' | 'accepted' | 'expired' | 'revoked'
  inviter?: {
    email: string
    full_name?: string
  }
}

export const InvitationManager: React.FC<InvitationManagerProps> = ({
  type,
  contextId,
  currentUserRole,
  canManage = false
}) => {
  const [invitations, setInvitations] = useState<InvitationWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingInvitation, setProcessingInvitation] = useState<string | null>(null)

  useEffect(() => {
    loadInvitations()
  }, [contextId, type])

  const loadInvitations = async () => {
    try {
      setLoading(true)
      setError(null)
      
      let loadedInvitations: InvitationWithDetails[] = []

      if (type === 'project') {
        const result = await collaborationService.getProjectInvitations(contextId)
        if (result.success && result.data) {
          loadedInvitations = result.data.map(invitation => {
            const now = new Date()
            const expiresAt = new Date(invitation.expires_at)
            const isExpired = expiresAt < now
            const isAccepted = !!invitation.accepted_at

                         return {
               id: invitation.id,
               email: invitation.email,
               role: invitation.role || 'member',
               invited_by: invitation.invited_by || 'unknown',
               created_at: invitation.created_at || new Date().toISOString(),
               expires_at: invitation.expires_at,
               accepted_at: invitation.accepted_at || undefined,
               token: invitation.token,
               status: isAccepted ? 'accepted' : isExpired ? 'expired' : 'pending',
               inviter: {
                 email: 'inviter@example.com', // This would come from a user lookup
                 full_name: 'Inviter Name'
               }
             }
          })
        }
      } else {
        // For workspace invitations, we'd need a similar service method
        // For now, return empty array as workspace invitations aren't fully implemented
        loadedInvitations = []
      }

      setInvitations(loadedInvitations)
    } catch (err) {
      console.error('Error loading invitations:', err)
      setError('Failed to load invitations')
    } finally {
      setLoading(false)
    }
  }

  const revokeInvitation = async (invitationId: string) => {
    if (!canManage) return

    try {
      setProcessingInvitation(invitationId)
      
      if (type === 'project') {
        const result = await collaborationService.revokeInvitation(invitationId)
        if (result.success) {
          await loadInvitations() // Refresh the list
        } else {
          setError(result.error || 'Failed to revoke invitation')
        }
      }
    } catch (err) {
      console.error('Error revoking invitation:', err)
      setError('Failed to revoke invitation')
    } finally {
      setProcessingInvitation(null)
    }
  }

  const resendInvitation = async (invitationId: string, email: string, role: string) => {
    if (!canManage) return

    try {
      setProcessingInvitation(invitationId)
      
      // First revoke the old invitation
      await revokeInvitation(invitationId)
      
      // Then send a new one
      if (type === 'project') {
        const result = await collaborationService.inviteUser({
          email,
          role: role as any,
          projectId: contextId,
          message: 'Resent invitation'
        })
        
        if (result.success) {
          await loadInvitations() // Refresh the list
        } else {
          setError(result.error || 'Failed to resend invitation')
        }
      }
    } catch (err) {
      console.error('Error resending invitation:', err)
      setError('Failed to resend invitation')
    } finally {
      setProcessingInvitation(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'expired':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'revoked':
        return <XCircle className="h-4 w-4 text-gray-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'accepted':
        return 'bg-green-100 text-green-800'
      case 'expired':
        return 'bg-red-100 text-red-800'
      case 'revoked':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date()
    const expires = new Date(expiresAt)
    const diff = expires.getTime() - now.getTime()
    
    if (diff <= 0) return 'Expired'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) return `${days}d ${hours}h remaining`
    if (hours > 0) return `${hours}h remaining`
    
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${minutes}m remaining`
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
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
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <div className="text-red-600 mb-2">{error}</div>
          <button
            onClick={loadInvitations}
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
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Mail className="h-5 w-5 text-gray-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">
              Pending Invitations
            </h2>
            <span className="ml-2 text-sm text-gray-500">
              ({invitations.filter(inv => inv.status === 'pending').length})
            </span>
          </div>
          
          <button
            onClick={loadInvitations}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
            data-testid="refresh-invitations"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Invitations List */}
      <div className="p-6">
        {invitations.length === 0 ? (
          <div className="text-center py-8">
            <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No invitations</h3>
            <p className="text-gray-500">
              No pending invitations for this {type}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                data-testid={`invitation-${invitation.id}`}
              >
                <div className="flex items-center space-x-4">
                  {/* Status Icon */}
                  <div className="flex-shrink-0">
                    {getStatusIcon(invitation.status)}
                  </div>

                  {/* Invitation Details */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <div className="text-sm font-medium text-gray-900">
                        {invitation.email}
                      </div>
                      <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(invitation.status)}`}>
                        {invitation.status}
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 mt-1">
                      Role: <span className="capitalize">{invitation.role}</span>
                      {invitation.inviter && (
                        <span> • Invited by {invitation.inviter.full_name || invitation.inviter.email}</span>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-400 mt-1 flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      Sent {new Date(invitation.created_at).toLocaleDateString()}
                      {invitation.status === 'pending' && (
                        <span className="ml-2">
                          • {formatTimeRemaining(invitation.expires_at)}
                        </span>
                      )}
                      {invitation.accepted_at && (
                        <span className="ml-2">
                          • Accepted {new Date(invitation.accepted_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {canManage && invitation.status === 'pending' && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => resendInvitation(invitation.id, invitation.email, invitation.role)}
                      disabled={processingInvitation === invitation.id}
                      className="px-3 py-1 text-xs font-medium text-blue-600 border border-blue-600 rounded hover:bg-blue-50 disabled:opacity-50"
                      data-testid={`resend-invitation-${invitation.id}`}
                    >
                      {processingInvitation === invitation.id ? 'Processing...' : 'Resend'}
                    </button>
                    
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to revoke the invitation for ${invitation.email}?`)) {
                          revokeInvitation(invitation.id)
                        }
                      }}
                      disabled={processingInvitation === invitation.id}
                      className="px-3 py-1 text-xs font-medium text-red-600 border border-red-600 rounded hover:bg-red-50 disabled:opacity-50"
                      data-testid={`revoke-invitation-${invitation.id}`}
                    >
                      Revoke
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {invitations.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span>
                <strong>{invitations.filter(inv => inv.status === 'pending').length}</strong> pending
              </span>
              <span>
                <strong>{invitations.filter(inv => inv.status === 'accepted').length}</strong> accepted
              </span>
              <span>
                <strong>{invitations.filter(inv => inv.status === 'expired').length}</strong> expired
              </span>
            </div>
            
            <div className="text-xs text-gray-500">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 