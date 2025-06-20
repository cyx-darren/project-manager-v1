import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  HomeIcon, 
  FolderIcon, 
  CalendarIcon, 
  ChartBarIcon,
  Cog6ToothIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PlusIcon,
  UserIcon,
  UsersIcon
} from '@heroicons/react/24/outline';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const [isProjectsExpanded, setIsProjectsExpanded] = useState(true);
  // const location = useLocation(); // Future enhancement for active state

  const navigationItems = [
    { name: 'Dashboard', icon: HomeIcon, href: '/dashboard' },
    { name: 'My Tasks', icon: FolderIcon, href: '/tasks' },
    { name: 'Team', icon: UsersIcon, href: '/team' },
    { name: 'Calendar', icon: CalendarIcon, href: '/calendar' },
    { name: 'Reports', icon: ChartBarIcon, href: '/reports' },
  ];

  const projects = [
    { name: 'Website Redesign', color: 'bg-blue-500', tasks: 12, id: 'website-redesign' },
    { name: 'Mobile App', color: 'bg-green-500', tasks: 8, id: 'mobile-app' },
    { name: 'Marketing Campaign', color: 'bg-purple-500', tasks: 15, id: 'marketing-campaign' },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:inset-auto md:border-r md:border-gray-200
      `}>
        {/* Sidebar header - Account for main header height */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 bg-white">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">PM</span>
            </div>
            <span className="ml-3 text-lg font-semibold text-gray-900">Project Manager</span>
          </div>
          
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <span className="sr-only">Close sidebar</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Sidebar content */}
        <div className="flex-1 flex flex-col overflow-y-auto pt-4 pb-4">
          {/* Navigation */}
          <nav className="px-3 space-y-1">
            {navigationItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => onClose()} // Close mobile sidebar when navigating
                className={({ isActive }) => `
                  group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors
                  ${isActive
                    ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-500'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={`
                        mr-3 h-5 w-5 flex-shrink-0
                        ${isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'}
                      `}
                    />
                    {item.name}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Projects section */}
          <div className="mt-8 px-3">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setIsProjectsExpanded(!isProjectsExpanded)}
                className="flex items-center text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700"
              >
                {isProjectsExpanded ? (
                  <ChevronDownIcon className="mr-2 h-4 w-4" />
                ) : (
                  <ChevronRightIcon className="mr-2 h-4 w-4" />
                )}
                Projects
              </button>
              <button className="p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100">
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
            
            {isProjectsExpanded && (
              <div className="mt-3 space-y-1">
                {projects.map((project) => (
                  <NavLink
                    key={project.id}
                    to={`/projects/${project.id}`}
                    onClick={() => onClose()} // Close mobile sidebar when navigating
                    className={({ isActive }) => `
                      group flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors
                      ${isActive 
                        ? 'bg-primary-50 text-primary-700' 
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                  >
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${project.color}`} />
                      <span className="truncate">{project.name}</span>
                    </div>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {project.tasks}
                    </span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="mt-8 px-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900 flex items-center">
                <PlusIcon className="mr-3 h-4 w-4 text-gray-400" />
                Create Task
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 hover:text-gray-900 flex items-center">
                <FolderIcon className="mr-3 h-4 w-4 text-gray-400" />
                New Project
              </button>
            </div>
          </div>
        </div>

        {/* User profile at bottom */}
        <div className="flex-shrink-0 border-t border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              <UserIcon className="h-5 w-5 text-gray-600" />
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">John Doe</p>
              <p className="text-xs text-gray-500 truncate">john@example.com</p>
            </div>
            <button className="ml-2 p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100">
              <Cog6ToothIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar; 