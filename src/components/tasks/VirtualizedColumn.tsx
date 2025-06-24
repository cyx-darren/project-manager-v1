import React, { useMemo, useCallback } from 'react'
import { FixedSizeList as List } from 'react-window'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Task, TaskStatus } from '../../types/supabase'
import { DraggableTask } from './DraggableTask'
import { TaskPlaceholder } from './TaskPlaceholder'

interface VirtualizedColumnProps {
  id: TaskStatus
  title: string
  tasks: Task[]
  projectId: string
  onTaskUpdated: (task: Task) => void
  onEditTask: (task: Task) => void
  onTaskDeleted?: (taskId: string) => void
  activeTaskId?: string | null
  overId?: string | null
  itemHeight?: number
  maxHeight?: number
}

interface TaskItemProps {
  index: number
  style: React.CSSProperties
  data: {
    tasks: Task[]
    projectId: string
    onTaskUpdated: (task: Task) => void
    onEditTask: (task: Task) => void
    onTaskDeleted?: (taskId: string) => void
    activeTaskId?: string | null
    overId?: string | null
  }
}

const TaskItem: React.FC<TaskItemProps> = ({ index, style, data }) => {
  const {
    tasks,
    projectId,
    onTaskUpdated,
    onEditTask,
    onTaskDeleted,
    activeTaskId,
    overId
  } = data

  const task = tasks[index]
  
  if (!task) return null

  // Check if we should show a placeholder before this task
  const shouldShowPlaceholder = 
    activeTaskId !== null && 
    overId === task.id && 
    activeTaskId !== overId

  return (
    <div style={style}>
      {shouldShowPlaceholder && (
        <div className="mb-3">
          <TaskPlaceholder />
        </div>
      )}
      <div className="mb-3">
        <DraggableTask
          task={task}
          projectId={projectId}
          onTaskUpdated={onTaskUpdated}
          onEditTask={onEditTask}
          onTaskDeleted={onTaskDeleted}
        />
      </div>
    </div>
  )
}

export const VirtualizedColumn: React.FC<VirtualizedColumnProps> = ({
  id,
  title,
  tasks,
  projectId,
  onTaskUpdated,
  onEditTask,
  onTaskDeleted,
  activeTaskId,
  overId,
  itemHeight = 120, // Estimated height per task item
  maxHeight = 600
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: 'column',
      status: id,
    }
  })

  // Separate droppable for bottom zone
  const bottomZoneId = `${id}-bottom`
  const { setNodeRef: setBottomRef, isOver: isOverBottom } = useDroppable({
    id: bottomZoneId,
    data: {
      type: 'column',
      status: id,
    }
  })

  const getColumnColor = useCallback((status: TaskStatus, isDraggingOver: boolean) => {
    const baseColors = {
      todo: isDraggingOver 
        ? 'border-blue-400 bg-blue-100 shadow-lg shadow-blue-200/50' 
        : 'border-gray-300 bg-gray-50',
      in_progress: isDraggingOver 
        ? 'border-blue-400 bg-blue-100 shadow-lg shadow-blue-200/50' 
        : 'border-yellow-300 bg-yellow-50',
      done: isDraggingOver 
        ? 'border-blue-400 bg-blue-100 shadow-lg shadow-blue-200/50' 
        : 'border-green-300 bg-green-50'
    }
    
    return baseColors[status] || baseColors.todo
  }, [])

  const getColumnHeaderColor = useCallback((status: TaskStatus, isDraggingOver: boolean) => {
    if (isDraggingOver) {
      return 'text-blue-700 bg-blue-200'
    }
    
    switch (status) {
      case 'todo':
        return 'text-gray-700 bg-gray-100'
      case 'in_progress':
        return 'text-yellow-700 bg-yellow-100'
      case 'done':
        return 'text-green-700 bg-green-100'
      default:
        return 'text-gray-700 bg-gray-100'
    }
  }, [])

  // Memoize the item data to prevent unnecessary re-renders
  const itemData = useMemo(() => ({
    tasks,
    projectId,
    onTaskUpdated,
    onEditTask,
    onTaskDeleted,
    activeTaskId,
    overId
  }), [tasks, projectId, onTaskUpdated, onEditTask, onTaskDeleted, activeTaskId, overId])

  // Calculate list height based on number of tasks and max height
  const listHeight = Math.min(tasks.length * itemHeight, maxHeight)
  
  // Use virtualization only if we have more than 10 tasks
  const shouldVirtualize = tasks.length > 10

  return (
    <div
      ref={setNodeRef}
      className={`
        flex flex-col h-full min-h-[500px] rounded-lg border-2 transition-all duration-200 ease-in-out
        ${getColumnColor(id, isOver)}
        ${isOver ? 'transform scale-105' : 'transform scale-100'}
      `}
    >
      {/* Column Header */}
      <div className={`px-4 py-3 rounded-t-lg border-b transition-all duration-200 ${getColumnHeaderColor(id, isOver)}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{title}</h3>
          <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium bg-white rounded-full">
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Tasks Container */}
      <div className="flex-1 flex flex-col">
        {tasks.length === 0 ? (
          /* Empty state */
          <div className="flex-1 p-4 flex items-center justify-center">
            <div className={`
              flex items-center justify-center h-32 text-sm rounded-lg border-2 border-dashed transition-all duration-200 w-full
              ${isOver 
                ? 'border-blue-400 bg-blue-50 text-blue-600 animate-pulse' 
                : 'border-gray-300 text-gray-500'
              }
            `}>
              {isOver ? 'Release to drop task here' : 'Drop tasks here'}
            </div>
          </div>
        ) : (
          /* Tasks List */
          <div className="flex-1 p-4 pb-2">
            <SortableContext items={tasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
              {shouldVirtualize ? (
                /* Virtualized List for large datasets */
                <List
                  height={listHeight}
                  width="100%"
                  itemCount={tasks.length}
                  itemSize={itemHeight}
                  itemData={itemData}
                  className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
                >
                  {TaskItem}
                </List>
              ) : (
                /* Regular rendering for small datasets */
                <div className="space-y-3">
                  {tasks.map((task, index) => (
                    <TaskItem
                      key={task.id}
                      index={index}
                      style={{}}
                      data={itemData}
                    />
                  ))}
                </div>
              )}
            </SortableContext>
          </div>
        )}

        {/* Bottom Drop Zone - Only show for non-empty columns */}
        {tasks.length > 0 && (
          <div className="px-4 pb-4">
            {activeTaskId && (overId === id || overId === bottomZoneId || isOverBottom) ? (
              /* Show placeholder when actively dragging over this column or bottom zone */
              <TaskPlaceholder key="end-placeholder" />
            ) : (
              /* Show subtle drop zone when not actively dragging */
              <div 
                ref={setBottomRef}
                className={`
                  h-16 flex items-center justify-center text-sm rounded-lg border-2 border-dashed transition-all duration-200
                  ${activeTaskId 
                    ? 'border-gray-300 text-gray-400 hover:border-blue-300 hover:text-blue-500' 
                    : 'border-transparent text-transparent'
                  }
                `}
              >
                Drop tasks here
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 