import React from 'react'

interface ProgressProps {
  value: number
  className?: string
  max?: number
}

export const Progress = ({ value, max = 100, className = '' }: ProgressProps) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  
  return (
    <div className={`relative w-full overflow-hidden rounded-full bg-gray-200 h-2 ${className}`}>
      <div 
        className="h-full bg-blue-600 transition-all duration-300 ease-in-out rounded-full"
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
} 