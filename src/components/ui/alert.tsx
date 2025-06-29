import React from 'react'

interface AlertProps {
  children: React.ReactNode
  variant?: 'default' | 'destructive'
  className?: string
}

interface AlertTitleProps {
  children: React.ReactNode
  className?: string
}

interface AlertDescriptionProps {
  children: React.ReactNode
  className?: string
}

export const Alert = ({ children, variant = 'default', className = '' }: AlertProps) => {
  const variantClasses = {
    default: 'bg-blue-50 border-blue-200 text-blue-800',
    destructive: 'bg-red-50 border-red-200 text-red-800'
  }
  
  return (
    <div className={`rounded-lg border p-4 ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  )
}

export const AlertTitle = ({ children, className = '' }: AlertTitleProps) => (
  <h5 className={`mb-1 font-medium leading-none tracking-tight ${className}`}>
    {children}
  </h5>
)

export const AlertDescription = ({ children, className = '' }: AlertDescriptionProps) => (
  <div className={`text-sm [&_p]:leading-relaxed ${className}`}>
    {children}
  </div>
) 