import { supabase } from '../config/supabase'

// Types for document sharing
export interface DocumentShare {
  id: string
  entity_type: 'task' | 'project' | 'attachment'
  entity_id: string
  shared_by: string
  shared_with?: string
  share_token?: string
  access_level: 'view' | 'comment' | 'edit'
  expires_at?: string
  password_hash?: string
  settings: Record<string, any>
  created_at: string
  updated_at: string
  last_accessed_at?: string
  access_count: number
  shared_by_user?: {
    id: string
    email: string
    raw_user_meta_data?: any
  }
  shared_with_user?: {
    id: string
    email: string
    raw_user_meta_data?: any
  }
}

export interface ShareInvitation {
  id: string
  share_id: string
  email: string
  invited_by: string
  invitation_token: string
  message?: string
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  expires_at: string
  accepted_at?: string
  created_at: string
  invited_by_user?: {
    id: string
    email: string
    raw_user_meta_data?: any
  }
}

export interface ShareAccessLog {
  id: string
  share_id: string
  accessed_by?: string
  ip_address?: string
  user_agent?: string
  action: 'view' | 'download' | 'comment' | 'edit'
  accessed_at: string
  accessed_by_user?: {
    id: string
    email: string
    raw_user_meta_data?: any
  }
}

export interface CreateShareRequest {
  entity_type: 'task' | 'project' | 'attachment'
  entity_id: string
  shared_with?: string // User ID for direct sharing
  access_level?: 'view' | 'comment' | 'edit'
  expires_at?: string
  password?: string
  settings?: Record<string, any>
  send_email?: boolean
  message?: string
}

export interface ShareAccessResult {
  valid: boolean
  error?: string
  share_id?: string
  entity_type?: string
  entity_id?: string
  access_level?: string
  settings?: Record<string, any>
}

class DocumentSharingService {
  // Mock data for demo purposes until database schema is applied
  private mockShares: DocumentShare[] = [
    {
      id: 'share-1',
      entity_type: 'task',
      entity_id: 'task-1',
      shared_by: 'user-1',
      shared_with: 'user-2',
      share_token: 'demo-token-1',
      access_level: 'edit',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      settings: { allow_download: true, allow_comments: true },
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      access_count: 5,
      shared_by_user: {
        id: 'user-1',
        email: 'darren@easyprintsg.com',
        raw_user_meta_data: { name: 'Darren Choong' }
      },
      shared_with_user: {
        id: 'user-2',
        email: 'alice@example.com',
        raw_user_meta_data: { name: 'Alice Smith' }
      }
    },
    {
      id: 'share-2',
      entity_type: 'project',
      entity_id: 'project-1',
      shared_by: 'user-1',
      share_token: 'demo-token-2',
      access_level: 'view',
      settings: { allow_download: false, allow_comments: false },
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      access_count: 12,
      shared_by_user: {
        id: 'user-1',
        email: 'darren@easyprintsg.com',
        raw_user_meta_data: { name: 'Darren Choong' }
      }
    }
  ]

  private mockInvitations: ShareInvitation[] = [
    {
      id: 'invitation-1',
      share_id: 'share-1',
      email: 'bob@example.com',
      invited_by: 'user-1',
      invitation_token: 'invite-token-1',
      message: 'Please review this task and provide feedback',
      status: 'pending',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      invited_by_user: {
        id: 'user-1',
        email: 'darren@easyprintsg.com',
        raw_user_meta_data: { name: 'Darren Choong' }
      }
    }
  ]

  private mockAccessLogs: ShareAccessLog[] = [
    {
      id: 'log-1',
      share_id: 'share-1',
      accessed_by: 'user-2',
      action: 'view',
      accessed_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      accessed_by_user: {
        id: 'user-2',
        email: 'alice@example.com',
        raw_user_meta_data: { name: 'Alice Smith' }
      }
    },
    {
      id: 'log-2',
      share_id: 'share-1',
      accessed_by: 'user-2',
      action: 'edit',
      accessed_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
      accessed_by_user: {
        id: 'user-2',
        email: 'alice@example.com',
        raw_user_meta_data: { name: 'Alice Smith' }
      }
    }
  ]

