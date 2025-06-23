import { useEffect } from 'react'

interface KeyboardShortcuts {
  onSearch?: () => void
  onEscape?: () => void
}

/**
 * Custom hook for global keyboard shortcuts
 * @param shortcuts - Object containing callback functions for different shortcuts
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcuts) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd+K or Ctrl+K for search
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        shortcuts.onSearch?.()
        return
      }

      // Escape key
      if (event.key === 'Escape') {
        shortcuts.onEscape?.()
        return
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [shortcuts])
}

export default useKeyboardShortcuts 