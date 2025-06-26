import React, { useState, useEffect } from 'react'
import { collaborationService } from '../../services'
import { runCollaborationTests, testCollaborationFeatures } from '../../utils/collaborationTest'
import type { ActivityWithDetails, InvitationWithDetails, CommentWithAuthor } from '../../services/collaborationService'
import type { Attachment, MemberRole } from '../../types/supabase'

interface CollaborationDemoProps {
  projectId?: string
}

export const CollaborationDemo: React.FC<CollaborationDemoProps> = ({ projectId }) => {
  const [loading, setLoading] = useState(false)
  const [testResults, setTestResults] = useState<string[]>([])
  const [recentActivity, setRecentActivity] = useState<ActivityWithDetails[]>([])
  const [projectInvitations, setProjectInvitations] = useState<InvitationWithDetails[]>([])
  const [projectComments, setProjectComments] = useState<CommentWithAuthor[]>([])
  const [projectAttachments, setProjectAttachments] = useState<Attachment[]>([])
  const [newComment, setNewComment] = useState('')

  // Run basic API tests
  const runTests = async () => {
    setLoading(true)
    setTestResults([])
    
    try {
      // Capture console output
      const originalLog = console.log
      const logs: string[] = []
      console.log = (...args: any[]) => {
        logs.push(args.join(' '))
        originalLog(...args)
      }

      // Run tests
      await runCollaborationTests()
      if (projectId) {
        await testCollaborationFeatures(projectId)
      }

      // Restore console
      console.log = originalLog
      setTestResults(logs)
    } catch (error) {
      setTestResults([`Error: ${error instanceof Error ? error.message : 'Unknown error'}`])
    } finally {
      setLoading(false)
    }
  }

  // Load collaboration data
  const loadCollaborationData = async () => {
    if (!projectId) return

    setLoading(true)
    try {
      // Load recent activity
      const activityResult = await collaborationService.getRecentActivity(10)
      if (activityResult.success && activityResult.data) {
        setRecentActivity(activityResult.data)
      }

      // Load project invitations
      const invitationsResult = await collaborationService.getProjectInvitations(projectId)
      if (invitationsResult.success && invitationsResult.data) {
        setProjectInvitations(invitationsResult.data)
      }

      // Load project comments
      const commentsResult = await collaborationService.getComments('project', projectId)
      if (commentsResult.success && commentsResult.data) {
        setProjectComments(commentsResult.data)
      }

      // Load project attachments
      const attachmentsResult = await collaborationService.getAttachments('project', projectId)
      if (attachmentsResult.success && attachmentsResult.data) {
        setProjectAttachments(attachmentsResult.data)
      }
    } catch (error) {
      console.error('Failed to load collaboration data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Add a comment
  const addComment = async () => {
    if (!projectId || !newComment.trim()) return

    try {
      const result = await collaborationService.addComment({
        entity_type: 'project',
        entity_id: projectId,
        content: newComment.trim()
      })

      if (result.success) {
        setNewComment('')
        // Reload comments
        const commentsResult = await collaborationService.getComments('project', projectId)
        if (commentsResult.success && commentsResult.data) {
          setProjectComments(commentsResult.data)
        }
      }
    } catch (error) {
      console.error('Failed to add comment:', error)
    }
  }

  // Invite user
  const inviteUser = async (email: string, role: MemberRole) => {
    if (!projectId || !email) return

    try {
      const result = await collaborationService.inviteUser({
        email,
        role,
        projectId,
        message: 'You have been invited to collaborate on this project'
      })

      if (result.success) {
        // Reload invitations
        const invitationsResult = await collaborationService.getProjectInvitations(projectId)
        if (invitationsResult.success && invitationsResult.data) {
          setProjectInvitations(invitationsResult.data)
        }
      }
    } catch (error) {
      console.error('Failed to invite user:', error)
    }
  }

  useEffect(() => {
    if (projectId) {
      loadCollaborationData()
    }
  }, [projectId])

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Collaboration API Demo</h1>
        <p className="text-gray-600">
          Demonstrating the collaborative features API endpoints including document sharing, 
          user invitations, comments, attachments, and activity tracking.
        </p>
      </div>

      {/* API Tests Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">API Tests</h2>
        <div className="flex gap-4 mb-4">
          <button
            onClick={runTests}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Running Tests...' : 'Run Collaboration Tests'}
          </button>
          {projectId && (
            <button
              onClick={loadCollaborationData}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load Project Data'}
            </button>
          )}
        </div>

        {testResults.length > 0 && (
          <div className="bg-gray-100 rounded-md p-4 max-h-60 overflow-y-auto">
            <h3 className="font-medium mb-2">Test Results:</h3>
            {testResults.map((result, index) => (
              <div key={index} className="text-sm font-mono text-gray-700 mb-1">
                {result}
              </div>
            ))}
          </div>
        )}
      </div>

      {projectId && (
        <>
          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Recent Activity ({recentActivity.length})</h2>
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="text-sm text-gray-600">
                      {activity.entity_type} • {activity.action} • {new Date(activity.created_at!).toLocaleString()}
                    </div>
                    {activity.details && (
                      <div className="text-xs text-gray-500 mt-1">
                        {JSON.stringify(activity.details)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No recent activity</p>
            )}
          </div>

          {/* Project Invitations */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Project Invitations ({projectInvitations.length})</h2>
            
            {/* Invite User Form */}
            <div className="mb-4 p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium mb-2">Invite New User</h3>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Email address"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const email = (e.target as HTMLInputElement).value
                      const roleSelect = e.currentTarget.parentElement?.querySelector('select') as HTMLSelectElement
                      const role = roleSelect?.value as MemberRole
                      if (email && role) {
                        inviteUser(email, role)
                        ;(e.target as HTMLInputElement).value = ''
                      }
                    }
                  }}
                />
                <select className="px-3 py-2 border border-gray-300 rounded-md" defaultValue="member">
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                </select>
                <button
                  onClick={() => {
                    const container = document.querySelector('.bg-gray-50')
                    const emailInput = container?.querySelector('input[type="email"]') as HTMLInputElement
                    const roleSelect = container?.querySelector('select') as HTMLSelectElement
                    const email = emailInput?.value
                    const role = roleSelect?.value as MemberRole
                    if (email && role) {
                      inviteUser(email, role)
                      emailInput.value = ''
                    }
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Invite
                </button>
              </div>
            </div>

            {projectInvitations.length > 0 ? (
              <div className="space-y-3">
                {projectInvitations.map((invitation) => (
                  <div key={invitation.id} className="border border-gray-200 rounded-md p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{invitation.email}</div>
                        <div className="text-sm text-gray-600">
                          Role: {invitation.role} • Status: {invitation.accepted_at ? 'Accepted' : 'Pending'}
                        </div>
                        <div className="text-xs text-gray-500">
                          Invited: {new Date(invitation.created_at!).toLocaleString()}
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        invitation.accepted_at ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {invitation.accepted_at ? 'Accepted' : 'Pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No pending invitations</p>
            )}
          </div>

          {/* Comments Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Project Comments ({projectComments.length})</h2>
            
            {/* Add Comment Form */}
            <div className="mb-4">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none"
                rows={3}
              />
              <button
                onClick={addComment}
                disabled={!newComment.trim()}
                className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Add Comment
              </button>
            </div>

            {projectComments.length > 0 ? (
              <div className="space-y-3">
                {projectComments.map((comment) => (
                  <div key={comment.id} className="border border-gray-200 rounded-md p-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm">
                        {comment.author.full_name?.[0] || comment.author.email[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {comment.author.full_name || comment.author.email}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.created_at!).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-sm text-gray-700">{comment.content}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No comments yet</p>
            )}
          </div>

          {/* Attachments Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Project Attachments ({projectAttachments.length})</h2>
            
            {projectAttachments.length > 0 ? (
              <div className="space-y-3">
                {projectAttachments.map((attachment) => (
                  <div key={attachment.id} className="border border-gray-200 rounded-md p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{attachment.file_name}</div>
                        <div className="text-sm text-gray-600">
                          Size: {attachment.file_size ? `${Math.round(attachment.file_size / 1024)} KB` : 'Unknown'} • 
                          Type: {attachment.file_type || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-500">
                          Uploaded: {new Date(attachment.created_at!).toLocaleString()}
                        </div>
                      </div>
                      {attachment.storage_path && (
                        <a
                          href={attachment.storage_path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Download
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No attachments uploaded</p>
            )}
          </div>
        </>
      )}
    </div>
  )
} 