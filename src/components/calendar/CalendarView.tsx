import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  useDraggable,
  useDroppable,
} from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import './calendar-responsive.css'
import type { Project, Task } from '../../types/supabase'
import { getTaskStatusCounts } from '../../utils/calendarUtils'
import { supabase } from '../../config/supabase'
import { useToastContext } from '../../contexts/ToastContext'

interface CalendarViewProps {
  project: Project
  tasks: Task[]
  onTaskClick?: (task: Task) => void
  onDateClick?: (date: Date) => void
}

interface CalendarTask {
  id: string
  title: string
  task: Task
  priority: 'urgent' | 'high' | 'medium' | 'low'
  status: string
}

interface VisibleMonth {
  month: number
  year: number
}

// Draggable Task Component
const DraggableTask: React.FC<{
  task: CalendarTask
  onTaskClick?: (task: Task) => void
}> = ({ task, onTaskClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: task.id,
    data: {
      task: task.task,
    },
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  const getTaskClassName = (task: CalendarTask): string => {
    let className = 'calendar-task'
    
    if (task.priority === 'urgent' || task.priority === 'high') {
      className += ' task-high-priority'
    }
    
    if (task.status === 'in-progress') {
      className += ' task-in-progress'
    }

    if (isDragging) {
      className += ' dragging'
    }
    
    return className
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={getTaskClassName(task)}
      onClick={(e) => {
        e.stopPropagation()
        onTaskClick?.(task.task)
      }}
      title={task.title}
      {...listeners}
      {...attributes}
    >
      {task.title}
    </div>
  )
}

// Droppable Calendar Cell Component
const DroppableCalendarCell: React.FC<{
  date: Date
  tasks: CalendarTask[]
  isCurrentMonth: boolean
  showWeekends: boolean
  onTaskClick?: (task: Task) => void
  onDateClick?: (date: Date) => void
}> = ({ date, tasks, isCurrentMonth, showWeekends, onTaskClick, onDateClick }) => {
  // Create consistent date string format (YYYY-MM-DD) without timezone issues
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const dateStr = `${year}-${month}-${day}`
  
  const droppableId = `cell-${dateStr}`

  const { isOver, setNodeRef } = useDroppable({
    id: droppableId,
    data: {
      date: date,
    },
  })

  const isToday = () => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isWeekend = date.getDay() === 0 || date.getDay() === 6

  const cellClasses = [
    'calendar-cell',
    'border-r',
    'border-b',
    'p-2',
    'min-h-[100px]',
    'bg-white',
    'transition-colors',
    'hover:bg-gray-50',
    isToday() ? 'today' : '',
    !isCurrentMonth ? 'other-month' : '',
    isWeekend && showWeekends ? 'weekend bg-gray-50' : '',
    isOver ? 'drag-over bg-blue-50' : ''
  ].filter(Boolean).join(' ')

  const handleCellClick = () => {
    if (onDateClick) {
      onDateClick(date)
    }
  }

  return (
    <div
      ref={setNodeRef}
      className={cellClasses}
      onClick={handleCellClick}
    >
      <div className={`date-number text-sm mb-1 ${
        isToday() 
          ? 'bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-medium' 
          : isCurrentMonth 
            ? 'text-gray-900 font-medium' 
            : 'text-gray-400'
      }`}>
        {date.getDate()}
      </div>
      
      <div className="task-container space-y-1">
        {tasks.map((task, index) => (
          <DraggableTask
            key={`${task.id}-${index}`}
            task={task}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>
    </div>
  )
}

// Mobile Calendar List Component (unchanged for mobile)
const MobileCalendarList: React.FC<{
  tasks: Task[]
  onTaskClick?: (task: Task) => void
}> = ({ tasks, onTaskClick }) => {
  const tasksWithDueDates = tasks.filter(task => task.due_date)

  const formatTaskTitle = (task: Task): string => {
    const priorityEmoji = {
      urgent: '🔴',
      high: '🟡',
      medium: '🔵',
      low: '⚪'
    }[task.priority || 'medium']

    const statusEmoji = {
      done: '✅',
      in_progress: '🔄',
      todo: '📋'
    }[task.status || 'todo']

    return `${priorityEmoji} ${statusEmoji} ${task.title}`
  }

  return (
    <div className="mobile-calendar-list p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          {tasks.length} tasks
        </h2>
      </div>

      <div className="space-y-3">
        {tasksWithDueDates.map(task => (
          <div
            key={task.id}
            className="mobile-task-card bg-white border border-gray-200 rounded-lg p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onTaskClick?.(task)}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-medium text-gray-900 text-sm leading-tight">
                {formatTaskTitle(task)}
              </h3>
            </div>
            
            {task.description && (
              <p className="text-gray-600 text-xs mb-3 line-clamp-2">
                {task.description}
              </p>
            )}
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-3">
                {task.due_date && (
                  <span className="flex items-center gap-1">
                    📅 {new Date(task.due_date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                )}
                {task.estimated_hours && (
                  <span className="flex items-center gap-1">
                    ⏱️ {task.estimated_hours}h
                  </span>
                )}
              </div>
              
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                task.status === 'done' ? 'bg-green-100 text-green-800' :
                task.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {task.status?.replace('_', ' ') || 'todo'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Get calendar days for a month including trailing/leading days
const getCalendarDays = (month: number, year: number): Date[] => {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDate = new Date(firstDay)
  const endDate = new Date(lastDay)
  
  // Adjust to start from Sunday
  startDate.setDate(startDate.getDate() - startDate.getDay())
  
  // Adjust to end on Saturday
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()))
  
  // Generate all days including trailing/leading days
  const days: Date[] = []
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d))
  }
  
  return days
}

// Get tasks for a specific month
const getTasksForMonth = (tasks: Task[], month: number, year: number): CalendarTask[] => {
  return tasks
    .filter(task => {
      if (!task.due_date) return false
      const taskDate = new Date(task.due_date)
      return taskDate.getMonth() === month && taskDate.getFullYear() === year
    })
    .map(task => ({
      id: task.id,
      title: task.title,
      task,
      priority: (task.priority || 'medium') as 'urgent' | 'high' | 'medium' | 'low',
      status: task.status || 'pending'
    }))
}

// Calendar Month Component
const CalendarMonth: React.FC<{
  month: number
  year: number
  tasks: CalendarTask[]
  showWeekends: boolean
  onTaskClick?: (task: Task) => void
  onDateClick?: (date: Date) => void
}> = ({ month, year, tasks, showWeekends, onTaskClick, onDateClick }) => {
  const days = getCalendarDays(month, year)
  
  // Generate proper calendar days (42 days to ensure full month coverage)
  const generateCalendarDays = (year: number, month: number): Date[] => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    const calendarDays: Date[] = []
    
    // Start from Sunday of the week containing the 1st
    startDate.setDate(startDate.getDate() - startDate.getDay())
    
    // Generate 42 days (6 weeks) to ensure full month coverage
    for (let i = 0; i < 42; i++) {
      calendarDays.push(new Date(startDate))
      startDate.setDate(startDate.getDate() + 1)
    }
    
    return calendarDays
  }

  const calendarDays = generateCalendarDays(year, month)
  
  // Filter days based on showWeekends setting
  const filteredDays = showWeekends 
    ? calendarDays 
    : calendarDays.filter(day => day.getDay() !== 0 && day.getDay() !== 6)

  const getTasksForDate = (date: Date): CalendarTask[] => {
    // Create consistent date string format (YYYY-MM-DD) without timezone issues
    const dateYear = date.getFullYear()
    const dateMonth = String(date.getMonth() + 1).padStart(2, '0')
    const dateDay = String(date.getDate()).padStart(2, '0')
    const dateStr = `${dateYear}-${dateMonth}-${dateDay}`
    
    return tasks.filter(task => {
      if (!task.task.due_date) return false
      
      // Handle both date strings (YYYY-MM-DD) and ISO timestamps
      let taskDateStr: string
      
      if (typeof task.task.due_date === 'string') {
        if (task.task.due_date.includes('T')) {
          // ISO timestamp - extract date part using same format
          const taskDate = new Date(task.task.due_date)
          const taskYear = taskDate.getFullYear()
          const taskMonth = String(taskDate.getMonth() + 1).padStart(2, '0')
          const taskDay = String(taskDate.getDate()).padStart(2, '0')
          taskDateStr = `${taskYear}-${taskMonth}-${taskDay}`
        } else {
          // Already a date string (YYYY-MM-DD)
          taskDateStr = task.task.due_date
        }
      } else {
        // Date object
        const taskDate = new Date(task.task.due_date)
        const taskYear = taskDate.getFullYear()
        const taskMonth = String(taskDate.getMonth() + 1).padStart(2, '0')
        const taskDay = String(taskDate.getDate()).padStart(2, '0')
        taskDateStr = `${taskYear}-${taskMonth}-${taskDay}`
      }
      
      return taskDateStr === dateStr
    })
  }

  const isCurrentMonth = (date: Date) => date.getMonth() === month

  return (
    <div className="calendar-container">
      {/* Calendar header with day names */}
      <div className={`calendar-header grid ${showWeekends ? 'grid-cols-7' : 'grid-cols-5'} text-center font-semibold bg-gray-50 border-b-2 border-gray-200`}>
        {showWeekends ? (
          <>
            <div className="py-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">Sun</div>
            <div className="py-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">Mon</div>
            <div className="py-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">Tue</div>
            <div className="py-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">Wed</div>
            <div className="py-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">Thu</div>
            <div className="py-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">Fri</div>
            <div className="py-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">Sat</div>
          </>
        ) : (
          <>
            <div className="py-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">Mon</div>
            <div className="py-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">Tue</div>
            <div className="py-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">Wed</div>
            <div className="py-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">Thu</div>
            <div className="py-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">Fri</div>
          </>
        )}
      </div>
      
      {/* Calendar grid */}
      <div className={`calendar-grid grid ${showWeekends ? 'grid-cols-7' : 'grid-cols-5'} border-l border-t`}>
        {filteredDays.map((date, index) => {
          const dayTasks = getTasksForDate(date)
          return (
            <DroppableCalendarCell
              key={`${date.getTime()}-${index}`}
              date={date}
              tasks={dayTasks}
              isCurrentMonth={isCurrentMonth(date)}
              showWeekends={showWeekends}
              onTaskClick={onTaskClick}
              onDateClick={onDateClick}
            />
          )
        })}
      </div>
    </div>
  )
}

const CalendarView: React.FC<CalendarViewProps> = ({
  project,
  tasks,
  onTaskClick,
  onDateClick
}) => {
  const [isMobile, setIsMobile] = useState(false)
  const [showWeekends, setShowWeekends] = useState(true)
  const [currentView, setCurrentView] = useState<'month' | 'week' | 'day' | 'agenda'>('month')
  const [isLoading, setIsLoading] = useState(false)
  const [draggedTask, setDraggedTask] = useState<CalendarTask | null>(null)
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks)

  const { showSuccess, showError } = useToastContext()

  // Update local tasks when props change
  useEffect(() => {
    setLocalTasks(tasks)
  }, [tasks])

  // Initialize with current month and next month
  const currentDate = new Date()
  const [visibleMonths, setVisibleMonths] = useState<VisibleMonth[]>([
    { month: currentDate.getMonth(), year: currentDate.getFullYear() },
    { 
      month: currentDate.getMonth() === 11 ? 0 : currentDate.getMonth() + 1, 
      year: currentDate.getMonth() === 11 ? currentDate.getFullYear() + 1 : currentDate.getFullYear() 
    }
  ])

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const task = active.data.current?.task as Task
    if (task) {
      const calendarTask: CalendarTask = {
        id: task.id,
        title: task.title,
        task,
        priority: (task.priority || 'medium') as 'urgent' | 'high' | 'medium' | 'low',
        status: task.status || 'todo'
      }
      setDraggedTask(calendarTask)
    }
  }

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setDraggedTask(null)

    if (!over || !active) return

    const draggedTaskId = active.id as string
    const droppableId = over.id as string

    // Debug logging
    console.log('Dropped on cell:', droppableId)
    
    // Extract date from droppableId (format: cell-YYYY-MM-DD)
    const cellDateStr = droppableId.replace('cell-', '')
    console.log('Extracted date string:', cellDateStr)
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(cellDateStr)) {
      console.error('Invalid date format:', cellDateStr)
      showError('Invalid date format')
      return
    }

    // Find the task being dragged
    const taskToUpdate = localTasks.find(task => task.id === draggedTaskId)
    if (!taskToUpdate) {
      console.error('Task not found:', draggedTaskId)
      showError('Task not found')
      return
    }

    // Check if task is already on this date
    const currentTaskDate = taskToUpdate.due_date 
      ? new Date(taskToUpdate.due_date).toISOString().split('T')[0]
      : null
    
    if (currentTaskDate === cellDateStr) {
      console.log('Task already on this date, no update needed')
      return
    }

    setIsLoading(true)

    try {
      // Save as date-only string to avoid timezone issues
      const { error } = await supabase
        .from('tasks')
        .update({ due_date: cellDateStr }) // Save as YYYY-MM-DD string
        .eq('id', draggedTaskId)

      if (error) throw error

      // Update local state
      setLocalTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === draggedTaskId
            ? { ...task, due_date: cellDateStr }
            : task
        )
      )

      // Format date for display
      const displayDate = new Date(cellDateStr + 'T12:00:00').toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric'
      })

      showSuccess(`Task moved to ${displayDate}`)
      console.log('Task successfully updated to:', cellDateStr)
      
    } catch (error) {
      console.error('Failed to update task date:', error)
      showError('Failed to update task date')
    } finally {
      setIsLoading(false)
    }
  }

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    const scrollPosition = window.scrollY + window.innerHeight
    const documentHeight = document.documentElement.scrollHeight
    
    // Load next month when near bottom
    if (scrollPosition > documentHeight - 500 && !isLoading) {
      setIsLoading(true)
      
      setTimeout(() => {
        setVisibleMonths(prev => {
          const lastMonth = prev[prev.length - 1]
          const nextMonth = lastMonth.month === 11 
            ? { month: 0, year: lastMonth.year + 1 }
            : { month: lastMonth.month + 1, year: lastMonth.year }
          
          return [...prev, nextMonth]
        })
        setIsLoading(false)
      }, 300) // Simulate loading delay
    }
  }, [isLoading])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  // Calculate task statistics
  const statusCounts = useMemo(() => getTaskStatusCounts(localTasks), [localTasks])

  const navigateToToday = () => {
    const today = new Date()
    setVisibleMonths([
      { month: today.getMonth(), year: today.getFullYear() },
      { 
        month: today.getMonth() === 11 ? 0 : today.getMonth() + 1, 
        year: today.getMonth() === 11 ? today.getFullYear() + 1 : today.getFullYear() 
      }
    ])
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const navigatePrevious = () => {
    setVisibleMonths(prev => {
      const firstMonth = prev[0]
      const prevMonth = firstMonth.month === 0 
        ? { month: 11, year: firstMonth.year - 1 }
        : { month: firstMonth.month - 1, year: firstMonth.year }
      
      return [prevMonth, ...prev.slice(0, -1)]
    })
  }

  const navigateNext = () => {
    setVisibleMonths(prev => {
      const lastMonth = prev[prev.length - 1]
      const nextMonth = lastMonth.month === 11 
        ? { month: 0, year: lastMonth.year + 1 }
        : { month: lastMonth.month + 1, year: lastMonth.year }
      
      return [...prev.slice(1), nextMonth]
    })
  }

  // Mobile view
  if (isMobile) {
    return <MobileCalendarList tasks={localTasks} onTaskClick={onTaskClick} />
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="calendar-view">
        {/* Calendar Header */}
        <div className="calendar-header flex items-center justify-between mb-4 pb-4 border-b">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">
              {visibleMonths[0] && new Date(visibleMonths[0].year, visibleMonths[0].month).toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </h2>
            <div className="flex gap-2">
              <button 
                className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                onClick={navigateToToday}
              >
                Today
              </button>
              <button 
                className="px-2 py-1 hover:bg-gray-50 rounded"
                onClick={navigatePrevious}
              >
                ←
              </button>
              <button 
                className="px-2 py-1 hover:bg-gray-50 rounded"
                onClick={navigateNext}
              >
                →
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input 
                type="checkbox" 
                checked={showWeekends}
                onChange={(e) => setShowWeekends(e.target.checked)}
              />
              Show weekends
            </label>
            
            <div className="flex border rounded">
              <button 
                className={`px-3 py-1 text-sm ${currentView === 'month' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                onClick={() => setCurrentView('month')}
              >
                Month
              </button>
              <button 
                className={`px-3 py-1 text-sm ${currentView === 'week' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                onClick={() => setCurrentView('week')}
              >
                Week
              </button>
              <button 
                className={`px-3 py-1 text-sm ${currentView === 'day' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                onClick={() => setCurrentView('day')}
              >
                Day
              </button>
              <button 
                className={`px-3 py-1 text-sm ${currentView === 'agenda' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                onClick={() => setCurrentView('agenda')}
              >
                Agenda
              </button>
            </div>
          </div>
        </div>

        {/* Task Count Summary */}
        <div className="flex items-center gap-4 mb-4 text-sm">
          {statusCounts.todo > 0 && (
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
              {statusCounts.todo} To Do
            </span>
          )}
          {statusCounts.in_progress > 0 && (
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
              {statusCounts.in_progress} In Progress
            </span>
          )}
          {statusCounts.done > 0 && (
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              {statusCounts.done} Done
            </span>
          )}
        </div>

        {/* Calendar Container with Continuous Scroll */}
        <div className="calendar-container">
          {visibleMonths.map(({ month, year }) => (
            <div key={`${year}-${month}`} className="month-section mb-8">
              <h3 className="text-lg font-semibold mb-4">
                {new Date(year, month).toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </h3>
              <CalendarMonth 
                month={month} 
                year={year}
                tasks={getTasksForMonth(localTasks, month, year)}
                showWeekends={showWeekends}
                onTaskClick={onTaskClick}
                onDateClick={onDateClick}
              />
            </div>
          ))}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {draggedTask ? (
          <div className="calendar-task dragging">
            {draggedTask.title}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

export default CalendarView 