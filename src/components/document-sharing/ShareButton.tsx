import React, { useState } from 'react'
import { Share2 } from 'lucide-react'
import { ShareModal } from './ShareModal'

interface ShareButtonProps {
  entityType: 'task' | 'project' | 'attachment'
  entityId: string
  entityTitle: string
  className?: string
  variant?: 'primary' | 'secondary' | 'icon'
  size?: 'sm' | 'md' | 'lg'
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  entityType,
  entityId,
  entityTitle,
  className = '',
  variant = 'secondary',
  size = 'md'
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const getButtonClasses = () => {
    const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2'
    
    const sizeClasses = {
      sm: 'px-2 py-1 text-xs',
      md: 'px-3 py-2 text-sm',
      lg: 'px-4 py-2 text-base'
    }

    const variantClasses = {
      primary: 'bg-violet-600 text-white hover:bg-violet-700 border border-transparent rounded-md',
      secondary: 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md',
      icon: 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full p-2'
    }

    return `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`
  }

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 'w-3 h-3'
      case 'lg': return 'w-5 h-5'
      default: return 'w-4 h-4'
    }
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={getButtonClasses()}
        data-testid="share-button"
        title="Share"
      >
        <Share2 className={getIconSize()} />
        {variant !== 'icon' && 'Share'}
      </button>

      <ShareModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        entityType={entityType}
        entityId={entityId}
        entityTitle={entityTitle}
      />
    </>
  )
} 