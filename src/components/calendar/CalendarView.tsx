import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  useSensors,
  useSensor,
  PointerSensor,
  pointerWithin,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Filter } from 'lucide-react'
import type { Project, Task } from '../../types/supabase'
import "./calendar-responsive.css";
// Removed unused import: getTaskStatusCounts
import { useTaskContext } from "../../contexts/TaskContext";
import { useToastContext } from "../../contexts/ToastContext";

// Removed unused collision detection function

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

interface CalendarFilters {
  status: string[]
  priority: string[]
  assignee: string[]
  showCompleted: boolean
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
  cellNumber?: number
  monthId: string
  isDroppable?: boolean
}> = ({ date, tasks, isCurrentMonth, showWeekends, onTaskClick, onDateClick, cellNumber: _cellNumber, monthId: _monthId, isDroppable = true }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  // Handle responsive breakpoint - this useEffect must be called every render
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  // Create consistent date string format (YYYY-MM-DD) without timezone issues
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const dateStr = `${year}-${month}-${day}`
  
  // Use simple format for droppableId - let's test if this works better
  const droppableId = `cell-${dateStr}`

  // FIXED: Always call useDroppable hook, but disable it when not needed
  // This prevents "Rendered more hooks than during the previous render" error
  const { isOver, setNodeRef } = useDroppable({
    id: droppableId,
    disabled: !isDroppable, // Use disabled property instead of conditional hook call
    data: {
      date: date,
    },
  })
  
  // Re-enable hover feedback now that we have unique droppable elements
  // Only show hover effect if the droppable is enabled
  const isActiveDropTarget = isOver && isDroppable

  // Calculate visible tasks based on expansion state and available space
  const calculateMaxInitialTasks = () => {
    // If we have 4 or more tasks, show 2 to leave room for button
    if (tasks.length >= 4) return isMobile ? 1 : 2
    // Otherwise show all tasks (up to 3)
    return Math.min(tasks.length, isMobile ? 2 : 3)
  }

  const maxInitialTasks = calculateMaxInitialTasks()
  const maxVisibleTasks = isExpanded ? tasks.length : maxInitialTasks
  const visibleTasks = tasks.slice(0, maxVisibleTasks)
  const hasMoreTasks = tasks.length > maxInitialTasks

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
    'bg-white',
    'transition-all duration-300', // Smooth transition
    'hover:bg-gray-50',
    isExpanded ? 'h-auto min-h-[120px]' : 'h-[120px]', // Dynamic height
    isToday() ? 'today' : '',
    !isCurrentMonth ? 'other-month' : '',
    isWeekend && showWeekends ? 'weekend bg-gray-50' : '',
    !isDroppable ? 'opacity-50 cursor-not-allowed' : '',
    isActiveDropTarget ? 'drag-over bg-blue-50' : ''
  ].filter(Boolean).join(' ')

  const handleCellClick = (e: React.MouseEvent) => {
    // Don't trigger cell click if clicking on the see more/less button
    if ((e.target as HTMLElement).classList.contains('see-more-btn')) {
      return
    }
    if (onDateClick) {
      onDateClick(date)
    }
  }

  const handleToggleExpansion = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsExpanded(!isExpanded)
  }

  return (
    <div
      ref={setNodeRef}
      className={cellClasses}
      onClick={handleCellClick}
    >
      {/* Temporary visual debugging - shows cell number, date, and droppable ID 
      {cellNumber !== undefined && (
        <div className="absolute top-0 left-0 text-[10px] text-white bg-red-600 px-1 rounded-br z-50">
          #{cellNumber} - {date.getDate()} - {droppableId.split('-').pop()}
        </div>
      )}
      */}
      
      <div className={`date-number text-sm mb-1 ${
        isToday() 
          ? 'bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-medium' 
          : isCurrentMonth 
            ? 'text-gray-900 font-medium' 
            : 'text-gray-400'
      }`}>
        {date.getDate() === 1 ? (
          <div className="flex flex-col items-start">
            <span className="text-xs font-normal text-gray-500">
              {date.toLocaleDateString('en-US', { month: 'short' })}
            </span>
            <span className={`font-semibold ${isToday() ? '' : 'text-gray-900'}`}>
              {date.getDate()}
            </span>
          </div>
        ) : (
          date.getDate()
        )}
      </div>
  
    <div className={`task-container ${isExpanded ? 'expanded' : ''}`}>
      {visibleTasks.map((task, index) => (
        <DraggableTask
          key={`${task.id}-${index}`}
          task={task}
          onTaskClick={onTaskClick}
        />
      ))}
      
      {/* Show "See More" / "See Less" button when appropriate */}
      {hasMoreTasks && (
        <button
          className="see-more-btn"
          onClick={handleToggleExpansion}
          title={isExpanded ? 'Show less tasks' : `Show ${tasks.length - maxInitialTasks} more tasks`}
        >
          {isExpanded 
            ? 'Show Less' 
            : `+${tasks.length - maxVisibleTasks} more`
          }
        </button>
      )}
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

// Removed unused getCalendarDays function

// Get tasks for a specific month
// Get tasks for a specific month INCLUDING tasks that might appear in edge cells
const getTasksForMonth = (tasks: Task[], month: number, year: number): CalendarTask[] => {
  // Get the date range that will be displayed in this month's calendar
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  // Calculate the actual calendar start date (including previous month's trailing days)
  const calendarStartDate = new Date(firstDay)
  calendarStartDate.setDate(calendarStartDate.getDate() - calendarStartDate.getDay())
  
  // Calculate the actual calendar end date (including next month's leading days)
  const calendarEndDate = new Date(lastDay)
  const daysToAdd = 6 - calendarEndDate.getDay()
  if (daysToAdd > 0) {
    calendarEndDate.setDate(calendarEndDate.getDate() + daysToAdd)
  }
  
  console.log(`Filtering tasks for calendar range: ${calendarStartDate.toISOString()} to ${calendarEndDate.toISOString()}`)
  
  return tasks
    .filter(task => {
      if (!task.due_date) return false
      
      const taskDate = new Date(task.due_date + (task.due_date.includes('T') ? '' : 'T12:00:00'))
      
      // Include tasks that fall within the visible calendar range
      return taskDate >= calendarStartDate && taskDate <= calendarEndDate
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
  isFirst?: boolean
  onTaskClick?: (task: Task) => void
  onDateClick?: (date: Date) => void
}> = ({ month, year, tasks, showWeekends, isFirst = false, onTaskClick, onDateClick }) => {
  
  // Generate unique ID for this month instance to avoid key collisions
  const monthId = `month-${year}-${month}`

  // Height synchronization removed - now using fixed CSS heights for consistency
  
  // Fixed generateCalendarDays to prevent duplicate rows at month transitions
  const generateCalendarDays = (year: number, month: number, isFirst: boolean = false, previousMonthEndsOn?: number): Date[] => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const calendarDays: Date[] = []
    
    if (isFirst) {
      // First month: show complete weeks
      const startDate = new Date(firstDay)
      startDate.setDate(startDate.getDate() - startDate.getDay())
      
      let currentDate = new Date(startDate)
      while (currentDate <= lastDay || currentDate.getDay() !== 0) {
        calendarDays.push(new Date(currentDate))
        currentDate.setDate(currentDate.getDate() + 1)
      }
    } else {
      // For subsequent months, check if we need to start from Sunday or from the 1st
      const firstDayOfWeek = firstDay.getDay()
      
      // If the previous month ended on Saturday (day 6), start from the 1st
      // Otherwise, we already showed this week in the previous month
      if (previousMonthEndsOn === 6 || firstDayOfWeek === 0) {
        // Start from the 1st of the month
        let currentDate = new Date(firstDay)
        while (currentDate <= lastDay) {
          calendarDays.push(new Date(currentDate))
          currentDate.setDate(currentDate.getDate() + 1)
        }
        
        // Add trailing days to complete the week
        const lastDayOfWeek = lastDay.getDay()
        if (lastDayOfWeek < 6) {
          let trailingDate = new Date(lastDay)
          trailingDate.setDate(trailingDate.getDate() + 1)
          while (trailingDate.getDay() !== 0) {
            calendarDays.push(new Date(trailingDate))
            trailingDate.setDate(trailingDate.getDate() + 1)
          }
        }
      } else {
        // Skip the first week as it was already shown in the previous month
        // Start from the first Sunday that comes after the 1st of the month
        let currentDate = new Date(year, month, 1)
        
        // Find the first Sunday that's after the start of the month
        while (currentDate.getDay() !== 0) {
          currentDate.setDate(currentDate.getDate() + 1)
        }
        
        // Now generate days from this Sunday onwards
        while (currentDate <= lastDay || currentDate.getDay() !== 0) {
          calendarDays.push(new Date(currentDate))
          currentDate.setDate(currentDate.getDate() + 1)
        }
      }
    }
    
    return calendarDays
  }

  // Calculate previous month's last day for non-first months
  const previousMonthEndsOn = isFirst ? undefined : new Date(year, month, 0).getDay()
  
  // Generate calendar days based on position
  const calendarDays = generateCalendarDays(year, month, isFirst, previousMonthEndsOn)
  
  // Create day grid that maintains proper alignment even when hiding weekends
  const dayGrid = calendarDays.map(day => ({
    date: day,
    isVisible: showWeekends || (day.getDay() !== 0 && day.getDay() !== 6),
    isWeekend: day.getDay() === 0 || day.getDay() === 6
  }))

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
      {/* Calendar header with day names - only show for first month */}
      {isFirst && (
        <div className="calendar-header grid grid-cols-7 text-center font-semibold bg-gray-50 border-b-2 border-gray-200">
          <div className={`py-3 text-sm font-semibold text-gray-700 uppercase tracking-wide ${!showWeekends ? 'opacity-0 pointer-events-none' : ''}`}>Sun</div>
            <div className="py-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">Mon</div>
            <div className="py-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">Tue</div>
            <div className="py-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">Wed</div>
            <div className="py-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">Thu</div>
            <div className="py-3 text-sm font-semibold text-gray-700 uppercase tracking-wide">Fri</div>
          <div className={`py-3 text-sm font-semibold text-gray-700 uppercase tracking-wide ${!showWeekends ? 'opacity-0 pointer-events-none' : ''}`}>Sat</div>
      </div>
      )}
      
      {/* Calendar grid */}
      <div className={`calendar-grid grid grid-cols-7 border-l border-t`}>
        {(() => {
          return dayGrid.map((dayInfo, index) => {
            if (!dayInfo.isVisible) {
              // Render hidden cell to maintain grid structure
              return (
                <div 
                  key={`${monthId}-hidden-${index}`}
                  className="calendar-cell border-r border-b p-2 min-h-[100px] bg-gray-100 opacity-0 pointer-events-none"
                />
              )
            }
            
            // CRITICAL FIX: Only make cells droppable if the date belongs to this calendar month
            // This prevents duplicate droppable elements across months
            const dateMonth = dayInfo.date.getMonth()
            const calendarMonth = month
            const isCurrentMonthDate = dateMonth === calendarMonth
            
            const dayTasks = getTasksForDate(dayInfo.date)
            return (
              <DroppableCalendarCell
                key={`${monthId}-${index}`}
                date={dayInfo.date}
                tasks={dayTasks}
                isCurrentMonth={isCurrentMonth(dayInfo.date)}
                showWeekends={showWeekends}
                onTaskClick={onTaskClick}
                onDateClick={onDateClick}
                cellNumber={index} // Use index as cell number
                monthId={monthId}
                isDroppable={isCurrentMonthDate}
              />
            )
          })
        })()}
      </div>
    </div>
  )
}

const CalendarView: React.FC<CalendarViewProps> = ({
  project: _project,
  tasks,
  onTaskClick,
  onDateClick
}) => {
  const [_draggedTask, setDraggedTask] = useState<CalendarTask | null>(null)
  const [showWeekends, setShowWeekends] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [currentView, setCurrentView] = useState<'month' | 'week' | 'day' | 'agenda'>('month')
  const [_isLoading, setIsLoading] = useState(false)
  const [_isLoadingTop, _setIsLoadingTop] = useState(false)
  const [_isLoadingBottom, _setIsLoadingBottom] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters] = useState<CalendarFilters>({
    status: [],
    priority: [],
    assignee: [],
    showCompleted: true
  })

  const { showSuccess, showError } = useToastContext()
  const { updateTask } = useTaskContext()

  // Refs
  const calendarContainerRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)

  // Dynamic header height calculation
  const [headerHeight, setHeaderHeight] = useState(200) // Default fallback
  
  // State to track current visible month for header display
  const [currentVisibleMonth, setCurrentVisibleMonth] = useState({ 
    month: new Date().getMonth(), 
    year: new Date().getFullYear() 
  })

  // Measure header height on mount and when filters toggle
  useEffect(() => {
    if (headerRef.current) {
      const height = headerRef.current.offsetHeight
      setHeaderHeight(height + 20) // Add small buffer
    }
  }, [showFilters]) // Recalculate when filters toggle

  // Constants for infinite scroll - INCREASED for better reliability
  const SCROLL_THRESHOLD = 300 // Increased from 100px for more reliable triggering
  const LOADING_DELAY = 200 // Faster response
  const MAX_VISIBLE_MONTHS = 12 // Maximum months to keep in memory
  // Removed unused INITIAL_MONTHS_TO_LOAD constant

  // Helper function to get initial visible months starting with current month
  const getInitialVisibleMonths = (): VisibleMonth[] => {
    const today = new Date()
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth()
    
    const months: VisibleMonth[] = []
    
    // Start with current month and add a few months after
    // This ensures current month is visible at the top
    for (let i = 0; i <= 5; i++) {
      const date = new Date(currentYear, currentMonth + i, 1)
      months.push({
        month: date.getMonth(),
        year: date.getFullYear()
      })
    }
    
    return months
  }

  // State management
  const [_currentDate] = useState(new Date())
  // Initialize with current month in view
  const [visibleMonths, setVisibleMonths] = useState<VisibleMonth[]>(getInitialVisibleMonths())

  // Simplified loading state management - single direction state
  const [loadingDirection, setLoadingDirection] = useState<'top' | 'bottom' | null>(null)

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

  // Handle drag over - simplified
  const handleDragOver = (event: any) => {
    // Detailed logging for debugging
    if (event.over) {
      const overId = event.over.id
      const dateStr = overId.replace('cell-', '')
      const cellData = event.over.data?.current
      console.log('🔍 DRAG OVER:')
      console.log('  Cell ID:', overId)
      console.log('  Extracted date:', dateStr)
      console.log('  Cell data date:', cellData?.date?.toDateString())
    }
  }

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    
    const { active, over } = event
    setDraggedTask(null)

    if (!over || !active) return

    const draggedTaskId = active.id as string
    const droppableId = over.id as string

    // Extract date from droppableId (format: cell-YYYY-MM-DD)
    const cellDateStr = droppableId.replace('cell-', '')
    const cellData = over.data?.current
    
    console.log('🎯 DRAG END:')
    console.log('  Dropped on cell ID:', droppableId)
    console.log('  Extracted date string:', cellDateStr)
    console.log('  Cell data date:', cellData?.date?.toDateString())
    console.log('  Cell data date ISO:', cellData?.date?.toISOString())
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(cellDateStr)) {
      console.error('Invalid date format:', cellDateStr)
      showError('Invalid date format')
      return
    }

    // Find the task being dragged
    const taskToUpdate = tasks.find(task => task.id === draggedTaskId)
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
      return
    }

    setIsLoading(true)

    try {
      // Use TaskContext updateTask method for optimistic updates and synchronization
      await updateTask(draggedTaskId, { due_date: cellDateStr })

      // Check if the target month is in visible months
      const targetDate = new Date(cellDateStr + 'T12:00:00')
      const targetYear = targetDate.getFullYear()
      const targetMonth = targetDate.getMonth()
      
      const monthExists = visibleMonths.some(vm => 
        vm.year === targetYear && vm.month === targetMonth
      )
      
      // If the month isn't visible, add it
      if (!monthExists) {
        setVisibleMonths(prev => {
          const newMonths = [...prev]
          // Add the month in the correct position
          newMonths.push({ month: targetMonth, year: targetYear })
          // Sort by year and month
          return newMonths.sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year
            return a.month - b.month
          })
        })
      }

      // Format date for display
      const displayDate = targetDate.toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric'
      })

      showSuccess(`Task moved to ${displayDate}`)
      
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

  // Ensure proper initial positioning - start at top
  useEffect(() => {
    if (calendarContainerRef.current) {
      // Reset scroll to top when calendar loads
      calendarContainerRef.current.scrollTop = 0
    }
  }, []) // Run once on mount

  // Helper function to deduplicate months
  const deduplicateMonths = (months: VisibleMonth[]): VisibleMonth[] => {
    const seen = new Set<string>()
    return months.filter(month => {
      const key = `${month.year}-${month.month}`
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
  }

  // Enhanced scroll handling for bidirectional infinite scroll
  const handleScroll = useCallback(() => {
    const container = calendarContainerRef.current
    if (!container || loadingDirection) return

    const { scrollTop, scrollHeight, clientHeight } = container
    const scrollPosition = scrollTop
    const bottomPosition = scrollHeight - clientHeight - scrollTop

    // Check if we're near the top (need to load previous months)
    if (scrollPosition < SCROLL_THRESHOLD) {
      setLoadingDirection('top')
      
      setTimeout(() => {
        const newMonths: VisibleMonth[] = []
        const firstMonth = visibleMonths[0]
        
        // Add 2 previous months
        for (let i = 2; i >= 1; i--) {
          const date = new Date(firstMonth.year, firstMonth.month - i, 1)
          const newMonth = {
            month: date.getMonth(),
            year: date.getFullYear()
          }
          
          // Check if this month already exists
          const exists = visibleMonths.some(vm => 
            vm.month === newMonth.month && vm.year === newMonth.year
          )
          
          if (!exists) {
            newMonths.push(newMonth)
          }
        }
        
        // Only update if we have new months to add
        if (newMonths.length > 0) {
          // Store current scroll position for preservation
          const previousScrollTop = container.scrollTop
          const previousScrollHeight = container.scrollHeight
          
          setVisibleMonths(prev => {
            const updated = deduplicateMonths([...newMonths, ...prev])
            // Limit total months to prevent memory issues
            return updated.slice(0, MAX_VISIBLE_MONTHS)
          })
          
          // Preserve scroll position after state update
          requestAnimationFrame(() => {
            const newScrollHeight = container.scrollHeight
            const scrollDiff = newScrollHeight - previousScrollHeight
            container.scrollTop = previousScrollTop + scrollDiff
            setLoadingDirection(null)
          })
        } else {
          setLoadingDirection(null)
        }
      }, LOADING_DELAY)
    }
    // Check if we're near the bottom (need to load next months)
    else if (bottomPosition < SCROLL_THRESHOLD) {
      setLoadingDirection('bottom')
      
      setTimeout(() => {
        const lastMonth = visibleMonths[visibleMonths.length - 1]
        const newMonths: VisibleMonth[] = []
        
        // Add 2 next months
        for (let i = 1; i <= 2; i++) {
          const date = new Date(lastMonth.year, lastMonth.month + i, 1)
          const newMonth = {
            month: date.getMonth(),
            year: date.getFullYear()
          }
          
          // Check if this month already exists
          const exists = visibleMonths.some(vm => 
            vm.month === newMonth.month && vm.year === newMonth.year
          )
          
          if (!exists) {
            newMonths.push(newMonth)
          }
        }
        
        // Only update if we have new months to add
        if (newMonths.length > 0) {
          setVisibleMonths(prev => {
            const updated = deduplicateMonths([...prev, ...newMonths])
            // Limit total months to prevent memory issues
            return updated.slice(-MAX_VISIBLE_MONTHS)
          })
        }
        
        setLoadingDirection(null)
      }, LOADING_DELAY)
    }
  }, [loadingDirection, visibleMonths])

  // Fixed scroll event listener - attach to calendar container
  useEffect(() => {
    const container = calendarContainerRef.current
    if (!container) return

    container.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, [handleScroll])

    // Intersection Observer to detect which month is currently in view
  useEffect(() => {
    const container = calendarContainerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      (_entries: IntersectionObserverEntry[]) => {
        // TODO: Implement month visibility tracking when needed
        // Currently commenting out to prevent TypeScript errors
      },
      {
        root: container,
        rootMargin: '-20% 0px -60% 0px', // Focus on center portion of viewport
        threshold: [0, 0.25, 0.5, 0.75, 1] // Multiple thresholds for better detection
      }
    )

    // Observe all month sections
    const monthSections = container.querySelectorAll('.month-section')
    monthSections.forEach(section => {
      observer.observe(section)
    })

    return () => observer.disconnect()
  }, [visibleMonths])

  // Maintain scroll position when adding content at the top
  useEffect(() => {
    // Scroll position preservation is now handled directly in the scroll handler
    // when loading direction is 'top'
  }, [visibleMonths])

  // Ensure container is scrollable and force initial scroll position
  useEffect(() => {
    const container = calendarContainerRef.current
    if (container) {
      const isScrollable = container.scrollHeight > container.clientHeight
      
      // Force initial scroll position to enable top loading
      if (isScrollable && container.scrollTop === 0) {
        container.scrollTop = 10
      }
    }
  }, [visibleMonths])

  // Performance optimization: Clean up months when too many are loaded
  useEffect(() => {
    if (visibleMonths.length > MAX_VISIBLE_MONTHS) {
      // Keep middle months, remove oldest/newest
      setVisibleMonths(prev => prev.slice(2, -2))
      console.log('🧹 Cleaned up months, new count:', visibleMonths.length - 4)
    }
  }, [visibleMonths.length])

  // Filter tasks based on current filters
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(task.status || 'todo')) {
        return false
      }
      
      // Priority filter
      if (filters.priority.length > 0 && !filters.priority.includes(task.priority || 'medium')) {
        return false
      }
      
      // Assignee filter
      if (filters.assignee.length > 0 && task.assignee_id && !filters.assignee.includes(task.assignee_id)) {
        return false
      }
      
      // Show completed filter
      if (!filters.showCompleted && task.status === 'done') {
        return false
      }
      
      return true
    })
  }, [tasks, filters])

  // Removed unused filter functions and statistics - will implement when filter UI is added

  const navigateToToday = () => {
    const today = new Date()
    const months: VisibleMonth[] = []
    
    // Reset to current month plus next 3 months
    for (let i = 0; i < 4; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() + i, 1)
      months.push({
        month: date.getMonth(),
        year: date.getFullYear()
      })
    }
    
    setVisibleMonths(months)
    setLoadingDirection(null)
    
    // Update current visible month to today's month
    setCurrentVisibleMonth({
      month: today.getMonth(),
      year: today.getFullYear()
    })
    
    // Scroll to top of calendar
    setTimeout(() => {
      if (calendarContainerRef.current) {
        calendarContainerRef.current.scrollTop = 0
      }
    }, 100)
  }

  const navigatePrevious = () => {
    setVisibleMonths(prev => {
      const firstMonth = prev[0]
      const prevMonth = firstMonth.month === 0 
        ? { month: 11, year: firstMonth.year - 1 }
        : { month: firstMonth.month - 1, year: firstMonth.year }
      
      return [prevMonth, ...prev.slice(0, 2)] // Keep only first 3 months for navigation
    })
    
    // Scroll to show the new first month
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const navigateNext = () => {
    setVisibleMonths(prev => {
      const lastMonth = prev[prev.length - 1]
      const nextMonth = lastMonth.month === 11 
        ? { month: 0, year: lastMonth.year + 1 }
        : { month: lastMonth.month + 1, year: lastMonth.year }
      
      return [...prev.slice(-2), nextMonth] // Keep only last 3 months for navigation
    })
    
    // Scroll to show the new content
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
    }, 100)
  }

  // Mobile view
  if (isMobile) {
    return <MobileCalendarList tasks={filteredTasks} onTaskClick={onTaskClick} />
  }

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart} 
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      <div className="calendar-view h-full flex flex-col">
        {/* Fixed Calendar Header */}
        <div 
          ref={headerRef}
          className="calendar-header-fixed bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0"
        >
          {/* Calendar Navigation */}
          <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {new Date(currentVisibleMonth.year, currentVisibleMonth.month).toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </h2>
              
              <div className="flex items-center gap-2">
              <button 
                onClick={navigateToToday}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Today
              </button>
              <button 
                onClick={navigatePrevious}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  aria-label="Previous month"
              >
                  <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={navigateNext}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  aria-label="Next month"
              >
                  <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          
            <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-3 py-1 text-sm border rounded hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
          </div>
        </div>

          {/* View Tabs */}
          <div className="flex border-b">
            {(['month', 'week', 'day', 'agenda'] as const).map((view) => (
              <button 
                key={view}
                onClick={() => setCurrentView(view)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
                  currentView === view
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {view}
              </button>
                    ))}
                  </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                    checked={showWeekends}
                    onChange={(e) => setShowWeekends(e.target.checked)}
                          className="rounded"
                        />
                  Show Weekends
                      </label>
                  </div>
                </div>
              )}
        </div>

        {/* Scrollable Calendar Container with Dynamic Height */}
        <div 
          className="calendar-container overflow-y-auto overflow-x-hidden border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 relative bg-white" 
          ref={calendarContainerRef}
          tabIndex={0}
          style={{ 
            height: headerHeight > 0 ? `calc(100vh - ${headerHeight + 120}px)` : 'calc(100vh - 320px)', // Increased buffer for scrolling
            minHeight: '500px', // Increased minimum height
            maxHeight: '700px' // Add maximum height to ensure scrolling
          }}
        >
          {/* Loading indicator for top */}
          {loadingDirection === 'top' && (
            <div className="absolute top-0 left-0 right-0 z-10 bg-white/90 backdrop-blur-sm border-b p-3 flex items-center justify-center">
              <div className="flex items-center space-x-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                <span className="text-sm font-medium">Loading previous months...</span>
                  </div>
                </div>
              )}

          {/* Scroll hint at top */}
          {loadingDirection !== 'top' && (
            <div className="sticky top-0 z-5 bg-gradient-to-b from-gray-50 to-transparent h-6 flex items-start justify-center pt-1">
              <div className="text-xs text-gray-400 flex items-center gap-1">
                <ChevronUp className="w-3 h-3" />
                Scroll up for previous months
            </div>
          </div>
        )}

          {/* Calendar Content */}
          {currentView === 'month' && (
            <>
              {/* Render all visible months */}
              {visibleMonths.map(({ month, year }, index) => (
                <div 
                  key={`month-${year}-${month}-${index}`} 
                  className="month-section relative"
                  data-month={`${year}-${month}`}
                  style={{ isolation: 'isolate' }} // This creates a new stacking context
                >
                  <CalendarMonth 
                    month={month} 
                    year={year}
                    tasks={getTasksForMonth(filteredTasks, month, year)}
                    showWeekends={showWeekends}
                    isFirst={index === 0}
                    onTaskClick={onTaskClick}
                    onDateClick={onDateClick}
                  />
                </div>
              ))}
            </>
          )}

          {/* Loading indicator for bottom */}
          {loadingDirection === 'bottom' && (
            <div className="absolute bottom-0 left-0 right-0 z-10 bg-white/90 backdrop-blur-sm border-t p-3 flex items-center justify-center">
              <div className="flex items-center space-x-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                <span className="text-sm font-medium">Loading next months...</span>
              </div>
            </div>
          )}

          {/* Scroll hint at bottom */}
          {loadingDirection !== 'bottom' && (
            <div className="sticky bottom-0 z-5 bg-gradient-to-t from-gray-50 to-transparent h-6 flex items-end justify-center pb-1">
              <div className="text-xs text-gray-400 flex items-center gap-1">
                <ChevronDown className="w-3 h-3" />
                Scroll down for more months
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Drag Overlay - Disabled to prevent confusing visual positioning */}
      <DragOverlay 
        dropAnimation={null}
        style={{ pointerEvents: 'none' }}
      >
        {/* No drag overlay to avoid confusing positioning - blue cell highlight is sufficient */}
        {null}
      </DragOverlay>
    </DndContext>
  )
}

export default CalendarView 