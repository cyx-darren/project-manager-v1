import React, { useEffect } from 'react'
import { useCollaborativeNotifications } from '../../hooks/useCollaborativeNotifications'

interface CollaborativeNotificationsProviderProps {
  children: React.ReactNode
}

/**
 * Provider component that enables collaborative notifications throughout the app.
 * This should be placed inside the AuthProvider and ToastProvider in the component tree.
 */
export const CollaborativeNotificationsProvider: React.FC<CollaborativeNotificationsProviderProps> = ({
  children
}) => {
  // Initialize collaborative notifications
  const { preferences } = useCollaborativeNotifications()

  useEffect(() => {
    console.log('🔔 Collaborative notifications initialized with preferences:', preferences)
  }, [])

  // This component doesn't render anything itself, it just sets up the notification system
  return <>{children}</>
}

export default CollaborativeNotificationsProvider 