import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { BarChart3, Calendar, Kanban, List, Users, ChevronDown, ChevronUp } from 'lucide-react'
import type { Project } from '../../types/supabase'

type TabType = 'overview' | 'tasks' | 'team' | 'calendar' | 'board'

interface ProjectTabsProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
  project: Project
}

interface TabConfig {
  id: TabType
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  shortLabel?: string // For mobile display
}

// Memoize tabs configuration to prevent recreation on every render
const tabs: TabConfig[] = [
  {
    id: 'overview',
    label: 'Overview',
    shortLabel: 'Overview',
    icon: BarChart3,
    description: 'Project summary and metrics'
  },
  {
    id: 'tasks',
    label: 'Tasks',
    shortLabel: 'Tasks',
    icon: List,
    description: 'Task management and tracking'
  },
  {
    id: 'team',
    label: 'Team',
    shortLabel: 'Team',
    icon: Users,
    description: 'Team members and collaboration'
  },
  {
    id: 'calendar',
    label: 'Calendar',
    shortLabel: 'Calendar',
    icon: Calendar,
    description: 'Timeline and schedule view'
  },
  {
    id: 'board',
    label: 'Board',
    shortLabel: 'Board',
    icon: Kanban,
    description: 'Kanban board view'
  }
]

// Memoized individual tab component for better performance
const TabButton = React.memo<{
  tab: TabConfig
  isActive: boolean
  isMobile: boolean
  onClick: () => void
}>(({ tab, isActive, isMobile, onClick }) => {
  const Icon = tab.icon
  
  return (
    <button
      onClick={onClick}
      className={`
        group inline-flex items-center py-3 sm:py-4 px-2 sm:px-3 lg:px-1 
        border-b-2 font-medium text-xs sm:text-sm lg:text-sm
        transition-colors duration-200
        ${isActive
          ? 'border-blue-500 text-blue-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }
        ${isMobile ? 'flex-1 justify-center' : ''}
      `}
      aria-current={isActive ? 'page' : undefined}
      title={tab.description}
    >
      <Icon 
        className={`
          ${isMobile ? 'h-4 w-4' : 'mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5'}
          ${isActive 
            ? 'text-blue-500' 
            : 'text-gray-400 group-hover:text-gray-500'
          }
        `} 
      />
      <span className={`${isMobile ? 'sr-only sm:not-sr-only ml-1' : ''}`}>
        {isMobile && tab.shortLabel ? tab.shortLabel : tab.label}
      </span>
    </button>
  )
})

TabButton.displayName = 'TabButton'

// Memoized dropdown menu item component
const DropdownMenuItem = React.memo<{
  tab: TabConfig
  isActive: boolean
  onClick: () => void
}>(({ tab, isActive, onClick }) => {
  const Icon = tab.icon
  
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center px-4 py-2 text-sm transition-colors duration-200
        ${isActive
          ? 'bg-blue-50 text-blue-600'
          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
        }
      `}
      role="menuitem"
      title={tab.description}
    >
      <Icon 
        className={`
          mr-3 h-4 w-4
          ${isActive ? 'text-blue-500' : 'text-gray-400'}
        `} 
      />
      {tab.label}
    </button>
  )
})

DropdownMenuItem.displayName = 'DropdownMenuItem'

export const ProjectTabs: React.FC<ProjectTabsProps> = React.memo(({
  activeTab,
  onTabChange,
  project
}) => {
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const tabsRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Memoize screen size detection function
  const checkScreenSize = useCallback(() => {
    const width = window.innerWidth
    const mobile = width < 768
    const tablet = width >= 768 && width < 1024
    
    setIsMobile(mobile)
    setIsTablet(tablet)
    
    // Close dropdown when screen size changes
    setShowDropdown(false)
  }, [])

  // Memoize visible and overflow tabs calculation
  const { visibleTabs, overflowTabs } = useMemo(() => {
    if (isMobile) {
      // On mobile, show only active tab + dropdown for others
      const activeTabConfig = tabs.find(tab => tab.id === activeTab)
      const otherTabs = tabs.filter(tab => tab.id !== activeTab)
      return {
        visibleTabs: activeTabConfig ? [activeTabConfig] : [tabs[0]],
        overflowTabs: otherTabs
      }
    } else if (isTablet) {
      // On tablet, show first 3 tabs + dropdown for others
      return {
        visibleTabs: tabs.slice(0, 3),
        overflowTabs: tabs.slice(3)
      }
    } else {
      // On desktop, show all tabs
      return {
        visibleTabs: tabs,
        overflowTabs: []
      }
    }
  }, [isMobile, isTablet, activeTab])

  // Optimize screen size detection with single useEffect
  useEffect(() => {
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [checkScreenSize])

  // Optimize click outside detection
  useEffect(() => {
    if (!showDropdown) return

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showDropdown])

  // Memoize tab click handler
  const handleTabClick = useCallback((tabId: TabType) => {
    onTabChange(tabId)
    setShowDropdown(false)
  }, [onTabChange])

  // Memoize dropdown toggle handler
  const toggleDropdown = useCallback(() => {
    setShowDropdown(prev => !prev)
  }, [])

  // Memoize active tab configuration and overflow check
  const activeTabConfig = useMemo(() => 
    tabs.find(tab => tab.id === activeTab), 
    [activeTab]
  )
  
  const isActiveTabInOverflow = useMemo(() => 
    overflowTabs.some(tab => tab.id === activeTab), 
    [overflowTabs, activeTab]
  )

  return (
    <div className="border-b border-gray-200 bg-white">
      <nav className="flex items-center justify-between" aria-label="Tabs" ref={tabsRef}>
        {/* Visible tabs */}
        <div className={`flex ${isMobile ? 'flex-1' : 'space-x-1 sm:space-x-4 lg:space-x-8'}`}>
          {visibleTabs.map((tab) => (
            <TabButton
              key={tab.id}
              tab={tab}
              isActive={activeTab === tab.id}
              isMobile={isMobile}
              onClick={() => handleTabClick(tab.id)}
            />
          ))}
        </div>

        {/* Overflow dropdown */}
        {overflowTabs.length > 0 && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={toggleDropdown}
              className={`
                group inline-flex items-center py-3 sm:py-4 px-2 sm:px-3 lg:px-1 
                border-b-2 font-medium text-xs sm:text-sm lg:text-sm
                transition-colors duration-200
                ${isActiveTabInOverflow
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
              aria-expanded={showDropdown}
              aria-haspopup="true"
            >
              {isMobile && isActiveTabInOverflow && activeTabConfig ? (
                <>
                  {React.createElement(activeTabConfig.icon, { className: "h-4 w-4 mr-1 text-blue-500" })}
                  <span>{activeTabConfig.shortLabel || activeTabConfig.label}</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">More</span>
                  <span className="sm:hidden">•••</span>
                </>
              )}
              {showDropdown ? (
                <ChevronUp className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
              ) : (
                <ChevronDown className="ml-1 h-3 w-3 sm:h-4 sm:w-4" />
              )}
            </button>

            {/* Dropdown menu */}
            {showDropdown && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                <div className="py-1" role="menu" aria-orientation="vertical">
                  {overflowTabs.map((tab) => (
                    <DropdownMenuItem
                      key={tab.id}
                      tab={tab}
                      isActive={activeTab === tab.id}
                      onClick={() => handleTabClick(tab.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </nav>
    </div>
  )
})

ProjectTabs.displayName = 'ProjectTabs' 