  /**
   * Create a new document share
   */
  async createShare(request: CreateShareRequest): Promise<{ data: DocumentShare | null; error: string | null }> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))

      const newShare: DocumentShare = {
        id: `share-${Date.now()}`,
        entity_type: request.entity_type,
        entity_id: request.entity_id,
        shared_by: 'current-user-id',
        shared_with: request.shared_with,
        share_token: `token-${Math.random().toString(36).substr(2, 9)}`,
        access_level: request.access_level || 'view',
        expires_at: request.expires_at,
        settings: request.settings || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        access_count: 0,
        shared_by_user: {
          id: 'current-user-id',
          email: 'darren@easyprintsg.com',
          raw_user_meta_data: { name: 'Darren Choong' }
        }
      }

      // Add to mock data
      this.mockShares.push(newShare)

      return { data: newShare, error: null }
    } catch (error) {
      console.error('Error in createShare:', error)
      return { data: null, error: 'Failed to create share' }
    }
  }

  /**
   * Get shares for an entity
   */
  async getEntityShares(entityType: string, entityId: string): Promise<{ data: DocumentShare[] | null; error: string | null }> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300))

      const shares = this.mockShares.filter(
        share => share.entity_type === entityType && share.entity_id === entityId
      )

      return { data: shares, error: null }
    } catch (error) {
      console.error('Error in getEntityShares:', error)
      return { data: null, error: 'Failed to fetch shares' }
    }
  }

  /**
   * Get shares created by current user
   */
  async getMyShares(): Promise<{ data: DocumentShare[] | null; error: string | null }> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300))

      const shares = this.mockShares.filter(share => share.shared_by === 'current-user-id')

      return { data: shares, error: null }
    } catch (error) {
      console.error('Error in getMyShares:', error)
      return { data: null, error: 'Failed to fetch shares' }
    }
  }

  /**
   * Get shares accessible to current user
   */
  async getSharedWithMe(): Promise<{ data: DocumentShare[] | null; error: string | null }> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300))

      const shares = this.mockShares.filter(share => share.shared_with === 'current-user-id')

      return { data: shares, error: null }
    } catch (error) {
      console.error('Error in getSharedWithMe:', error)
      return { data: null, error: 'Failed to fetch shares' }
    }
  }

  /**
   * Validate share access with token
   */
  async validateShareAccess(shareToken: string, password?: string): Promise<ShareAccessResult> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300))

      const share = this.mockShares.find(s => s.share_token === shareToken)
      
      if (!share) {
        return { valid: false, error: 'Share not found' }
      }

      // Check if expired
      if (share.expires_at && new Date(share.expires_at) < new Date()) {
        return { valid: false, error: 'Share has expired' }
      }

      // Check password if required
      if (share.password_hash && !password) {
        return { valid: false, error: 'Password required' }
      }

      return {
        valid: true,
        share_id: share.id,
        entity_type: share.entity_type,
        entity_id: share.entity_id,
        access_level: share.access_level,
        settings: share.settings
      }
    } catch (error) {
      console.error('Error in validateShareAccess:', error)
      return { valid: false, error: 'Failed to validate share access' }
    }
  }

  /**
   * Update share settings
   */
  async updateShare(shareId: string, updates: Partial<DocumentShare>): Promise<{ data: DocumentShare | null; error: string | null }> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300))

      const shareIndex = this.mockShares.findIndex(s => s.id === shareId)
      if (shareIndex === -1) {
        return { data: null, error: 'Share not found' }
      }

      this.mockShares[shareIndex] = {
        ...this.mockShares[shareIndex],
        ...updates,
        updated_at: new Date().toISOString()
      }

      return { data: this.mockShares[shareIndex], error: null }
    } catch (error) {
      console.error('Error in updateShare:', error)
      return { data: null, error: 'Failed to update share' }
    }
  }

  /**
   * Revoke/delete a share
   */
  async revokeShare(shareId: string): Promise<{ error: string | null }> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300))

      const shareIndex = this.mockShares.findIndex(s => s.id === shareId)
      if (shareIndex === -1) {
        return { error: 'Share not found' }
      }

      this.mockShares.splice(shareIndex, 1)
      return { error: null }
    } catch (error) {
      console.error('Error in revokeShare:', error)
      return { error: 'Failed to revoke share' }
    }
  }

  /**
   * Send share invitation email
   */
  async sendShareInvitation(shareId: string, email: string, message?: string): Promise<{ data: ShareInvitation | null; error: string | null }> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))

      const newInvitation: ShareInvitation = {
        id: `invitation-${Date.now()}`,
        share_id: shareId,
        email,
        invited_by: 'current-user-id',
        invitation_token: `invite-${Math.random().toString(36).substr(2, 9)}`,
        message,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        invited_by_user: {
          id: 'current-user-id',
          email: 'darren@easyprintsg.com',
          raw_user_meta_data: { name: 'Darren Choong' }
        }
      }

      this.mockInvitations.push(newInvitation)
      return { data: newInvitation, error: null }
    } catch (error) {
      console.error('Error in sendShareInvitation:', error)
      return { data: null, error: 'Failed to send invitation' }
    }
  }

  /**
   * Get share invitations for a share
   */
  async getShareInvitations(shareId: string): Promise<{ data: ShareInvitation[] | null; error: string | null }> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300))

      const invitations = this.mockInvitations.filter(inv => inv.share_id === shareId)
      return { data: invitations, error: null }
    } catch (error) {
      console.error('Error in getShareInvitations:', error)
      return { data: null, error: 'Failed to fetch invitations' }
    }
  }

  /**
   * Get access logs for a share
   */
  async getShareAccessLogs(shareId: string): Promise<{ data: ShareAccessLog[] | null; error: string | null }> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300))

      const logs = this.mockAccessLogs.filter(log => log.share_id === shareId)
      return { data: logs, error: null }
    } catch (error) {
      console.error('Error in getShareAccessLogs:', error)
      return { data: null, error: 'Failed to fetch access logs' }
    }
  }

  /**
   * Generate shareable link
   */
  generateShareableLink(shareToken: string): string {
    const baseUrl = window.location.origin
    return `${baseUrl}/shared/${shareToken}`
  }

  /**
   * Copy share link to clipboard
   */
  async copyShareLink(shareToken: string): Promise<boolean> {
    try {
      const link = this.generateShareableLink(shareToken)
      await navigator.clipboard.writeText(link)
      return true
    } catch (error) {
      console.error('Error copying to clipboard:', error)
      return false
    }
  }
}

export const documentSharingService = new DocumentSharingService() 