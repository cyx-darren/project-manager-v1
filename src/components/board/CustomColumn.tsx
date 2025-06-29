import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus, MoreHorizontal, Edit2, Trash2, GripVertical } from 'lucide-react'
import type { BoardColumn, Task } from '../../types/supabase'
import { DraggableTask } from '../tasks/DraggableTask'
import { BoardColumnService } from '../../services/boardColumnService'

interface CustomColumnProps {
  column: BoardColumn
  tasks: Task[]
  projectId: string
  onTaskUpdated: (task: Task) => void
  onEditTask: (task: Task) => void
  onTaskDeleted: (taskId: string) => void
  onCreateTask: (columnId: string) => void
  onColumnUpdated: (column: BoardColumn) => void
  onColumnDeleted: (columnId: string) => void
  activeTaskId: string | null
  overId: string | null
  canEditTasks: boolean
  canManageColumns: boolean
  isLoading?: boolean
}

export const CustomColumn: React.FC<CustomColumnProps> = ({
  column,
  tasks,
  projectId,
  onTaskUpdated,
  onEditTask,
  onTaskDeleted,
  onCreateTask,
  onColumnUpdated,
  onColumnDeleted,
  activeTaskId,
  overId,
  canEditTasks,
  canManageColumns,
  isLoading = false
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(column.name)
  const [showMenu, setShowMenu] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const editInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Sort tasks by order_index for proper display order
  const sortedTasks = useMemo(() => {
    return tasks
      .filter(task => task.column_id === column.id)
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
  }, [tasks, column.id])

  // Get task IDs for SortableContext
  const taskIds = useMemo(() => sortedTasks.map(task => task.id), [sortedTasks])

  // Enhanced droppable state
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: column.id,
    data: {
      type: 'column',
      column,
      accepts: ['task'],
    },
  })

  // Enhanced sortable state for column reordering
  const {
    attributes: sortableAttributes,
    listeners: sortableListeners,
    setNodeRef: setSortableRef,
    transform: sortableTransform,
    transition: sortableTransition,
    isDragging: isColumnDragging,
  } = useSortable({
    id: column.id,
    data: {
      type: 'column',
      column,
    },
  })

  // Combine refs for both droppable and sortable functionality
  const setNodeRef = useCallback((node: HTMLElement | null) => {
    setDroppableRef(node)
    setSortableRef(node)
  }, [setDroppableRef, setSortableRef])

  // Enhanced styling for drag states
  const columnStyle = {
    transform: CSS.Transform.toString(sortableTransform),
    transition: sortableTransition,
  }

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus()
      editInputRef.current.select()
    }
  }, [isEditing])

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMenu) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  const handleEditStart = () => {
    if (!canManageColumns) return
    setIsEditing(true)
    setShowMenu(false)
  }

  const handleEditSave = async () => {
    const trimmedValue = editValue.trim()
    if (trimmedValue && trimmedValue !== column.name) {
      try {
        const response = await BoardColumnService.updateColumn(column.id, {
          name: trimmedValue
        })
        if (response.success && response.data) {
          onColumnUpdated(response.data)
        } else {
          console.error('Failed to update column:', response.error)
          setEditValue(column.name)
        }
      } catch (error) {
        console.error('Error updating column:', error)
        setEditValue(column.name)
      }
    }
    setIsEditing(false)
  }

  const handleEditCancel = () => {
    setEditValue(column.name)
    setIsEditing(false)
  }

  const handleDelete = async () => {
    if (!canManageColumns || isDeleting) return
    
    if (!window.confirm(`Are you sure you want to delete the "${column.name}" column? All tasks will be moved to the first column.`)) {
      return
    }

    try {
      setIsDeleting(true)
      const response = await BoardColumnService.deleteColumn(column.id)
      if (response.success) {
        onColumnDeleted(column.id)
      } else {
        console.error('Failed to delete column:', response.error)
      }
    } catch (error) {
      console.error('Error deleting column:', error)
    } finally {
      setIsDeleting(false)
      setShowMenu(false)
    }
  }

  // Enhanced visual feedback for drag operations
  const isDraggedOver = isOver && !isColumnDragging
  const isEmpty = sortedTasks.length === 0

  return (
    <div
      ref={setNodeRef}
      style={columnStyle}
      className={`
        flex flex-col bg-gray-50 rounded-lg border border-gray-200 h-full
        transition-all duration-200 ease-in-out
        ${isColumnDragging ? 'opacity-50 shadow-2xl scale-105 rotate-1' : 'opacity-100'}
        ${isDraggedOver ? 'ring-2 ring-blue-400 bg-blue-50 shadow-lg scale-[1.02]' : ''}
        min-w-[320px] max-w-[320px]
      `}
    >
      {/* Column Header */}
      <div 
        className={`
          flex items-center justify-between p-4 border-b border-gray-200 bg-white rounded-t-lg
          ${isDraggedOver ? 'bg-blue-50' : ''}
        `}
        {...sortableAttributes}
        {...sortableListeners}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <GripVertical className="h-4 w-4 text-gray-400 cursor-grab hover:text-gray-600" />
          <div 
            className="w-3 h-3 rounded-full flex-shrink-0" 
            style={{ backgroundColor: column.color || '#6B7280' }}
          />
          <h3 className="font-semibold text-gray-900 truncate">{column.name}</h3>
          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-medium">
            {sortedTasks.length}
          </span>
        </div>
        
        {/* Column Actions */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          >
            <MoreHorizontal className="h-4 w-4 text-gray-500" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-md shadow-lg border border-gray-200 z-50">
              <button
                onClick={handleEditStart}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Edit2 className="h-4 w-4" />
                Edit Column
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete Column
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tasks Container with Enhanced Drop Zone */}
      <div className="flex-1 overflow-y-auto p-3">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <div 
            className={`
              min-h-[200px] space-y-3 relative
              ${isDraggedOver && isEmpty ? 'border-2 border-dashed border-blue-300 rounded-lg' : ''}
            `}
          >
            {/* Enhanced empty state with drop indicator */}
            {isEmpty && (
              <div className={`
                flex flex-col items-center justify-center py-8 text-gray-500 rounded-lg min-h-[150px]
                transition-all duration-200
                ${isDraggedOver 
                  ? 'bg-blue-50 text-blue-600 transform scale-105' 
                  : 'hover:bg-gray-100'
                }
              `}>
                {isDraggedOver ? (
                  <div className="text-center animate-pulse">
                    <div className="w-8 h-8 bg-blue-500 rounded-full mx-auto mb-2 animate-bounce"></div>
                    <p className="text-sm font-medium">Drop task here</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm">No tasks yet</p>
                    <p className="text-xs mt-1">Click + to add a task</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Tasks with enhanced visual feedback */}
            {sortedTasks.map((task, index) => (
              <DraggableTask
                key={task.id}
                task={task}
                projectId={projectId}
                onTaskUpdated={onTaskUpdated}
                onEditTask={onEditTask}
                onTaskDeleted={onTaskDeleted}
                isActive={activeTaskId === task.id}
                canEdit={canEditTasks}
              />
            ))}
            
            {/* Drop zone indicator when dragging over non-empty column */}
            {isDraggedOver && !isEmpty && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="h-full w-full border-2 border-dashed border-blue-300 rounded-lg bg-blue-50 bg-opacity-50 flex items-center justify-center">
                  <div className="text-blue-600 text-sm font-medium animate-pulse">
                    Drop to reorder tasks
                  </div>
                </div>
              </div>
            )}
          </div>
        </SortableContext>
      </div>

      {/* Add Task Button */}
      <div className="p-3 border-t border-gray-200">
        <button
          onClick={() => onCreateTask(column.id)}
          className="flex items-center gap-2 w-full p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors text-sm"
        >
          <Plus className="h-4 w-4" />
          Add task
        </button>
      </div>
    </div>
  )
} 