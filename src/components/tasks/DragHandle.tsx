import React from 'react'
import { GripVertical } from 'lucide-react'
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities'

interface DragHandleProps {
  listeners?: SyntheticListenerMap
  className?: string
  disabled?: boolean
}

export const DragHandle: React.FC<DragHandleProps> = ({
  listeners,
  className = '',
  disabled = false
}) => {
  if (disabled || !listeners) {
    return null
  }

  return (
    <button
      className={`
        flex items-center justify-center w-6 h-6 text-gray-400 hover:text-gray-600 
        hover:bg-gray-100 hover:scale-110 rounded cursor-grab active:cursor-grabbing active:scale-95
        transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
        ${className}
      `}
      {...listeners}
      title="Drag to move task"
      aria-label="Drag handle"
    >
      <GripVertical size={14} />
    </button>
  )
} 