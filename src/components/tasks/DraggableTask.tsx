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
    transition: transition || 'transform 200ms ease',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        ${isDragging ? 'opacity-30' : ''}
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