import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Task } from '../../types/supabase'
import { usePermission } from '../../hooks/usePermissions'
import { TaskCard } from './TaskCard'

interface DraggableTaskProps {
  task: Task
  projectId: string
  onTaskUpdated: (task: Task) => void
  onEditTask: (task: Task) => void
  onTaskDeleted?: (taskId: string) => void
}

export const DraggableTask: React.FC<DraggableTaskProps> = ({
  task,
  projectId,
  onTaskUpdated,
  onEditTask,
  onTaskDeleted
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: task.id,
    data: {
      type: 'task',
      task,
    }
  })

  const canEditTasks = usePermission('task.edit', { projectId })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 300ms cubic-bezier(0.2, 0, 0, 1)',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        transition-all duration-300 ease-out
        ${isDragging 
          ? 'opacity-40 scale-105 rotate-2 z-50 shadow-2xl' 
          : 'opacity-100 scale-100 rotate-0 hover:scale-[1.02] hover:shadow-lg'
        }
      `}
      {...attributes}
    >
      <TaskCard
        task={task}
        projectId={projectId}
        onTaskUpdated={onTaskUpdated}
        onEditTask={onEditTask}
        onTaskDeleted={onTaskDeleted}
        dragListeners={canEditTasks ? listeners : undefined}
      />
    </div>
  )
} 