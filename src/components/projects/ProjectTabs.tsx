import React from 'react'
import { BarChart3, Calendar, Kanban, List, Users } from 'lucide-react'
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
}

const tabs: TabConfig[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: BarChart3,
    description: 'Project summary and metrics'
  },
  {
    id: 'tasks',
    label: 'Tasks',
    icon: List,
    description: 'Task management and tracking'
  },
  {
    id: 'team',
    label: 'Team',
    icon: Users,
    description: 'Team members and collaboration'
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: Calendar,
    description: 'Timeline and schedule view'
  },
  {
    id: 'board',
    label: 'Board',
    icon: Kanban,
    description: 'Kanban board view'
  }
]

export const ProjectTabs: React.FC<ProjectTabsProps> = ({
  activeTab,
  onTabChange,
  project
}) => {
  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                ${isActive
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
                transition-colors duration-200
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon 
                className={`
                  mr-2 h-5 w-5
                  ${isActive 
                    ? 'text-blue-500' 
                    : 'text-gray-400 group-hover:text-gray-500'
                  }
                `} 
              />
              {tab.label}
            </button>
          )
        })}
      </nav>
    </div>
  )
} 