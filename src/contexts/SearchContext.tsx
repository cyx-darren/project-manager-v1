import React, { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { Task, Project } from '../types/supabase'

export interface SearchResult {
  id: string
  type: 'project' | 'task'
  title: string
  description?: string
  project?: {
    id: string
    title: string
  }
  status?: string
  priority?: string
  due_date?: string
  created_at: string
  updated_at: string
}

export interface SearchState {
  searchTerm: string
  results: SearchResult[]
  isLoading: boolean
  error: string | null
  isOpen: boolean
}

export interface SearchContextType {
  state: SearchState
  setSearchTerm: (term: string) => void
  setResults: (results: SearchResult[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setOpen: (open: boolean) => void
  clearSearch: () => void
}

const SearchContext = createContext<SearchContextType | undefined>(undefined)

export const useSearch = (): SearchContextType => {
  const context = useContext(SearchContext)
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider')
  }
  return context
}

interface SearchProviderProps {
  children: ReactNode
}

export const SearchProvider: React.FC<SearchProviderProps> = ({ children }) => {
  const [state, setState] = useState<SearchState>({
    searchTerm: '',
    results: [],
    isLoading: false,
    error: null,
    isOpen: false
  })

  const setSearchTerm = useCallback((term: string) => {
    setState(prev => ({ ...prev, searchTerm: term }))
  }, [])

  const setResults = useCallback((results: SearchResult[]) => {
    setState(prev => ({ ...prev, results }))
  }, [])

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }))
  }, [])

  const setError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, error }))
  }, [])

  const setOpen = useCallback((open: boolean) => {
    setState(prev => ({ ...prev, isOpen: open }))
  }, [])

  const clearSearch = useCallback(() => {
    setState({
      searchTerm: '',
      results: [],
      isLoading: false,
      error: null,
      isOpen: false
    })
  }, [])

  const contextValue: SearchContextType = {
    state,
    setSearchTerm,
    setResults,
    setLoading,
    setError,
    setOpen,
    clearSearch
  }

  return (
    <SearchContext.Provider value={contextValue}>
      {children}
    </SearchContext.Provider>
  )
} 