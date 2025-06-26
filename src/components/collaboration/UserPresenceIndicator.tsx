import React from 'react';
import type { EntityPresence } from '../../services/presenceService';

interface UserPresenceIndicatorProps {
  presence: EntityPresence[];
  maxVisible?: number;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

const UserPresenceIndicator: React.FC<UserPresenceIndicatorProps> = ({
  presence,
  maxVisible = 3,
  size = 'md',
  showTooltip = true,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  };

  const getPresenceColor = (presenceType: string) => {
    switch (presenceType) {
      case 'editing':
        return 'bg-green-500 border-green-600';
      case 'viewing':
        return 'bg-blue-500 border-blue-600';
      case 'commenting':
        return 'bg-yellow-500 border-yellow-600';
      default:
        return 'bg-gray-500 border-gray-600';
    }
  };

  const getPresenceIcon = (presenceType: string) => {
    switch (presenceType) {
      case 'editing':
        return '✏️';
      case 'viewing':
        return '👁️';
      case 'commenting':
        return '💬';
      default:
        return '👤';
    }
  };

  const getUserInitials = (user: EntityPresence['user']) => {
    if (!user) return '?';
    
    const name = user.user_metadata?.full_name || user.email || 'Unknown';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const visiblePresence = presence.slice(0, maxVisible);
  const remainingCount = presence.length - maxVisible;

  if (presence.length === 0) {
    return null;
  }

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {/* Individual user avatars */}
      {visiblePresence.map((userPresence, index) => (
        <div
          key={userPresence.id}
          className={`
            relative flex items-center justify-center
            ${sizeClasses[size]}
            ${getPresenceColor(userPresence.presence_type)}
            border-2 rounded-full font-medium text-white
            shadow-sm hover:shadow-md transition-shadow
            ${index > 0 ? '-ml-2' : ''}
          `}
          title={
            showTooltip
              ? `${userPresence.user?.user_metadata?.full_name || userPresence.user?.email || 'Unknown'} is ${userPresence.presence_type}`
              : undefined
          }
        >
          {/* User initials or avatar */}
          {userPresence.user?.user_metadata?.avatar_url ? (
            <img
              src={userPresence.user.user_metadata.avatar_url}
              alt="User avatar"
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="font-semibold">
              {getUserInitials(userPresence.user)}
            </span>
          )}
          
          {/* Presence type indicator */}
          <div
            className="absolute -bottom-1 -right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center text-xs"
            title={userPresence.presence_type}
          >
            {getPresenceIcon(userPresence.presence_type)}
          </div>
        </div>
      ))}

      {/* Remaining count indicator */}
      {remainingCount > 0 && (
        <div
          className={`
            flex items-center justify-center
            ${sizeClasses[size]}
            bg-gray-500 border-2 border-gray-600 rounded-full
            font-medium text-white text-xs
            shadow-sm -ml-2
          `}
          title={`+${remainingCount} more user${remainingCount === 1 ? '' : 's'}`}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
};

export default UserPresenceIndicator; 