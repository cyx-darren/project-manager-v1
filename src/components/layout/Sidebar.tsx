import { useState } from 'react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [projectsExpanded, setProjectsExpanded] = useState(true);

  const navigationItems = [
    { name: 'Dashboard', href: '#', icon: '📊', current: true },
    { name: 'My Tasks', href: '#', icon: '✅', current: false },
    { name: 'Calendar', href: '#', icon: '📅', current: false },
    { name: 'Team', href: '#', icon: '👥', current: false },
  ];

  const projects = [
    { name: 'Website Redesign', color: 'bg-blue-500', tasks: 12 },
    { name: 'Mobile App', color: 'bg-green-500', tasks: 8 },
    { name: 'Marketing Campaign', color: 'bg-purple-500', tasks: 5 },
    { name: 'Product Launch', color: 'bg-orange-500', tasks: 15 },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 md:hidden" 
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:block`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 md:hidden">
            <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md p-2"
              onClick={onClose}
            >
              <span className="sr-only">Close sidebar</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto">
            {/* Main Navigation */}
            <div>
              <ul className="space-y-2">
                {navigationItems.map((item) => (
                  <li key={item.name}>
                    <a
                      href={item.href}
                      className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                        item.current
                          ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-500'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <span className="mr-3 text-lg">{item.icon}</span>
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Projects Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setProjectsExpanded(!projectsExpanded)}
                  className="flex items-center text-sm font-medium text-gray-900 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md p-1"
                >
                  <svg
                    className={`mr-2 h-4 w-4 transform transition-transform duration-200 ${
                      projectsExpanded ? 'rotate-90' : 'rotate-0'
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Projects
                </button>
                <button className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md p-1">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              </div>

              {projectsExpanded && (
                <ul className="space-y-1">
                  {projects.map((project) => (
                    <li key={project.name}>
                      <a
                        href="#"
                        className="group flex items-center justify-between px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200"
                      >
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-3 ${project.color}`} />
                          <span className="truncate">{project.name}</span>
                        </div>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {project.tasks}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <button className="w-full btn-primary text-sm py-2">
                  ➕ New Task
                </button>
                <button className="w-full btn-secondary text-sm py-2">
                  📁 New Project
                </button>
              </div>
            </div>
          </nav>

          {/* User info at bottom */}
          <div className="flex-shrink-0 p-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center">
                <span className="text-sm font-medium text-white">JD</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">John Doe</p>
                <p className="text-xs text-gray-500">john@example.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 