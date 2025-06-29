import React from 'react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'destructive' | 'secondary' | 'outline'
  className?: string
}

export const Badge = ({ children, variant = 'default', className = '' }: BadgeProps) => {
  const variantClasses = {
    default: 'bg-blue-100 text-blue-800 border-blue-200',
    destructive: 'bg-red-100 text-red-800 border-red-200',
    secondary: 'bg-gray-100 text-gray-800 border-gray-200',
    outline: 'text-gray-700 border-gray-200'
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  )
} 