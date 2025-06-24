import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';
import { useProject } from '../contexts/ProjectContext';

interface BreadcrumbItem {
  name: string;
  href?: string;
}

const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const { currentProject } = useProject();
  
  // Generate breadcrumb items from current path
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { name: 'Home', href: '/dashboard' }
    ];

    // Enhanced segment mapping with project context
    const segmentMap: Record<string, string> = {
      dashboard: 'Dashboard',
      tasks: 'My Tasks',
      calendar: 'Calendar',
      reports: 'Reports',
      projects: 'Projects',
      team: 'Team Management',
      settings: 'Settings',
      profile: 'Profile',
      inbox: 'Inbox',
      admin: 'Admin Dashboard',
      'auth-demo': 'Auth Demo',
      'token-security': 'Token Security Demo',
      'role-demo': 'Role Demo',
      new: 'New',
      edit: 'Edit',
      invite: 'Invite'
    };

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;
      
      // Skip the first segment if it's already covered by Home
      if (segment === 'dashboard') return;
      
      // Handle special cases
      let segmentName = segmentMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      
      // If we're in a project context, enhance project-related breadcrumbs
      if (segment === 'projects' && currentProject && pathSegments.length > 1) {
        // For project-specific pages, we'll add the project name in the next iteration
        segmentName = 'Projects';
      } else if (pathSegments[index - 1] === 'projects' && currentProject) {
        // This is a project ID segment, replace with project name
        segmentName = currentProject.title;
      }
      
      breadcrumbs.push({
        name: segmentName,
        href: isLast ? undefined : currentPath
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't show breadcrumbs for simple paths or dashboard
  if (breadcrumbs.length <= 1 || location.pathname === '/dashboard') {
    return null;
  }

  return (
    <div className="px-6 py-4">
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2">
          {breadcrumbs.map((item, index) => (
            <li key={`${item.name}-${index}`} className="flex items-center">
              {index > 0 && (
                <ChevronRightIcon className="h-4 w-4 text-gray-400 mx-2" />
              )}
              {item.href ? (
                <Link
                  to={item.href}
                  className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {index === 0 && <HomeIcon className="h-4 w-4 mr-1" />}
                  {item.name}
                </Link>
              ) : (
                <span className="flex items-center text-sm font-medium text-gray-900">
                  {index === 0 && <HomeIcon className="h-4 w-4 mr-1" />}
                  {item.name}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
};

export default Breadcrumb; 