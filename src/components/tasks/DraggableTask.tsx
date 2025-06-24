import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { Task } from '../../types/supabase'
import { TaskCard } from './TaskCard'

interface DraggableTaskProps {
  task: Task
  projectId: string
  onTaskUpdated: (task: Task) => void
  onEditTask: (task: Task) => void
  onTaskDeleted?: (taskId: string) => void
  isActive?: boolean
  canEdit?: boolean
  isOverlay?: boolean
}

export const DraggableTask: React.FC<DraggableTaskProps> = ({
  task,
  projectId,
  onTaskUpdated,
  onEditTask,
  onTaskDeleted,
  isActive = false,
  canEdit = true,
  isOverlay = false
}) => {
  // Sortable for dragging
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
    isOver: isSortableOver,
    active,
    over
  } = useSortable({ 
    id: task.id,
    data: {
      type: 'task',
      task,
    },
    disabled: !canEdit
  })

  // Droppable for receiving drops
  const {
    setNodeRef: setDroppableRef,
    isOver: isDroppableOver
  } = useDroppable({
    id: task.id,
    data: {
      type: 'task',
      task,
    },
  })

  // Combine refs
  const setNodeRef = (node: HTMLElement | null) => {
    setSortableRef(node)
    setDroppableRef(node)
  }

  // Combined over state
  const isOver = isSortableOver || isDroppableOver

  // Enhanced transform and transition for smoother animations
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging 
      ? 'none' // No transition while actively dragging
      : transition || 'transform 250ms cubic-bezier(0.2, 0, 0, 1), opacity 200ms ease',
  }

  // Determine if this task should show insertion indicator
  // Show indicator when another task is being dragged over this one
  const showInsertionIndicator = !isDragging && active && over && 
    active.data.current?.type === 'task' && 
    over.id === task.id &&
    active.id !== task.id

  // Determine if this task should shift to make space
  const shouldShift = !isDragging && active && 
    active.data.current?.type === 'task' && 
    active.id !== task.id &&
    (isOver || showInsertionIndicator)

  return (
    <div className="relative">
      {/* Top insertion indicator - shows where the dragged item will be inserted */}
      {showInsertionIndicator && (
        <div className="absolute -top-2 left-0 right-0 h-1 bg-blue-500 rounded-full shadow-lg z-20 animate-pulse">
          <div className="absolute -left-1 -top-1 w-3 h-3 bg-blue-500 rounded-full shadow-md"></div>
          <div className="absolute -right-1 -top-1 w-3 h-3 bg-blue-500 rounded-full shadow-md"></div>
        </div>
      )}
      
      <div
        ref={setNodeRef}
        style={style}
        className={`
          transition-all duration-250 ease-out
          ${isDragging 
            ? 'opacity-50 scale-105 rotate-2 z-50 shadow-2xl' 
            : 'opacity-100 scale-100 rotate-0'
          }
          ${isActive ? 'ring-2 ring-blue-500 shadow-lg' : ''}
          ${isOverlay ? 'cursor-grabbing shadow-2xl' : 'hover:scale-[1.02] hover:shadow-md cursor-grab'}
          ${shouldShift ? 'transform translate-y-4 scale-95 opacity-80' : 'transform translate-y-0 scale-100 opacity-100'}
        `}
        {...attributes}
      >
        <TaskCard
          task={task}
          projectId={projectId}
          onTaskUpdated={onTaskUpdated}
          onEditTask={onEditTask}
          onTaskDeleted={onTaskDeleted}
          dragListeners={canEdit ? listeners : undefined}
          isDragOverlay={isDragging || isOverlay}
        />
      </div>
      
      {/* Bottom insertion indicator */}
      {showInsertionIndicator && (
        <div className="absolute -bottom-2 left-0 right-0 h-1 bg-blue-500 rounded-full shadow-lg z-20 animate-pulse">
          <div className="absolute -left-1 -top-1 w-3 h-3 bg-blue-500 rounded-full shadow-md"></div>
          <div className="absolute -right-1 -top-1 w-3 h-3 bg-blue-500 rounded-full shadow-md"></div>
        </div>
      )}
    </div>
  )
} 