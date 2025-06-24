import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  pointerWithin,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  type UniqueIdentifier,
  type CollisionDetection
} from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { Plus, RefreshCw, AlertCircle } from 'lucide-react'
import type { Project, Task, BoardColumn } from '../../types/supabase'
import { useTaskContext } from '../../contexts/TaskContext'
import { CustomColumn } from '../board/CustomColumn'
import { AddColumnButton } from '../board/AddColumnButton'
import { TaskCard, TaskModal, DraggableTask } from '../tasks'
import { UndoRedoControls } from '../tasks/UndoRedoControls'
import { usePermission } from '../../hooks/usePermissions'
import { BoardColumnService } from '../../services/boardColumnService'
import { useToast } from '../../hooks/useToast'
import { useAuth } from '../../contexts/AuthContext'

interface CustomKanbanBoardProps {
  project: Project
  onTasksUpdate?: (tasks: Task[]) => void
}

export const CustomKanbanBoard: React.FC<CustomKanbanBoardProps> = ({
  project,
  onTasksUpdate
}) => {
  // State
  const [columns, setColumns] = useState<BoardColumn[]>([])
  const [loadingColumns, setLoadingColumns] = useState(true)
  const [columnsError, setColumnsError] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)
  const [overId, setOverId] = useState<UniqueIdentifier | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Task edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  // Permissions
  const canCreateTasks = usePermission('task.create', { projectId: project.id }).hasPermission
  const canEditTasks = usePermission('task.edit', { projectId: project.id }).hasPermission
  const canManageColumns = usePermission('project.edit', { projectId: project.id }).hasPermission

  // Context
  const { tasks, loading: tasksLoading, error: tasksError, loadTasks, createTask, moveTaskToColumn, batchUpdateTaskOrders } = useTaskContext()
  const { showSuccess, showError } = useToast()
  const { user } = useAuth()

  // Enhanced collision detection for better task insertion
  const customCollisionDetection: CollisionDetection = useCallback((args) => {
    // First check for task collisions for precise insertion positioning
    const taskCollisions = pointerWithin({
      ...args,
      droppableContainers: args.droppableContainers.filter(container => 
        container.data.current?.type === 'task'
      )
    })

    if (taskCollisions.length > 0) {
      return taskCollisions
    }

    // Then check for column collisions
    const columnCollisions = rectIntersection({
      ...args,
      droppableContainers: args.droppableContainers.filter(container => 
        container.data.current?.type === 'column'
      )
    })

    if (columnCollisions.length > 0) {
      return columnCollisions
    }

    // Final fallback to closest center
    return closestCenter(args)
  }, [])

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  )

  // Load columns
  const loadColumns = useCallback(async () => {
    try {
      setLoadingColumns(true)
      setColumnsError(null)
      const response = await BoardColumnService.getProjectColumns(project.id)
      if (response.success && response.data) {
        setColumns(response.data)
      } else {
        setColumnsError(response.error || 'Failed to load columns')
      }
    } catch (error) {
      console.error('Error loading columns:', error)
      setColumnsError('Failed to load columns')
    } finally {
      setLoadingColumns(false)
    }
  }, [project.id])

  // Load data on mount
  useEffect(() => {
    loadColumns()
    loadTasks(project.id)
  }, [project.id, loadColumns, loadTasks])

  // Update callback
  useEffect(() => {
    if (onTasksUpdate) {
      onTasksUpdate(tasks)
    }
  }, [tasks, onTasksUpdate])

  // Group tasks by column with proper sorting
  const tasksByColumn = useMemo(() => {
    const grouped: Record<string, Task[]> = {}
    columns.forEach(column => {
      grouped[column.id] = tasks
        .filter(task => task.column_id === column.id)
        .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
    })
    return grouped
  }, [tasks, columns])

  // Get active task for drag overlay
  const activeTask = useMemo(() => {
    if (!activeId || typeof activeId !== 'string') return null
    return tasks.find(task => task.id === activeId) || null
  }, [activeId, tasks])

  // Drag handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    console.log('🎯 Drag started:', {
      activeId: active.id,
      activeData: active.data.current
    })
    setActiveId(active.id)
  }, [])

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event
    console.log('🔄 Drag over:', {
      overId: over?.id,
      overData: over?.data.current
    })
    setOverId(over?.id || null)
  }, [])

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    console.log('🎯 Drag ended:', {
      activeId: active.id,
      activeData: active.data.current,
      overId: over?.id,
      overData: over?.data.current
    })
    
    setActiveId(null)
    setOverId(null)

    if (!over) {
      console.log('❌ No drop target detected')
      return
    }

    const activeId = active.id as string
    const overId = over.id as string

    // Handle task movement
    if (active.data.current?.type === 'task') {
      const activeTask = tasks.find(task => task.id === activeId)
      if (!activeTask) {
        console.log('❌ Active task not found')
        return
      }

      console.log('📋 Task drag detected:', {
        taskTitle: activeTask.title,
        currentColumn: activeTask.column_id,
        dropTarget: over.data.current
      })

      // Check if we're dropping over a column (cross-column movement or empty column)
      if (over.data.current?.type === 'column') {
        const targetColumn = over.data.current.column as BoardColumn
        const targetTasks = tasksByColumn[targetColumn.id] || []
        
        console.log('🎯 Dropping over column:', {
          targetColumnId: targetColumn.id,
          targetColumnName: targetColumn.name,
          currentColumnId: activeTask.column_id,
          targetTaskCount: targetTasks.length
        })
        
        // Move to different column or reposition in same column
        if (activeTask.column_id !== targetColumn.id) {
          // Cross-column movement
          try {
            setIsRefreshing(true)
            console.log('🚀 Moving task to different column...')
            
            // Move to end of target column
            await moveTaskToColumn(activeTask.id, targetColumn.id, targetTasks.length)
            
            console.log(`✅ Moved task "${activeTask.title}" from column ${activeTask.column_id} to ${targetColumn.id}`)
            showSuccess('Task moved successfully')
            
          } catch (error) {
            console.error('❌ Failed to move task:', error)
            showError('Failed to move task')
          } finally {
            setIsRefreshing(false)
          }
        } else {
          console.log('ℹ️ Task dropped on same column, no move needed')
        }
        return
      }

      // Check if we're dropping over another task (within same column reordering)
      if (over.data.current?.type === 'task') {
        const overTask = tasks.find(task => task.id === overId)
        if (!overTask) {
          console.log('❌ Over task not found')
          return
        }

        console.log('🔄 Dropping over another task for reordering')
        
        // Only allow reordering within the same column
        if (activeTask.column_id === overTask.column_id && activeTask.column_id) {
          const columnTasks = tasksByColumn[activeTask.column_id] || []
          const oldIndex = columnTasks.findIndex((task: Task) => task.id === activeId)
          const newIndex = columnTasks.findIndex((task: Task) => task.id === overId)

          console.log('📊 Reordering details:', {
            columnId: activeTask.column_id,
            oldIndex,
            newIndex,
            totalTasks: columnTasks.length
          })

          if (oldIndex !== newIndex && oldIndex !== -1 && newIndex !== -1) {
            try {
              setIsRefreshing(true)
              console.log('🚀 Reordering tasks within column...')
              
              // Reorder tasks within the same column
              const reorderedTasks = arrayMove(columnTasks, oldIndex, newIndex)
              
              // Update positions in database using TaskContext's batch update
              const updates = reorderedTasks.map((task, index) => ({
                id: task.id,
                order_index: index
              }))
              
              await batchUpdateTaskOrders(updates)
              console.log('✅ Tasks reordered successfully')
              showSuccess('Tasks reordered successfully')
              
            } catch (error) {
              console.error('❌ Failed to reorder tasks:', error)
              showError('Failed to reorder tasks')
            } finally {
              setIsRefreshing(false)
            }
          } else {
            console.log('ℹ️ No reordering needed (same position or invalid index)')
          }
        } else {
          // Cross-column movement when dropping over a task in different column
          const targetColumnId = overTask.column_id
          if (targetColumnId) {
            const targetTasks = tasksByColumn[targetColumnId] || []
            const insertIndex = targetTasks.findIndex((task: Task) => task.id === overId)
            
            console.log('🔄 Cross-column drop over task:', {
              targetColumnId,
              insertIndex,
              targetTaskTitle: overTask.title
            })
            
            try {
              setIsRefreshing(true)
              console.log('🚀 Moving task to different column at specific position...')
              
              // Move to specific position in target column
              await moveTaskToColumn(activeTask.id, targetColumnId, insertIndex)
              
              console.log(`✅ Moved task "${activeTask.title}" to column ${targetColumnId} at position ${insertIndex}`)
              showSuccess('Task moved successfully')
              
            } catch (error) {
              console.error('❌ Failed to move task:', error)
              showError('Failed to move task')
            } finally {
              setIsRefreshing(false)
            }
          }
        }
      } else {
        console.log('⚠️ Unknown drop target type:', over.data.current?.type)
      }
    }

    // Handle column reordering
    if (active.data.current?.type === 'column' && over.data.current?.type === 'column') {
      const activeColumnId = activeId
      const overColumnId = overId

      if (activeColumnId !== overColumnId) {
        const oldIndex = columns.findIndex(col => col.id === activeColumnId)
        const newIndex = columns.findIndex(col => col.id === overColumnId)

        if (oldIndex !== -1 && newIndex !== -1) {
          try {
            setIsRefreshing(true)
            
            const reorderedColumns = arrayMove(columns, oldIndex, newIndex)
            
            // Update column positions in database
            await Promise.all(
              reorderedColumns.map((column, index) =>
                BoardColumnService.updateColumn(column.id, { position: index })
              )
            )

            setColumns(reorderedColumns)
            showSuccess('Columns reordered successfully')
            
          } catch (error) {
            console.error('Failed to reorder columns:', error)
            showError('Failed to reorder columns')
            // Revert on error
            loadColumns()
          } finally {
            setIsRefreshing(false)
          }
        }
      }
    }
  }, [tasks, columns, tasksByColumn, moveTaskToColumn, batchUpdateTaskOrders, showSuccess, showError, loadColumns])

  // Task handlers
  const handleCreateTask = useCallback(async (columnId?: string) => {
    if (!canCreateTasks || !user?.id) return

    const targetColumnId = columnId || columns[0]?.id
    if (!targetColumnId) return

    const targetTasks = tasksByColumn[targetColumnId] || []

    try {
      const newTask = await createTask({
        title: 'New Task',
        description: '',
        project_id: project.id,
        column_id: targetColumnId,
        order_index: targetTasks.length,
        status: 'todo',
        created_by: user.id
      })

      if (newTask) {
        showSuccess('Task created successfully')
      }
    } catch (error) {
      console.error('Error creating task:', error)
      showError('Failed to create task')
    }
  }, [canCreateTasks, user?.id, columns, tasksByColumn, createTask, project.id, showSuccess, showError])

  const handleTaskUpdated = useCallback(() => {
    // Task context already handles the update with optimistic updates
    // Just trigger a refresh to ensure UI is in sync
    setLastUpdated(new Date())
  }, [])

  const handleTaskDeleted = useCallback(() => {
    // Task context will handle the deletion
    setLastUpdated(new Date())
  }, [])

  // Modal handlers
  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false)
    setSelectedTask(null)
  }, [])

  const handleTaskUpdatedInModal = useCallback(() => {
    handleTaskUpdated()
    handleCloseEditModal()
  }, [handleTaskUpdated])

  const handleEditTask = useCallback((task: Task) => {
    setSelectedTask(task)
    setIsEditModalOpen(true)
  }, [])

  // Column handlers
  const handleColumnCreated = useCallback((newColumn: BoardColumn) => {
    setColumns(prev => [...prev, newColumn])
    setLastUpdated(new Date())
    showSuccess(`Column '${newColumn.name}' created successfully`)
  }, [showSuccess])

  const handleColumnUpdated = useCallback((updatedColumn: BoardColumn) => {
    setColumns(prev => prev.map(col => 
      col.id === updatedColumn.id ? updatedColumn : col
    ))
    setLastUpdated(new Date())
    showSuccess(`Column '${updatedColumn.name}' updated successfully`)
  }, [showSuccess])

  const handleColumnDeleted = useCallback((columnId: string) => {
    setColumns(prev => prev.filter(col => col.id !== columnId))
    setLastUpdated(new Date())
    showSuccess('Column deleted successfully')
    // Reload tasks to reflect moved tasks
    loadTasks(project.id)
  }, [showSuccess, loadTasks, project.id])

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([
        loadColumns(),
        loadTasks(project.id)
      ])
      setLastUpdated(new Date())
      showSuccess('Board refreshed successfully')
    } catch (error) {
      console.error('Error refreshing board:', error)
      showError('Failed to refresh board')
    } finally {
      setIsRefreshing(false)
    }
  }, [loadColumns, loadTasks, project.id, showSuccess, showError])

  // Loading state
  if (loadingColumns || tasksLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading board...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (columnsError || tasksError) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{columnsError || tasksError}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-6 pt-6 pb-0">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Task Board</h2>
            <p className="mt-1 text-sm text-gray-500">
              {tasks.length} total tasks across {columns.length} columns
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <UndoRedoControls />
            {canCreateTasks && (
              <button 
                onClick={() => handleCreateTask()}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Task
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Board Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-x-auto overflow-y-hidden">
          <div className="flex gap-6 h-full px-6" style={{ minWidth: `${(columns.length + 1) * 320}px` }}>
            <DndContext
              sensors={sensors}
              collisionDetection={customCollisionDetection}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              {/* Column sortable context */}
              <SortableContext items={columns.map(col => col.id)} strategy={horizontalListSortingStrategy}>
                {columns.map((column) => (
                  <CustomColumn
                    key={column.id}
                    column={column}
                    tasks={tasksByColumn[column.id] || []}
                    projectId={project.id}
                    onTaskUpdated={handleTaskUpdated}
                    onEditTask={handleEditTask}
                    onTaskDeleted={handleTaskDeleted}
                    onCreateTask={handleCreateTask}
                    onColumnUpdated={handleColumnUpdated}
                    onColumnDeleted={handleColumnDeleted}
                    canManageColumns={canManageColumns}
                  />
                ))}
              </SortableContext>

              {/* Add Column Button */}
              {canManageColumns && (
                <AddColumnButton
                  projectId={project.id}
                  onColumnCreated={handleColumnCreated}
                  position={columns.length}
                />
              )}

              {/* Drag Overlay */}
              <DragOverlay>
                {activeTask && (
                  <DraggableTask
                    task={activeTask}
                    projectId={project.id}
                    onTaskUpdated={() => {}}
                    onEditTask={() => {}}
                    isOverlay={true}
                    canEdit={false}
                  />
                )}
              </DragOverlay>
            </DndContext>
          </div>
        </div>
      </div>

      {/* Task Edit Modal */}
      <TaskModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onTaskUpdated={handleTaskUpdatedInModal}
        projectId={project.id}
        task={selectedTask}
      />
    </div>
  )
} 