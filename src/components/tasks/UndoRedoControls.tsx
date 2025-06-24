import React, { useEffect } from 'react'
import { Undo2, Redo2 } from 'lucide-react'
import { useTaskContext } from '../../contexts/TaskContext'

interface UndoRedoControlsProps {
  className?: string
}

export const UndoRedoControls: React.FC<UndoRedoControlsProps> = ({ 
  className = '' 
}) => {
  const { canUndo, canRedo, undo, redo } = useTaskContext()

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl+Z (undo) or Cmd+Z (undo)
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault()
        if (canUndo) {
          undo()
        }
      }
      
      // Check for Ctrl+Shift+Z (redo) or Cmd+Shift+Z (redo) or Ctrl+Y (redo)
      if (
        ((event.ctrlKey || event.metaKey) && event.key === 'z' && event.shiftKey) ||
        (event.ctrlKey && event.key === 'y')
      ) {
        event.preventDefault()
        if (canRedo) {
          redo()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [canUndo, canRedo, undo, redo])

  if (!canUndo && !canRedo) {
    return null // Don't show controls if no actions are available
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={undo}
        disabled={!canUndo}
        className={`
          flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg
          transition-all duration-200 ease-out
          ${canUndo
            ? 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm active:scale-95'
            : 'text-gray-400 bg-gray-100 border border-gray-200 cursor-not-allowed'
          }
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
        `}
        title="Undo (Ctrl+Z)"
        aria-label="Undo last action"
      >
        <Undo2 className="w-4 h-4" />
        <span className="hidden sm:inline">Undo</span>
      </button>

      <button
        onClick={redo}
        disabled={!canRedo}
        className={`
          flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg
          transition-all duration-200 ease-out
          ${canRedo
            ? 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm active:scale-95'
            : 'text-gray-400 bg-gray-100 border border-gray-200 cursor-not-allowed'
          }
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
        `}
        title="Redo (Ctrl+Shift+Z)"
        aria-label="Redo last undone action"
      >
        <Redo2 className="w-4 h-4" />
        <span className="hidden sm:inline">Redo</span>
      </button>
    </div>
  )
} 