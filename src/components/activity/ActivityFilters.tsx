import { useState } from 'react'
import type { ActivityFilter } from '../../services/activityService'
import type { ActivityAction } from '../../types/supabase'
import { Button } from '../ui/button'
import { X, Calendar } from 'lucide-react'

interface ActivityFiltersProps {
  filters: ActivityFilter
  onFiltersChange: (filters: Partial<ActivityFilter>) => void
  onClose: () => void
}

const ENTITY_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'task', label: 'Tasks' },
  { value: 'project', label: 'Projects' },
  { value: 'comment', label: 'Comments' },
  { value: 'project_member', label: 'Team Members' },
  { value: 'workspace', label: 'Workspaces' },
  { value: 'attachment', label: 'Files' }
]

const ACTIONS: { value: ActivityAction | '', label: string }[] = [
  { value: '', label: 'All Actions' },
  { value: 'created', label: 'Created' },
  { value: 'updated', label: 'Updated' },
  { value: 'completed', label: 'Completed' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'unassigned', label: 'Unassigned' },
  { value: 'commented', label: 'Commented' },
  { value: 'status_changed', label: 'Status Changed' },
  { value: 'due_date_changed', label: 'Due Date Changed' },
  { value: 'deleted', label: 'Deleted' }
]

export const ActivityFilters = ({
  filters,
  onFiltersChange,
  onClose
}: ActivityFiltersProps) => {
  const [localFilters, setLocalFilters] = useState<ActivityFilter>(filters)

  const handleFilterChange = (key: keyof ActivityFilter, value: any) => {
    const newFilters = { ...localFilters, [key]: value || undefined }
    setLocalFilters(newFilters)
  }

  const handleApplyFilters = () => {
    onFiltersChange(localFilters)
    onClose()
  }

  const handleResetFilters = () => {
    const resetFilters: ActivityFilter = {
      projectId: filters.projectId, // Keep project context if set
      limit: filters.limit || 20,
      page: 1
    }
    setLocalFilters(resetFilters)
    onFiltersChange(resetFilters)
  }

  // Format date for input
  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    return new Date(dateString).toISOString().split('T')[0]
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Filter Activities</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Entity Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <select
            value={localFilters.entityType || ''}
            onChange={(e) => handleFilterChange('entityType', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {ENTITY_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Action Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Action
          </label>
          <select
            value={localFilters.action || ''}
            onChange={(e) => handleFilterChange('action', e.target.value as ActivityAction)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {ACTIONS.map((action) => (
              <option key={action.value} value={action.value}>
                {action.label}
              </option>
            ))}
          </select>
        </div>

        {/* Date From */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            From Date
          </label>
          <div className="relative">
            <input
              type="date"
              value={formatDate(localFilters.dateFrom)}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value ? new Date(e.target.value).toISOString() : '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Calendar className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Date To */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            To Date
          </label>
          <div className="relative">
            <input
              type="date"
              value={formatDate(localFilters.dateTo)}
              onChange={(e) => handleFilterChange('dateTo', e.target.value ? new Date(e.target.value).toISOString() : '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Calendar className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quick Filters
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleFilterChange('dateFrom', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Last 24h
          </button>
          <button
            onClick={() => handleFilterChange('dateFrom', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Last 7 days
          </button>
          <button
            onClick={() => handleFilterChange('dateFrom', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Last 30 days
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
        <Button
          variant="ghost"
          onClick={handleResetFilters}
        >
          Reset
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            onClick={handleApplyFilters}
          >
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  )
} 