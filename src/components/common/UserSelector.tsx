import React, { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronDownIcon, XMarkIcon, UserIcon } from '@heroicons/react/24/outline'
import type { AssignableUser } from '../../services/teamService'

interface UserSelectorProps {
  users: AssignableUser[]
  selectedUser: AssignableUser | null
  onUserSelect: (user: AssignableUser | null) => void
  onSearch?: (searchTerm: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  allowUnassigned?: boolean
  isSearching?: boolean
}

export const UserSelector: React.FC<UserSelectorProps> = ({
  users,
  selectedUser,
  onUserSelect,
  onSearch,
  placeholder = "Select assignee...",
  disabled = false,
  className = "",
  allowUnassigned = true,
  isSearching = false
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredUsers, setFilteredUsers] = useState<AssignableUser[]>(users)
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onSearch) {
        onSearch(searchTerm)
      } else {
        // Local filtering if no search handler provided
        const filtered = users.filter(user => {
          const email = user.email?.toLowerCase() || ''
          const name = user.user_metadata?.full_name?.toLowerCase() || ''
          const term = searchTerm.toLowerCase()
          return email.includes(term) || name.includes(term)
        })
        setFilteredUsers(filtered)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, users, onSearch])

  // Update filtered users when users prop changes
  useEffect(() => {
    if (!onSearch) {
      setFilteredUsers(users)
    }
  }, [users, onSearch])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Calculate dropdown position to prevent cutoff
  const calculateDropdownPosition = useCallback(() => {
    if (!triggerRef.current) return

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const windowHeight = window.innerHeight
    const dropdownHeight = 300 // max height we set
    const spaceBelow = windowHeight - triggerRect.bottom
    const spaceAbove = triggerRect.top

    // If there's not enough space below but enough above, position upward
    if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
      setDropdownPosition('top')
    } else {
      setDropdownPosition('bottom')
    }
  }, [])

  // Focus search input when dropdown opens and calculate position
  useEffect(() => {
    if (isOpen) {
      calculateDropdownPosition()
      if (searchInputRef.current) {
        searchInputRef.current.focus()
      }
    }
  }, [isOpen, calculateDropdownPosition])

  const handleUserSelect = (user: AssignableUser | null) => {
    onUserSelect(user)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false)
      setSearchTerm('')
    } else if (event.key === 'Enter' && filteredUsers.length === 1) {
      handleUserSelect(filteredUsers[0])
    }
  }

  const getUserDisplayName = (user: AssignableUser) => {
    return user.user_metadata?.full_name || user.email || 'Unknown User'
  }

  const getUserInitials = (user: AssignableUser) => {
    const name = user.user_metadata?.full_name
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return user.email?.charAt(0).toUpperCase() || 'U'
  }

  const UserAvatar: React.FC<{ user: AssignableUser; size?: 'sm' | 'md' }> = ({ user, size = 'sm' }) => {
    const sizeClasses = size === 'sm' ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'
    
    if (user.user_metadata?.avatar_url) {
      return (
        <img
          src={user.user_metadata.avatar_url}
          alt={getUserDisplayName(user)}
          className={`${sizeClasses} rounded-full object-cover`}
        />
      )
    }
    
    return (
      <div className={`${sizeClasses} rounded-full bg-blue-500 text-white flex items-center justify-center font-medium`}>
        {getUserInitials(user)}
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between px-3 py-2 border rounded-lg
          ${disabled 
            ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' 
            : 'bg-white border-gray-300 text-gray-900 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          }
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          {selectedUser ? (
            <>
              <UserAvatar user={selectedUser} />
              <span className="truncate">{getUserDisplayName(selectedUser)}</span>
            </>
          ) : (
            <>
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                <UserIcon className="w-4 h-4 text-gray-400" />
              </div>
              <span className="text-gray-500">{placeholder}</span>
            </>
          )}
        </div>
        <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div 
          className={`absolute z-[9999] w-full bg-white border border-gray-300 rounded-lg shadow-xl ${
            dropdownPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'
          }`}
          style={{
            maxHeight: '300px',
            minHeight: '120px'
          }}
        >
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200 bg-white rounded-t-lg">
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search users..."
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Options List */}
          <div 
            className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100" 
            role="listbox"
            style={{
              maxHeight: '240px',
              minHeight: '60px'
            }}
          >
            {/* Unassigned Option */}
            {allowUnassigned && (
              <button
                type="button"
                onClick={() => handleUserSelect(null)}
                className={`
                  w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50
                  ${!selectedUser ? 'bg-blue-50 text-blue-700' : 'text-gray-900'}
                `}
                role="option"
                aria-selected={!selectedUser}
              >
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                  <XMarkIcon className="w-4 h-4 text-gray-400" />
                </div>
                <span>Unassigned</span>
              </button>
            )}

            {/* Loading State */}
            {isSearching && (
              <div className="px-3 py-2 text-sm text-gray-500 flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span>Searching...</span>
              </div>
            )}

            {/* User Options */}
            {!isSearching && filteredUsers.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => handleUserSelect(user)}
                className={`
                  w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50
                  ${selectedUser?.id === user.id ? 'bg-blue-50 text-blue-700' : 'text-gray-900'}
                `}
                role="option"
                aria-selected={selectedUser?.id === user.id}
              >
                <UserAvatar user={user} />
                <div className="flex-1 min-w-0">
                  <div className="truncate font-medium">{getUserDisplayName(user)}</div>
                  {user.user_metadata?.full_name && user.email && (
                    <div className="truncate text-xs text-gray-500">{user.email}</div>
                  )}
                </div>
              </button>
            ))}

            {/* No Results */}
            {!isSearching && filteredUsers.length === 0 && searchTerm && (
              <div className="px-3 py-2 text-sm text-gray-500">
                No users found matching "{searchTerm}"
              </div>
            )}

            {/* Empty State */}
            {!isSearching && filteredUsers.length === 0 && !searchTerm && (
              <div className="px-3 py-2 text-sm text-gray-500">
                No users available
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default UserSelector 