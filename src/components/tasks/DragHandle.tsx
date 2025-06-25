import React from 'react'
import { GripVertical } from 'lucide-react'
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities'

interface DragHandleProps {
  listeners?: SyntheticListenerMap
  disabled?: boolean
  className?: string
}

export const DragHandle: React.FC<DragHandleProps> = ({
  listeners,
  disabled = false,
  className = ''
}) => {
  if (disabled) {
    return (
      <div className={`flex items-center justify-center w-4 h-4 text-gray-300 ${className}`}>
        <GripVertical size={14} />
      </div>
    )
  }

  return (
    <div
      className={`flex items-center justify-center w-4 h-4 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing transition-colors ${className}`}
      {...listeners}
      data-drag-handle="true"
    >
      <GripVertical size={14} />
    </div>
  )
} 