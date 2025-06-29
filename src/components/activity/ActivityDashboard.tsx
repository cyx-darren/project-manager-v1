import { useState, useEffect } from 'react'
import { activityService } from '../../services/activityService'
import type { ActivityStats, UserActivitySummary } from '../../services/activityService'
import { ActivityFeed } from './ActivityFeed'
import { getCurrentUser } from '../../config/supabase'
import { 
  Activity, 
  TrendingUp, 
  Users, 
  Clock, 
  Calendar,
  BarChart3,
  Loader2,
  ChevronRight
} from 'lucide-react'

export const ActivityDashboard = () => {
  const [stats, setStats] = useState<ActivityStats | null>(null)
  const [userSummary, setUserSummary] = useState<UserActivitySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedView, setSelectedView] = useState<'overview' | 'personal' | 'analytics'>('overview')

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      const user = await getCurrentUser()
      if (!user) {
        throw new Error('Must be authenticated')
      }

      // Load activity stats and user summary in parallel
      const [statsResult, summaryResult] = await Promise.all([
        activityService.getActivityStats(),
        activityService.getUserActivitySummary(user.id)
      ])

      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data)
      } else {
        console.warn('Failed to load activity stats:', statsResult.error)
      }

      if (summaryResult.success && summaryResult.data) {
        setUserSummary(summaryResult.data)
      } else {
        console.warn('Failed to load user summary:', summaryResult.error)
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading activity dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-medium mb-2">Error Loading Dashboard</h3>
        <p className="text-red-600">{error}</p>
        <button 
          onClick={loadDashboardData}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Activities</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalActivities}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today</p>
                <p className="text-3xl font-bold text-gray-900">{stats.todayActivities}</p>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-3xl font-bold text-gray-900">{stats.weekActivities}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-3xl font-bold text-gray-900">{stats.monthActivities}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>
      )}

      {/* Top Actions */}
      {stats && stats.topActions.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Actions</h3>
          <div className="space-y-3">
            {stats.topActions.map((action, index) => (
              <div key={action.action} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <span className="capitalize text-gray-700">{action.action.replace('_', ' ')}</span>
                </div>
                <span className="text-gray-900 font-medium">{action.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity Feed */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        </div>
        <div className="p-6">
          <ActivityFeed 
            showFilters={false}
            initialLimit={10}
            title=""
          />
        </div>
      </div>
    </div>
  )

  const renderPersonal = () => (
    <div className="space-y-6">
      {/* User Summary */}
      {userSummary && (
        <>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Your Activity Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Activities</p>
                <p className="text-2xl font-bold text-gray-900">{userSummary.totalActivities}</p>
              </div>
              {userSummary.mostActiveProject && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Most Active Project</p>
                  <p className="text-lg font-medium text-gray-900">{userSummary.mostActiveProject.projectName}</p>
                  <p className="text-sm text-gray-500">{userSummary.mostActiveProject.activityCount} activities</p>
                </div>
              )}
            </div>
          </div>

          {/* Activity Breakdown */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Activity Breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(userSummary.activityBreakdown).map(([action, count]) => (
                <div key={action} className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                  <p className="text-sm text-gray-600 capitalize">{action.replace('_', ' ')}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Personal Activity Feed */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Your Recent Activities</h3>
        </div>
        <div className="p-6">
          <ActivityFeed 
            userId={userSummary?.userId}
            showFilters={true}
            initialLimit={20}
            title=""
          />
        </div>
      </div>
    </div>
  )

  const renderAnalytics = () => (
    <div className="space-y-6">
      {/* Activity by Hour Chart */}
      {stats && stats.activityByHour.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Activity by Hour</h3>
          <div className="grid grid-cols-12 gap-2">
            {stats.activityByHour.map((hourData) => (
              <div key={hourData.hour} className="text-center">
                <div 
                  className="bg-blue-200 rounded-t"
                  style={{ 
                    height: `${Math.max(4, (hourData.count / Math.max(...stats.activityByHour.map(d => d.count))) * 60)}px` 
                  }}
                />
                <div className="text-xs text-gray-600 mt-1">{hourData.hour}</div>
                <div className="text-xs font-medium text-gray-900">{hourData.count}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Users */}
      {stats && stats.topUsers.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Most Active Users</h3>
          <div className="space-y-3">
            {stats.topUsers.map((user, index) => (
              <div key={user.userId} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{user.userName}</span>
                  </div>
                </div>
                <span className="text-gray-900 font-medium">{user.count} activities</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity Timeline */}
      {stats && stats.activityByDay.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Activity Timeline (Last 30 Days)</h3>
          <div className="space-y-2">
            {stats.activityByDay.slice(-10).map((dayData) => (
              <div key={dayData.date} className="flex items-center gap-4">
                <div className="w-20 text-sm text-gray-600">
                  {new Date(dayData.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ 
                      width: `${Math.max(4, (dayData.count / Math.max(...stats.activityByDay.map(d => d.count))) * 100)}%` 
                    }}
                  />
                </div>
                <div className="w-12 text-sm font-medium text-gray-900">{dayData.count}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Activity Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor user activities and system engagement</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'personal', label: 'Personal', icon: Users },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedView(tab.id as any)}
                className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedView === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Content */}
      {selectedView === 'overview' && renderOverview()}
      {selectedView === 'personal' && renderPersonal()}
      {selectedView === 'analytics' && renderAnalytics()}
    </div>
  )
} 