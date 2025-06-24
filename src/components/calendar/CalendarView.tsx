import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { Calendar, momentLocalizer, Views } from 'react-big-calendar'
import type { View } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import './calendar-responsive.css'
import type { Project, Task } from '../../types/supabase'
import { 
  formatTasksToCalendarEvents, 
  getEventStyle,
  getTaskStatusCounts,
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
    
    return formatTasksToCalendarEvents(tasks, {
      includeAllDayEvents: true,
      defaultDuration: 1,
      includeCompletedTasks: true,
      ...eventOptions
    })
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
      
      <div className={`calendar-container ${
        isMobile 
          ? 'h-80 min-h-80' 
          : isTablet 
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
          views={isMobile ? [Views.AGENDA, Views.DAY] : [Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
          selectable
          eventPropGetter={eventStyleGetter}
          className={`bg-white rounded-lg shadow ${isMobile ? 'text-sm' : ''}`}
          style={{ height: '100%' }}
          messages={{
            noEventsInRange: 'No tasks with due dates in this time range.',
            showMore: total => `+${total} more tasks`
          }}
          // Mobile-specific props
          popup={!isMobile}
          popupOffset={isMobile ? 0 : 30}
          step={isMobile ? 60 : 30}
          timeslots={isMobile ? 1 : 2}
        />
      </div>
      
      {events.length === 0 && (
        <div className={`mt-4 text-center text-gray-500 ${isMobile ? 'px-4' : ''}`}>
          <p className={isMobile ? 'text-sm' : ''}>No tasks with due dates found for this project.</p>
          <p className={`${isMobile ? 'text-xs' : 'text-sm'} mt-1`}>
            Add due dates to your tasks to see them in the calendar view.
          </p>
        </div>
      )}
    </div>
  )
} 