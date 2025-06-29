import { useState, useEffect } from 'react'
import { activityService } from '../../services/activityService'
import type { ActivityFilter, EnhancedActivity } from '../../services/activityService'
import { ActivityItem } from './ActivityItem'
import { ActivityFilters } from './ActivityFilters'
import { Button } from '../ui/button'
import { RefreshCw, Filter, Search, Loader2 } from 'lucide-react'

interface ActivityFeedProps {
  projectId?: string
  userId?: string
  showFilters?: boolean
  initialLimit?: number
  title?: string
}

export const ActivityFeed = ({
  projectId,
  userId,
  showFilters = true,
  initialLimit = 20,
  title = "Activity Feed"
}: ActivityFeedProps) => {
  const [activities, setActivities] = useState<EnhancedActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<ActivityFilter>({
    projectId,
    userId,
    limit: initialLimit,
    page: 1
  })
  const [hasMore, setHasMore] = useState(false)
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const loadActivities = async (newFilters: ActivityFilter = filters, append = false) => {
    try {
      if (!append) {
        setLoading(true)
        setError(null)
      } else {
        setLoadingMore(true)
      }

      const result = await activityService.getActivities(newFilters)

      if (result.success && result.data) {
        if (append) {
          setActivities(prev => [...prev, ...result.data!])
        } else {
          setActivities(result.data)
        }
        setHasMore(result.pagination?.hasMore || false)
      } else {
        setError(result.error || 'Failed to load activities')
      }
    } catch (err) {
      setError('Failed to load activities')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const handleFilterChange = (newFilters: Partial<ActivityFilter>) => {
    const updatedFilters = { ...filters, ...newFilters, page: 1 }
    setFilters(updatedFilters)
    loadActivities(updatedFilters)
  }

  const handleLoadMore = () => {
    const nextPageFilters = { ...filters, page: (filters.page || 1) + 1 }
    setFilters(nextPageFilters)
    loadActivities(nextPageFilters, true)
  }

  const handleRefresh = () => {
    loadActivities({ ...filters, page: 1 })
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadActivities()
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const result = await activityService.searchActivities(searchQuery, {
        projectId: filters.projectId,
        userId: filters.userId,
        entityType: filters.entityType,
        action: filters.action
      })

      if (result.success && result.data) {
        setActivities(result.data)
        setHasMore(false) // Search results don't support pagination
      } else {
        setError(result.error || 'Failed to search activities')
      }
    } catch (err) {
      setError('Failed to search activities')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadActivities()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading && activities.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {showFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilterPanel(!showFilterPanel)}
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search activities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <Button onClick={handleSearch} disabled={loading}>
          <Search className="w-4 h-4" />
          Search
        </Button>
      </div>

      {/* Filters Panel */}
      {showFilters && showFilterPanel && (
        <ActivityFilters
          filters={filters}
          onFiltersChange={handleFilterChange}
          onClose={() => setShowFilterPanel(false)}
        />
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Activity List */}
      <div className="space-y-4">
        {activities.length === 0 && !loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No activities found</div>
            <p className="text-gray-400 mt-2">
              {searchQuery ? 'Try adjusting your search criteria' : 'Activities will appear here as users interact with the system'}
            </p>
          </div>
        ) : (
          activities.map((activity) => (
            <ActivityItem
              key={activity.id}
              activity={activity}
            />
          ))
        )}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
    </div>
  )
} 