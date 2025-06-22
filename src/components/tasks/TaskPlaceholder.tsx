import React from 'react'

interface TaskPlaceholderProps {
  height?: number
}

export const TaskPlaceholder: React.FC<TaskPlaceholderProps> = ({ 
  height = 80 
}) => {
  return (
    <div 
      className="border-2 border-dashed border-blue-400 bg-blue-50 rounded-lg transition-all duration-200 animate-pulse"
      style={{ height: `${height}px` }}
    >
      <div className="flex items-center justify-center h-full">
        <div className="text-blue-600 text-sm font-medium">
          Drop task here
        </div>
      </div>
    </div>
  )
} 