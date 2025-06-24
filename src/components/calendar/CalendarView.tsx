import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Calendar, momentLocalizer, Views } from 'react-big-calendar'
import type { View } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import './calendar-responsive.css'

import type { Project, Task } from '../../types/supabase'
import {
  formatTasksToCalendarEvents,
  getTaskStatusCounts,
  getEventStyle,
  type CalendarEvent,
  type CalendarEventOptions 
} from '../../utils/calendarUtils'

// Set up the localizer for moment.js
const localizer = momentLocalizer(moment)

interface CalendarViewProps {
  project: Project
  tasks: Task[]
  onTaskClick?: (task: Task) => void
  onDateClick?: (date: Date) => void
  eventOptions?: CalendarEventOptions
}

// Mobile Calendar List Component
const MobileCalendarList: React.FC<{
  tasks: Task[]
  onTaskClick?: (task: Task) => void
}> = ({ tasks, onTaskClick }) => {
  const tasksWithDueDates = tasks.filter(task => task.due_date)
  
  if (tasksWithDueDates.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">No tasks with due dates found.</p>
        <p className="text-xs mt-1">Add due dates to your tasks to see them here.</p>
      </div>
    )
  }

  // Sort tasks by due date
  const sortedTasks = tasksWithDueDates.sort((a, b) => 
    new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime()
  )

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Upcoming Tasks</h3>
      {sortedTasks.map(task => (
        <div
          key={task.id}
          onClick={() => onTaskClick?.(task)}
          className="bg-white rounded-lg border p-3 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-gray-900 mb-1">
                {/* Priority indicators */}
                {task.priority === 'urgent' && '🔴 '}
                {task.priority === 'high' && '🟡 '}
                {/* Status indicators */}
                {task.status === 'done' && '✅ '}
                {task.status === 'in_progress' && '🔄 '}
                {task.title}
              </h4>
              {task.description && (
                <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                  {task.description}
                </p>
              )}
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  📅 {moment(task.due_date).format('MMM D, YYYY')}
                </span>
                {task.estimated_hours && (
                  <span className="flex items-center gap-1">
                    ⏱️ {task.estimated_hours}h
                  </span>
                )}
              </div>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              task.status === 'done' 
                ? 'bg-green-100 text-green-800'
                : task.status === 'in_progress'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {task.status.replace('_', ' ')}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  project,
  tasks,
  onTaskClick,
  onDateClick,
  eventOptions = {}
}) => {
  // Responsive state management
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [currentView, setCurrentView] = useState<View>(Views.MONTH)
  const [currentDate, setCurrentDate] = useState(new Date())

  // Detect screen size changes
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth
      setIsMobile(width < 768) // md breakpoint
      setIsTablet(width >= 768 && width < 1024) // lg breakpoint
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Set default view based on screen size
  useEffect(() => {
    if (isMobile) {
      setCurrentView(Views.AGENDA)
    } else {
      setCurrentView(Views.MONTH)
    }
  }, [isMobile])

  // Convert tasks to calendar events using the utility function
  const events = useMemo((): CalendarEvent[] => {
    // Safety check for tasks array
    if (!tasks || !Array.isArray(tasks)) {
      return []
    }
    
    try {
      return formatTasksToCalendarEvents(tasks, {
        includeAllDayEvents: true,
        defaultDuration: 1,
        includeCompletedTasks: true,
        ...eventOptions
      })
    } catch (error) {
      console.error('Error formatting calendar events:', error)
      return []
    }
  }, [tasks, eventOptions])

  // Get task statistics for display
  const taskStats = useMemo(() => {
    // Safety check for tasks array
    if (!tasks || !Array.isArray(tasks)) {
      return { total: 0, statusCounts: {} as Record<string, number> }
    }
    
    const tasksWithDueDates = tasks.filter(task => task?.due_date)
    return {
      total: tasksWithDueDates.length,
      statusCounts: getTaskStatusCounts(tasksWithDueDates)
    }
  }, [tasks])

  // Handle event selection (task click)
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    if (onTaskClick) {
      onTaskClick(event.resource)
    }
  }, [onTaskClick])

  // Handle date selection
  const handleSelectSlot = useCallback(({ start }: { start: Date }) => {
    if (onDateClick) {
      onDateClick(start)
    }
  }, [onDateClick])

  // Handle view change
  const handleViewChange = useCallback((view: View) => {
    setCurrentView(view)
  }, [])

  // Handle navigation
  const handleNavigate = useCallback((date: Date) => {
    setCurrentDate(date)
  }, [])

  // Custom event style using the utility function
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    return {
      style: getEventStyle(event.resource)
    }
  }, [])

  return (
    <div className="h-full w-full">
      <div className="mb-4">
        <div className={`${isMobile ? 'flex flex-col space-y-3' : 'flex items-center justify-between'}`}>
          <div className={isMobile ? 'text-center' : ''}>
            <h2 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold text-gray-900`}>
              {isMobile ? (project?.title || 'Project') : `${project?.title || 'Project'} - Calendar View`}
            </h2>
            <p className="text-sm text-gray-600">
              {isMobile ? `${taskStats.total} tasks` : `Showing ${taskStats.total} tasks with due dates for this project`}
            </p>
          </div>
          
          {/* Task Statistics - Responsive Layout */}
          <div className={`${
            isMobile 
              ? 'flex justify-center gap-3 text-xs' 
              : isTablet 
                ? 'flex gap-3 text-sm' 
                : 'flex gap-4 text-sm'
          }`}>
            {taskStats.statusCounts.todo && (
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-gray-500 rounded"></div>
                <span className={isMobile ? 'hidden sm:inline' : ''}>{taskStats.statusCounts.todo} {isMobile ? '' : 'Todo'}</span>
              </div>
            )}
            {taskStats.statusCounts.in_progress && (
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span className={isMobile ? 'hidden sm:inline' : ''}>{taskStats.statusCounts.in_progress} {isMobile ? '' : 'In Progress'}</span>
              </div>
            )}
            {taskStats.statusCounts.done && (
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className={isMobile ? 'hidden sm:inline' : ''}>{taskStats.statusCounts.done} {isMobile ? '' : 'Done'}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Conditional rendering: Mobile list view vs Desktop calendar */}
      {isMobile ? (
        <div className="bg-gray-50 rounded-lg p-4">
          <MobileCalendarList 
            tasks={tasks} 
            onTaskClick={onTaskClick} 
          />
        </div>
      ) : (
        <div className={`calendar-container ${
          isTablet 
            ? 'h-96 min-h-96' 
            : 'h-[500px] min-h-[500px]'
        }`}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            titleAccessor="title"
            allDayAccessor="allDay"
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            onView={handleViewChange}
            onNavigate={handleNavigate}
            view={currentView}
            date={currentDate}
            views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
            selectable
            eventPropGetter={eventStyleGetter}
            className="bg-white rounded-lg shadow"
            style={{ height: '100%' }}
            messages={{
              noEventsInRange: 'No tasks with due dates in this time range.',
              showMore: total => `+${total} more tasks`
            }}
            popup
            popupOffset={30}
            step={30}
            timeslots={2}
          />
        </div>
      )}
      
      {!isMobile && events.length === 0 && (
        <div className="mt-4 text-center text-gray-500">
          <p>No tasks with due dates found for this project.</p>
          <p className="text-sm mt-1">
            Add due dates to your tasks to see them in the calendar view.
          </p>
        </div>
      )}
    </div>
  )
} 