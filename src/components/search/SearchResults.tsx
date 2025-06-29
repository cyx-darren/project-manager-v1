import React, { useMemo, useCallback } from 'react'
import { Clock, FileText, Folder, Calendar, ArrowRight } from 'lucide-react'
import type { SearchResult } from '../../contexts/SearchContext'

interface SearchResultsProps {
  results: SearchResult[]
  searchTerm: string
  isLoading: boolean
  error: string | null
  onResultClick: (result: SearchResult) => void
  selectedIndex: number
}

const SearchResults: React.FC<SearchResultsProps> = React.memo(({
  results,
  searchTerm,
  isLoading,
  error,
  onResultClick,
  selectedIndex
}) => {
  // Group results by type - memoized to prevent recalculation
  const groupedResults = useMemo(() => {
    const projects = results.filter(r => r.type === 'project')
    const tasks = results.filter(r => r.type === 'task')
    return { projects, tasks }
  }, [results])

  // Highlight matching text - memoized for performance
  const highlightMatch = useCallback((text: string, query: string) => {
    if (!query.trim()) return text
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-yellow-200 text-yellow-900 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }, [])

  // Simply call the parent's onResultClick - no duplicate navigation
  const handleResultClick = useCallback((result: SearchResult) => {
    onResultClick(result)
  }, [onResultClick])

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'done':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800'
      case 'todo':
        return 'bg-gray-100 text-gray-800'
      case 'active':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'archived':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }, [])

  const getPriorityColor = useCallback((priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }, [])

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-500">Searching...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <div className="text-red-600 mb-2">
          <FileText className="h-8 w-8 mx-auto" />
        </div>
        <p className="text-sm text-red-600">{error}</p>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="p-4 text-center">
        <div className="text-gray-400 mb-2">
          <FileText className="h-8 w-8 mx-auto" />
        </div>
        <p className="text-sm text-gray-500">
          {searchTerm ? `No results found for "${searchTerm}"` : 'Start typing to search...'}
        </p>
      </div>
    )
  }

  let currentIndex = 0

  return (
    <div className="max-h-96 overflow-y-auto">
      {/* Projects Section */}
      {groupedResults.projects.length > 0 && (
        <div className="border-b border-gray-200">
          <div className="px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
            Projects ({groupedResults.projects.length})
          </div>
          {groupedResults.projects.map((result) => {
            const isSelected = currentIndex === selectedIndex
            const itemIndex = currentIndex++
            
            return (
              <button
                key={result.id}
                onClick={() => handleResultClick(result)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 transition-colors ${
                  isSelected ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <Folder className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {highlightMatch(result.title, searchTerm)}
                      </h3>
                      {result.status && (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(result.status)}`}>
                          {result.status}
                        </span>
                      )}
                    </div>
                    {result.description && (
                      <p className="mt-1 text-sm text-gray-500 truncate">
                        {highlightMatch(result.description, searchTerm)}
                      </p>
                    )}
                    <div className="mt-1 text-xs text-gray-400">
                      Updated {new Date(result.updated_at).toLocaleDateString()}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Tasks Section */}
      {groupedResults.tasks.length > 0 && (
        <div>
          <div className="px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
            Tasks ({groupedResults.tasks.length})
          </div>
          {groupedResults.tasks.map((result) => {
            const isSelected = currentIndex === selectedIndex
            const itemIndex = currentIndex++
            
            return (
              <button
                key={result.id}
                onClick={() => handleResultClick(result)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 transition-colors ${
                  isSelected ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <FileText className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {highlightMatch(result.title, searchTerm)}
                      </h3>
                      {result.status && (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(result.status)}`}>
                          {result.status}
                        </span>
                      )}
                      {result.priority && (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(result.priority)}`}>
                          {result.priority}
                        </span>
                      )}
                    </div>
                    {result.description && (
                      <p className="mt-1 text-sm text-gray-500 truncate">
                        {highlightMatch(result.description, searchTerm)}
                      </p>
                    )}
                    <div className="flex items-center space-x-4 mt-1 text-xs text-gray-400">
                      {result.project && (
                        <span className="flex items-center">
                          <Folder className="h-3 w-3 mr-1" />
                          {result.project.title}
                        </span>
                      )}
                      {result.due_date && (
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          Due {new Date(result.due_date).toLocaleDateString()}
                        </span>
                      )}
                      <span>Updated {new Date(result.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
})

SearchResults.displayName = 'SearchResults'

export default SearchResults 