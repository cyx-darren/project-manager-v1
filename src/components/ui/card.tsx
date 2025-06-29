import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
}

interface CardHeaderProps {
  children: React.ReactNode
  className?: string
}

interface CardTitleProps {
  children: React.ReactNode
  className?: string
}

interface CardDescriptionProps {
  children: React.ReactNode
  className?: string
}

interface CardContentProps {
  children: React.ReactNode
  className?: string
}

export const Card = ({ children, className = '' }: CardProps) => (
  <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
    {children}
  </div>
)

export const CardHeader = ({ children, className = '' }: CardHeaderProps) => (
  <div className={`p-6 pb-4 ${className}`}>
    {children}
  </div>
)

export const CardTitle = ({ children, className = '' }: CardTitleProps) => (
  <h3 className={`font-semibold text-lg text-gray-900 ${className}`}>
    {children}
  </h3>
)

export const CardDescription = ({ children, className = '' }: CardDescriptionProps) => (
  <p className={`text-sm text-gray-600 mt-1 ${className}`}>
    {children}
  </p>
)

export const CardContent = ({ children, className = '' }: CardContentProps) => (
  <div className={`p-6 pt-0 ${className}`}>
    {children}
  </div>
) 