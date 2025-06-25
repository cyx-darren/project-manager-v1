import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, Command } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSearch } from '../../contexts/SearchContext'
import { useAuth } from '../../contexts/AuthContext'
import { useDebounce } from '../../hooks/useDebounce'
import { searchService } from '../../services/searchService'
import SearchResults from './SearchResults'
import type { SearchResult } from '../../contexts/SearchContext'
import { generateTaskUrl, generateProjectTabUrl } from '../../utils/urlHelpers'

interface GlobalSearchProps {
  placeholder?: string
  className?: string
  onClose?: () => void
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({
  placeholder = "Search projects and tasks...",
  className = "",
  onClose
}) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { state, setSearchTerm, setResults, setLoading, setError, setOpen, clearSearch } = useSearch()
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Debounce search term to optimize API calls
  const debouncedSearchTerm = useDebounce(state.searchTerm, 300)

  // Memoize the search function to prevent recreating it on every render
  const performSearch = useCallback(async (searchTerm: string, userId: string) => {
    if (!searchTerm.trim()) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await searchService.globalSearch(searchTerm, userId)
      
      if (response.error) {
        setError(response.error)
        setResults([])
      } else {
        setResults(response.data || [])
        setError(null)
      }
    } catch (error) {
      console.error('Search error:', error)
      setError('Search failed. Please try again.')
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [setResults, setLoading, setError])

  // Perform search when debounced term changes
  useEffect(() => {
    if (!user) {
      setResults([])
      setLoading(false)
      return
    }

    if (!debouncedSearchTerm.trim()) {
      setResults([])
      setLoading(false)
      return
    }

    performSearch(debouncedSearchTerm, user.id)
  }, [debouncedSearchTerm, user, performSearch])

  // Handle keyboard navigation with improved error handling
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const resultCount = state.results.length

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        e.stopPropagation()
        setSelectedIndex(prev => Math.min(prev + 1, resultCount - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        e.stopPropagation()
        setSelectedIndex(prev => Math.max(prev - 1, -1))
        break
      case 'Enter':
        e.preventDefault()
        e.stopPropagation()
        if (selectedIndex >= 0 && state.results[selectedIndex]) {
          try {
            handleResultClick(state.results[selectedIndex])
          } catch (error) {
            console.error('Error handling result selection:', error)
          }
        }
        break
      case 'Escape':
        e.preventDefault()
        e.stopPropagation()
        handleClose()
        break
      default:
        break
    }
  }

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    setSelectedIndex(-1)
    
    // Open search results if there's a value
    if (value.trim()) {
      setOpen(true)
    }
  }

  // Handle input focus
  const handleInputFocus = () => {
    setIsFocused(true)
    if (state.searchTerm.trim()) {
      setOpen(true)
    }
  }

  // Handle input blur
  const handleInputBlur = () => {
    setIsFocused(false)
    // Delay closing to allow clicking on results
    setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        setOpen(false)
      }
    }, 200)
  }

  // Handle result click with proper navigation
  const handleResultClick = useCallback((result: SearchResult) => {
    try {
      // Navigate to the appropriate page
      if (result.type === 'project') {
        navigate(generateProjectTabUrl(result.id, 'overview'))
      } else if (result.type === 'task' && result.project) {
        // Navigate to task URL with proper context
        const taskUrl = generateTaskUrl(result.project.id, 'tasks', result.id, { mode: 'view' })
        navigate(taskUrl)
      }
      
      // Close search and clear after navigation
      setOpen(false)
      clearSearch()
      
      if (onClose) {
        onClose()
      }
    } catch (error) {
      console.error('Navigation error:', error)
    }
  }, [navigate, setOpen, clearSearch, onClose])

  // Handle clear search
  const handleClear = () => {
    clearSearch()
    inputRef.current?.focus()
  }

  // Handle close
  const handleClose = () => {
    setOpen(false)
    clearSearch()
    if (onClose) {
      onClose()
    }
  }

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    if (state.isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [state.isOpen, setOpen])

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(-1)
  }, [state.results])

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={state.searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          className={`block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors ${
            isFocused ? 'ring-2 ring-blue-500 border-blue-500' : ''
          }`}
          aria-label="Search projects and tasks"
          aria-autocomplete="list"
          aria-controls={state.isOpen ? 'search-results' : undefined}
          aria-expanded={state.isOpen}
        />
        
        {/* Clear Button */}
        {state.searchTerm && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Search Results */}
      {state.isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <SearchResults
            results={state.results}
            searchTerm={state.searchTerm}
            isLoading={state.isLoading}
            error={state.error}
            onResultClick={handleResultClick}
            selectedIndex={selectedIndex}
          />
        </div>
      )}
    </div>
  )
}

export default GlobalSearch 