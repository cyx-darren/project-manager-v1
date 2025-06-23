import React from 'react'
import { UserIcon } from '@heroicons/react/24/outline'
import type { AssignableUser } from '../../services/teamService'

interface AssigneeAvatarProps {
  user: AssignableUser | null
  size?: 'xs' | 'sm' | 'md' | 'lg'
  showTooltip?: boolean
  className?: string
}

export const AssigneeAvatar: React.FC<AssigneeAvatarProps> = ({
  user,
  size = 'sm',
  showTooltip = true,
  className = ''
}) => {
  if (!user) {
    return (
      <div
        className={`
          ${getSizeClasses(size)} 
          rounded-full bg-gray-200 flex items-center justify-center
          ${className}
        `}
        title={showTooltip ? 'Unassigned' : undefined}
      >
        <UserIcon className={`${getIconSize(size)} text-gray-400`} />
      </div>
    )
  }

  const displayName = getUserDisplayName(user)
  const initials = getUserInitials(user)

  if (user.user_metadata?.avatar_url) {
    return (
      <img
        src={user.user_metadata.avatar_url}
        alt={displayName}
        title={showTooltip ? displayName : undefined}
        className={`
          ${getSizeClasses(size)} 
          rounded-full object-cover border border-gray-200
          ${className}
        `}
      />
    )
  }

  return (
    <div
      className={`
        ${getSizeClasses(size)} 
        rounded-full bg-gradient-to-br from-blue-500 to-blue-600 
        text-white flex items-center justify-center font-medium
        ${className}
      `}
      title={showTooltip ? displayName : undefined}
    >
      <span className={getTextSize(size)}>{initials}</span>
    </div>
  )
}

// Helper functions
const getSizeClasses = (size: string) => {
  switch (size) {
    case 'xs':
      return 'w-4 h-4'
    case 'sm':
      return 'w-6 h-6'
    case 'md':
      return 'w-8 h-8'
    case 'lg':
      return 'w-10 h-10'
    default:
      return 'w-6 h-6'
  }
}

const getIconSize = (size: string) => {
  switch (size) {
    case 'xs':
      return 'w-2 h-2'
    case 'sm':
      return 'w-3 h-3'
    case 'md':
      return 'w-4 h-4'
    case 'lg':
      return 'w-5 h-5'
    default:
      return 'w-3 h-3'
  }
}

const getTextSize = (size: string) => {
  switch (size) {
    case 'xs':
      return 'text-xs'
    case 'sm':
      return 'text-xs'
    case 'md':
      return 'text-sm'
    case 'lg':
      return 'text-base'
    default:
      return 'text-xs'
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

export default AssigneeAvatar 