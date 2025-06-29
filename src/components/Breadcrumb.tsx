import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRightIcon } from '@heroicons/react/20/solid';
import { useProject } from '../contexts/ProjectContext';
import { useTaskContext } from '../contexts/TaskContext';
import { parseProjectUrl } from '../utils/urlHelpers';

interface BreadcrumbItem {
  name: string;
  href?: string;
}

const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const { currentProject } = useProject();
  const { getTaskById } = useTaskContext();
  
  // Generate breadcrumb items from current path
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [
      { name: 'Home', href: '/dashboard' }
    ];

    // Parse URL for project and task information
    const { projectId, tab, taskId, isNewTask } = parseProjectUrl(location.pathname);

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
      invite: 'Invite',
      overview: 'Overview',
      board: 'Board'
    };

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;
      
      // Skip the first segment if it's already covered by Home
      if (segment === 'dashboard') return;
      
      // Handle special cases
      let segmentName = segmentMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      let segmentHref = isLast ? undefined : currentPath;
      
      // If we're in a project context, enhance project-related breadcrumbs
      if (segment === 'projects' && currentProject && pathSegments.length > 1) {
        // For project-specific pages, we'll add the project name in the next iteration
        segmentName = 'Projects';
      } else if (pathSegments[index - 1] === 'projects' && currentProject) {
        // This is a project ID segment, replace with project name
        segmentName = currentProject.title;
        // Link to project overview if not the last segment
        if (!isLast) {
          segmentHref = `/projects/${currentProject.id}/overview`;
        }
      } else if (tab && pathSegments[index - 1] === projectId) {
        // This is a tab segment within a project
        segmentName = segmentMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
        if (!isLast) {
          segmentHref = `/projects/${projectId}/${tab}`;
        }
      } else if (segment === 'tasks' && pathSegments[index - 1] === tab) {
        // Skip the 'tasks' segment in task URLs as it's redundant
        return;
      } else if (taskId && segment === taskId) {
        // This is a task ID segment, replace with task name if available
        const task = getTaskById(taskId);
        segmentName = task ? task.title : `Task ${taskId.slice(0, 8)}...`;
        // Task is always the last segment for now
        segmentHref = undefined;
      } else if (isNewTask && segment === 'new') {
        segmentName = 'New Task';
        segmentHref = undefined;
      }
      
      breadcrumbs.push({
        name: segmentName,
        href: segmentHref
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <nav className="flex py-3" aria-label="Breadcrumb">
        <ol role="list" className="flex items-center space-x-2">
          {breadcrumbs.map((item, index) => (
            <li key={index}>
              <div className="flex items-center">
                {index > 0 && (
                  <ChevronRightIcon
                    className="h-4 w-4 flex-shrink-0 text-gray-400 mr-2"
                    aria-hidden="true"
                  />
                )}
                {item.href ? (
                  <Link
                    to={item.href}
                    className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {item.name}
                  </Link>
                ) : (
                  <span className="text-sm font-medium text-gray-900 truncate max-w-xs">
                    {item.name}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
};

export default Breadcrumb; 