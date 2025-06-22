import React, { useState, useCallback } from 'react'
import { DndContext, closestCorners, DragOverlay } from '@dnd-kit/core'
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import type { Project, Task, TaskStatus } from '../../types/supabase'
import { usePermission } from '../../hooks/usePermissions'
import { DroppableColumn, TaskCard } from '../tasks'
import { TaskModal } from '../tasks'
import { taskService } from '../../services/taskService'

interface KanbanTaskBoardProps {
  project: Project
  tasks: Task[]
  onTasksUpdate: (tasks: Task[]) => void
}

const COLUMN_CONFIG = {
  todo: { title: 'To Do', id: 'todo' as TaskStatus },
  in_progress: { title: 'In Progress', id: 'in_progress' as TaskStatus },
  done: { title: 'Done', id: 'done' as TaskStatus }
}

export const KanbanTaskBoard: React.FC<KanbanTaskBoardProps> = ({
  project,
  tasks,
  onTasksUpdate
}) => {
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [overId, setOverId] = useState<string | null>(null)

  const canCreateTasks = usePermission('task.create', { projectId: project.id })
  const canEditTasks = usePermission('task.edit', { projectId: project.id })

  // Group tasks by status
  const tasksByStatus = React.useMemo(() => {
    const grouped = {
      todo: [] as Task[],
      in_progress: [] as Task[],
      done: [] as Task[]
    }

    tasks.forEach(task => {
      if (task.status in grouped) {
        grouped[task.status].push(task)
      }
    })

    // Sort by order_index within each status
    Object.keys(grouped).forEach(status => {
      grouped[status as TaskStatus].sort((a, b) => {
        const orderA = a.order_index || 0
        const orderB = b.order_index || 0
        return orderA - orderB
      })
    })

    return grouped
  }, [tasks])

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const task = tasks.find(t => t.id === active.id)
    setActiveTask(task || null)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event
    setOverId(over ? over.id as string : null)
  }

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)
    setOverId(null)

    if (!over || !canEditTasks) return

    const activeId = active.id as string
    const overId = over.id as string
    const activeTask = tasks.find(t => t.id === activeId)

    if (!activeTask) return

    // Determine if we're dropping on a column or another task
    const overData = over.data.current
    const isOverColumn = overData?.type === 'column'
    const isOverTask = overData?.type === 'task'

    let newStatus: TaskStatus = activeTask.status
    let newTasks = [...tasks]

    if (isOverColumn) {
      // Check if dropping on bottom zone
      const isBottomZone = overId.endsWith('-bottom')
      if (isBottomZone) {
        newStatus = overId.replace('-bottom', '') as TaskStatus
      } else {
        newStatus = overId as TaskStatus
      }
      
      if (newStatus !== activeTask.status || isBottomZone) {
        // Moving to a different column or dropping at bottom of same column
        const targetColumnTasks = tasksByStatus[newStatus]
        const newOrderIndex = targetColumnTasks.length

        try {
          setIsUpdating(true)
          const response = await taskService.updateTaskOrder(activeId, newStatus, newOrderIndex)
          
          if (response.success && response.data) {
            // Update local state
            newTasks = newTasks.map(task => 
              task.id === activeId 
                ? { ...task, status: newStatus, order_index: newOrderIndex }
                : task
            )
            onTasksUpdate(newTasks)
          } else {
            console.error('Failed to update task:', response.error)
          }
        } catch (error) {
          console.error('Error updating task:', error)
        } finally {
          setIsUpdating(false)
        }
      }
    } else if (isOverTask) {
      // Dropping on another task - reorder within column or move between columns
      const overTask = tasks.find(t => t.id === overId)
      if (!overTask) return

      newStatus = overTask.status

      if (activeTask.status === newStatus) {
        // Reordering within the same column
        const columnTasks = tasksByStatus[newStatus]
        const oldIndex = columnTasks.findIndex(t => t.id === activeId)
        const newIndex = columnTasks.findIndex(t => t.id === overId)

        if (oldIndex !== newIndex) {
          const reorderedTasks = arrayMove(columnTasks, oldIndex, newIndex)
          
          // Update order indices
          const updates = reorderedTasks.map((task, index) => ({
            id: task.id,
            order_index: index
          }))

          try {
            setIsUpdating(true)
            const response = await taskService.batchUpdateTaskOrders(updates)
            
            if (response.success) {
              // Update local state
              newTasks = newTasks.map(task => {
                const update = updates.find(u => u.id === task.id)
                return update 
                  ? { ...task, order_index: update.order_index }
                  : task
              })
              onTasksUpdate(newTasks)
            } else {
              console.error('Failed to update task orders:', response.error)
            }
          } catch (error) {
            console.error('Error updating task orders:', error)
          } finally {
            setIsUpdating(false)
          }
        }
      } else {
        // Moving between columns
        const targetColumnTasks = tasksByStatus[newStatus]
        const overTaskIndex = targetColumnTasks.findIndex(t => t.id === overId)
        const newOrderIndex = overTaskIndex

        try {
          setIsUpdating(true)
          const response = await taskService.updateTaskOrder(activeId, newStatus, newOrderIndex)
          
          if (response.success && response.data) {
            // Update order indices for tasks in the target column that come after the drop position
            const updatesForTargetColumn = targetColumnTasks
              .slice(newOrderIndex)
              .map((task, index) => ({
                id: task.id,
                order_index: newOrderIndex + index + 1
              }))

            if (updatesForTargetColumn.length > 0) {
              await taskService.batchUpdateTaskOrders(updatesForTargetColumn)
            }

            // Update local state
            newTasks = newTasks.map(task => {
              if (task.id === activeId) {
                return { ...task, status: newStatus, order_index: newOrderIndex }
              }
              const update = updatesForTargetColumn.find(u => u.id === task.id)
              return update 
                ? { ...task, order_index: update.order_index }
                : task
            })
            onTasksUpdate(newTasks)
          } else {
            console.error('Failed to update task:', response.error)
          }
        } catch (error) {
          console.error('Error updating task:', error)
        } finally {
          setIsUpdating(false)
        }
      }
    }
  }, [tasks, tasksByStatus, canEditTasks, onTasksUpdate])

  const handleCreateTask = () => {
    setEditingTask(null)
    setIsTaskModalOpen(true)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setIsTaskModalOpen(true)
  }

  const handleTaskCreated = (newTask: Task) => {
    onTasksUpdate([...tasks, newTask])
  }

  const handleTaskUpdated = (updatedTask: Task) => {
    onTasksUpdate(tasks.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    ))
  }

  const handleCloseModal = () => {
    setIsTaskModalOpen(false)
    setEditingTask(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Task Board</h2>
          <p className="mt-1 text-sm text-gray-500">
            {tasks.length} total tasks
          </p>
        </div>
        {canCreateTasks && (
          <button 
            onClick={handleCreateTask}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </button>
        )}
      </div>

      {/* Kanban Board */}
      <div className={`${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}>
        <DndContext
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          collisionDetection={closestCorners}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-h-[600px]">
            {Object.entries(COLUMN_CONFIG).map(([statusKey, config]) => (
              <DroppableColumn
                key={statusKey}
                id={config.id}
                title={config.title}
                tasks={tasksByStatus[statusKey as TaskStatus]}
                projectId={project.id}
                onTaskUpdated={handleTaskUpdated}
                onEditTask={handleEditTask}
                activeTaskId={activeTask?.id || null}
                overId={overId}
              />
            ))}
          </div>
          
          {/* Drag Overlay - Shows the visual preview while dragging */}
          <DragOverlay>
            {activeTask ? (
              <TaskCard
                task={activeTask}
                projectId={project.id}
                isDragOverlay={true}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={handleCloseModal}
        onTaskCreated={handleTaskCreated}
        onTaskUpdated={handleTaskUpdated}
        projectId={project.id}
        task={editingTask}
        teamMembers={[]} // TODO: Add real team members when team management is implemented
      />

      {/* Loading overlay */}
      {isUpdating && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-sm font-medium text-gray-900">Updating tasks...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 