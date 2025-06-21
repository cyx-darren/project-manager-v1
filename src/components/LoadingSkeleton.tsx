import React from 'react'

interface SkeletonProps {
  className?: string
  children?: React.ReactNode
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', children }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`}>
    {children}
  </div>
)

export const ProjectSkeleton: React.FC = () => (
  <div className="space-y-2">
    {[1, 2, 3].map((i) => (
      <div key={i} className="flex items-center space-x-3 p-2">
        <Skeleton className="w-8 h-8 rounded-full" />
        <div className="flex-1 space-y-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="w-6 h-6 rounded" />
      </div>
    ))}
  </div>
)

export const NavigationSkeleton: React.FC = () => (
  <div className="space-y-1">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="flex items-center space-x-3 p-2">
        <Skeleton className="w-5 h-5" />
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="w-4 h-4 rounded-full" />
      </div>
    ))}
  </div>
)

export const StatsSkeleton: React.FC = () => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-4 w-1/4" />
    </div>
    <div className="grid grid-cols-2 gap-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="text-center space-y-1">
          <Skeleton className="h-6 w-8 mx-auto" />
          <Skeleton className="h-3 w-12 mx-auto" />
        </div>
      ))}
    </div>
  </div>
)

export const UserProfileSkeleton: React.FC = () => (
  <div className="flex items-center space-x-3 p-3">
    <Skeleton className="w-10 h-10 rounded-full" />
    <div className="flex-1 space-y-1">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
    <Skeleton className="w-6 h-6" />
  </div>
)

export const BreadcrumbSkeleton: React.FC = () => (
  <div className="flex items-center space-x-2 px-3 py-2">
    <Skeleton className="h-4 w-16" />
    <Skeleton className="h-4 w-1" />
    <Skeleton className="h-4 w-20" />
    <Skeleton className="h-4 w-1" />
    <Skeleton className="h-4 w-24" />
  </div>
)

export default Skeleton 