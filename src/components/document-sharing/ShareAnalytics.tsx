import React, { useState, useEffect } from 'react'
import { 
  BarChart3, 
  Eye, 
  Users, 
  Clock, 
  TrendingUp,
  Calendar,
  Download,
  MessageSquare,
  Edit3
} from 'lucide-react'
// Temporarily commented out to fix app loading issue
// import { documentSharingService } from '../../services/documentSharingService'
// import type { DocumentShare, ShareAccessLog } from '../../services/documentSharingService'

// Temporary stub types and service
type DocumentShare = {
  id: string
  access_count: number
  shared_with_user?: { email: string; name: string }
  access_level: string
}

type ShareAccessLog = {
  id: string
  share_id: string
  accessed_by: string | null
  accessed_at: string
  action: string
  accessed_by_user?: { email: string; name: string }
}

// Temporary stub service
const documentSharingService = {
  async getEntityShares(entityType: string, entityId: string) {
    return { data: [] as DocumentShare[], error: null }
  },
  async getShareAccessLogs(shareId: string) {
    return { data: [] as ShareAccessLog[], error: null }
  }
}

interface ShareAnalyticsProps {
  entityType: 'task' | 'project' | 'attachment'
  entityId: string
  className?: string
}

export const ShareAnalytics: React.FC<ShareAnalyticsProps> = ({
  entityType,
  entityId,
  className = ''
}) => {
  const [shares, setShares] = useState<DocumentShare[]>([])
  const [accessLogs, setAccessLogs] = useState<ShareAccessLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedShareId, setSelectedShareId] = useState<string | null>(null)

  useEffect(() => {
    loadAnalytics()
  }, [entityType, entityId])

  const loadAnalytics = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: sharesData, error: sharesError } = await documentSharingService.getEntityShares(entityType, entityId)
      if (sharesError) {
        setError(sharesError)
        return
      }

      setShares(sharesData || [])

      // Load access logs for all shares
      if (sharesData && sharesData.length > 0) {
        const allLogs: ShareAccessLog[] = []
        for (const share of sharesData) {
          const { data: logsData } = await documentSharingService.getShareAccessLogs(share.id)
          if (logsData) {
            allLogs.push(...logsData)
          }
        }
        setAccessLogs(allLogs)
      }
    } catch (err) {
      setError('Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  const getAnalyticsSummary = () => {
    const totalShares = shares.length
    const totalAccess = shares.reduce((sum, share) => sum + share.access_count, 0)
    const uniqueUsers = new Set(accessLogs.map(log => log.accessed_by).filter(Boolean)).size
    const recentActivity = accessLogs.filter(log => 
      new Date(log.accessed_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length

    return {
      totalShares,
      totalAccess,
      uniqueUsers,
      recentActivity
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'view': return <Eye className="w-4 h-4" />
      case 'edit': return <Edit3 className="w-4 h-4" />
      case 'comment': return <MessageSquare className="w-4 h-4" />
      case 'download': return <Download className="w-4 h-4" />
      default: return <Eye className="w-4 h-4" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'view': return 'text-blue-600'
      case 'edit': return 'text-red-600'
      case 'comment': return 'text-yellow-600'
      case 'download': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const summary = getAnalyticsSummary()
  const filteredLogs = selectedShareId 
    ? accessLogs.filter(log => log.share_id === selectedShareId)
    : accessLogs

  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="text-center py-8">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-red-600 mb-2">Failed to load analytics</p>
          <p className="text-sm text-gray-500">{error}</p>
          <button
            onClick={loadAnalytics}
            className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`} data-testid="share-analytics">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-5 h-5 text-violet-600" />
        <h3 className="text-lg font-semibold text-gray-900">Share Analytics</h3>
      </div>

      {shares.length === 0 ? (
        <div className="text-center py-8">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-2">No sharing data available</p>
          <p className="text-sm text-gray-400">
            Create shares to see analytics here
          </p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-violet-50 rounded-lg p-4" data-testid="total-shares-card">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-violet-600" />
                <span className="text-sm font-medium text-violet-700">Total Shares</span>
              </div>
              <p className="text-2xl font-bold text-violet-900">{summary.totalShares}</p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4" data-testid="total-access-card">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Total Access</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">{summary.totalAccess}</p>
            </div>

            <div className="bg-green-50 rounded-lg p-4" data-testid="unique-users-card">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">Unique Users</span>
              </div>
              <p className="text-2xl font-bold text-green-900">{summary.uniqueUsers}</p>
            </div>

            <div className="bg-orange-50 rounded-lg p-4" data-testid="recent-activity-card">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-700">This Week</span>
              </div>
              <p className="text-2xl font-bold text-orange-900">{summary.recentActivity}</p>
            </div>
          </div>

          {/* Share Filter */}
          {shares.length > 1 && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Share
              </label>
              <select
                value={selectedShareId || ''}
                onChange={(e) => setSelectedShareId(e.target.value || null)}
                className="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                data-testid="share-filter"
              >
                <option value="">All Shares</option>
                {shares.map((share) => (
                  <option key={share.id} value={share.id}>
                    {share.shared_with_user?.email || 'Public Link'} - {share.access_level}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Recent Activity */}
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-4">Recent Activity</h4>
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No activity yet</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto" data-testid="activity-logs">
                {filteredLogs
                  .sort((a, b) => new Date(b.accessed_at).getTime() - new Date(a.accessed_at).getTime())
                  .slice(0, 20)
                  .map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      data-testid={`activity-log-${log.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-1 rounded ${getActionColor(log.action)}`}>
                          {getActionIcon(log.action)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {log.accessed_by_user?.email || 'Anonymous user'}
                          </p>
                          <p className="text-xs text-gray-500 capitalize">
                            {log.action} action
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">{formatDate(log.accessed_at)}</p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
} 