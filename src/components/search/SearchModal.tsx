import React, { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import GlobalSearch from './GlobalSearch'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null)

  // Handle escape key and outside click
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.addEventListener('mousedown', handleClickOutside)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
        document.removeEventListener('mousedown', handleClickOutside)
        document.body.style.overflow = 'unset'
      }
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-25 transition-opacity" />
      
      {/* Modal */}
      <div className="flex min-h-full items-start justify-center p-4 text-center sm:p-0">
        <div 
          ref={modalRef}
          className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Search
            </h3>
            <button
              onClick={onClose}
              className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <span className="sr-only">Close</span>
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {/* Search Content */}
          <div className="px-6 py-4">
            <GlobalSearch 
              placeholder="Search projects and tasks..."
              className="w-full"
              onClose={onClose}
            />
          </div>
          
          {/* Footer with keyboard shortcuts */}
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-4">
                <span className="flex items-center">
                  <kbd className="px-2 py-1 bg-white border border-gray-200 rounded text-xs">↑↓</kbd>
                  <span className="ml-2">Navigate</span>
                </span>
                <span className="flex items-center">
                  <kbd className="px-2 py-1 bg-white border border-gray-200 rounded text-xs">Enter</kbd>
                  <span className="ml-2">Select</span>
                </span>
                <span className="flex items-center">
                  <kbd className="px-2 py-1 bg-white border border-gray-200 rounded text-xs">Esc</kbd>
                  <span className="ml-2">Close</span>
                </span>
              </div>
              <div className="flex items-center">
                <span className="flex items-center">
                  <kbd className="px-2 py-1 bg-white border border-gray-200 rounded text-xs">⌘K</kbd>
                  <span className="ml-2">Quick Search</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SearchModal 