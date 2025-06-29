import { useEffect, useRef } from 'react'
import { useToastContext } from '../contexts/ToastContext'
import { notificationService, type CollaborativeNotification } from '../services/notificationService'

export function useCollaborativeNotifications() {
  const { showInfo, showSuccess, showWarning } = useToastContext()
  const unsubscribeRef = useRef<(() => void) | null>(null)

  const handleNotification = (notification: CollaborativeNotification) => {
    // Map notification priority to toast type
    const getToastType = (priority: CollaborativeNotification['priority']) => {
      switch (priority) {
        case 'high':
          return 'warning' // Use warning for high priority to get attention
        case 'medium':
          return 'info'
        case 'low':
          return 'info'
        default:
          return 'info'
      }
    }

    const toastType = getToastType(notification.priority)

    // Show the notification toast
    switch (toastType) {
      case 'warning':
        showWarning(notification.title, notification.message)
        break
      case 'info':
        showInfo(notification.title, notification.message)
        break
      default:
        showInfo(notification.title, notification.message)
        break
    }
  }

  useEffect(() => {
    // Subscribe to collaborative notifications
    unsubscribeRef.current = notificationService.subscribeToActivityNotifications(handleNotification)

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }, [])

  return {
    // Expose notification preferences management
    preferences: notificationService.getPreferences(),
    updatePreferences: notificationService.updatePreferences.bind(notificationService),
  }
} 