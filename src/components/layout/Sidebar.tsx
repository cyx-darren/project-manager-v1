import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  FolderIcon, 
  ChartBarIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  PlusIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  ChevronLeftIcon,
  InboxIcon,
  CogIcon,
  QuestionMarkCircleIcon,
  BookOpenIcon,
  WifiIcon,
  ExclamationCircleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useProject } from '../../contexts/ProjectContext';
import { useSidebarData } from '../../hooks/useSidebarData';
import { 
  UserRoleBadge 
} from '../auth/RoleGuard';
import LoadingSpinner from '../LoadingSpinner';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavigationItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  shortName: string;
  public?: boolean;
  permission?: string;
  requiredRole?: 'admin' | 'member' | 'guest';
  requiredPermissions?: string[];
  requireAllPermissions?: boolean;
  projectPermission?: string;
  requiredProjectRole?: 'owner' | 'admin' | 'member';
  requiredProjectPermissions?: string[];
  requiredProjectActions?: string[];
  requireProject?: boolean;
  badge?: number | string;
  category?: 'main' | 'work' | 'admin' | 'help';
  isNew?: boolean;
  description?: string;
  keywords?: string[];
  parentPath?: string;
  fallbackContent?: React.ReactNode;
  accessDeniedReason?: string;
  showWhenRestricted?: boolean;
}

interface NavigationCategory {
  name: string;
  items: NavigationItem[];
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

interface NavigationState {
  activeItem: NavigationItem | null;
  activeCategory: string | null;
  breadcrumbs: NavigationItem[];
  recentlyVisited: NavigationItem[];
  navigationHistory: string[];
}

interface RecentItem extends NavigationItem {
  lastVisited: Date;
  visitCount: number;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user, hasRole, hasPermission } = useAuth();
  const { currentProject, userRoleInProject } = useProject();
  const { 
    projects: sidebarProjects, 
    loading, 
    error: sidebarError, 
    isConnected, 
    refresh 
  } = useSidebarData();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['main', 'work'])
  );
  const [showRecentItems, setShowRecentItems] = useState(true);
  const [navigationState, setNavigationState] = useState<NavigationState>({
    activeItem: null,
    activeCategory: null,
    breadcrumbs: [],
    recentlyVisited: [],
    navigationHistory: []
  });
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);

  const navigationItems: NavigationItem[] = [
    // Main Navigation
    { 
      name: 'Dashboard', 
      icon: HomeIcon, 
      href: '/dashboard', 
      shortName: 'Dashboard',
      public: true,
      category: 'main',
      description: 'Overview of your tasks, projects, and team activity',
      keywords: ['home', 'overview', 'summary', 'main']
    },
    { 
      name: 'Inbox', 
      icon: InboxIcon, 
      href: '/inbox', 
      shortName: 'Inbox',
      public: true,
      category: 'main',
      description: 'Notifications, mentions, and updates',
      keywords: ['notifications', 'mentions', 'updates', 'messages']
    },
    { 
      name: 'My Tasks', 
      icon: ClipboardDocumentListIcon, 
      href: '/tasks', 
      shortName: 'Tasks',
      public: true,
      category: 'main',
      description: 'Your assigned tasks and personal work items',
      keywords: ['tasks', 'work', 'assignments', 'todo']
    },

    // Work Navigation
    { 
      name: 'Projects', 
      icon: FolderIcon, 
      href: '/projects', 
      shortName: 'Projects',
      public: true,
      category: 'work',
      description: 'Browse and manage all projects',
      keywords: ['projects', 'teams', 'collaboration']
    },
    { 
      name: 'Team', 
      icon: UsersIcon, 
      href: '/team', 
      shortName: 'Team',
      requiredPermissions: ['view_team'],
      category: 'work',
      description: 'Team members and collaboration',
      keywords: ['team', 'members', 'people', 'collaboration']
    },

    { 
      name: 'Reports', 
      icon: ChartBarIcon, 
      href: '/reports', 
      shortName: 'Reports',
      requiredPermissions: ['view_reports'],
      category: 'work',
      description: 'Analytics and progress reports',
      keywords: ['reports', 'analytics', 'progress', 'metrics']
    },

    // Admin Navigation
    { 
      name: 'Settings', 
      icon: CogIcon, 
      href: '/settings', 
      shortName: 'Settings',
      public: true,
      category: 'admin',
      description: 'Account and application preferences',
      keywords: ['settings', 'preferences', 'account', 'configuration']
    },
    { 
      name: 'Role Demo', 
      icon: ShieldCheckIcon, 
      href: '/role-demo', 
      shortName: 'Roles',
      public: true,
      category: 'admin',
      isNew: true,
      description: 'Demonstration of role-based access control',
      keywords: ['roles', 'permissions', 'demo', 'access']
    },
    { 
      name: 'API Test', 
      icon: CogIcon, 
      href: '/api-test', 
      shortName: 'API',
      public: true,
      category: 'admin',
      isNew: true,
      description: 'Test API endpoints and verify functionality',
      keywords: ['api', 'test', 'endpoints', 'debug']
    },

    // Help Navigation
    { 
      name: 'Documentation', 
      icon: BookOpenIcon, 
      href: '/docs', 
      shortName: 'Docs',
      public: true,
      category: 'help',
      description: 'User guides and API documentation',
      keywords: ['docs', 'help', 'guides', 'documentation']
    },
    { 
      name: 'Support', 
      icon: QuestionMarkCircleIcon, 
      href: '/support', 
      shortName: 'Support',
      public: true,
      category: 'help',
      description: 'Get help and contact support',
      keywords: ['support', 'help', 'contact', 'assistance']
    }
  ];

  const navigationCategories: NavigationCategory[] = [
    { name: 'Main', items: navigationItems.filter(item => item.category === 'main'), collapsible: false, defaultExpanded: true },
    { name: 'Work', items: navigationItems.filter(item => item.category === 'work'), collapsible: true, defaultExpanded: true },
    { name: 'Admin', items: navigationItems.filter(item => item.category === 'admin'), collapsible: true, defaultExpanded: false },
    { name: 'Help', items: navigationItems.filter(item => item.category === 'help'), collapsible: true, defaultExpanded: false }
  ];

  const checkScreenSize = () => {
    const mobile = window.innerWidth < 768;
    setIsMobile(mobile);
    if (mobile && isCollapsed) {
      setIsCollapsed(false);
    }
  };

  useEffect(() => {
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, isOpen]);

  const evaluateItemAccess = (item: NavigationItem) => {
    if (item.public) {
      return { hasAccess: true, reason: null };
    }

    if (!user) {
      return { hasAccess: false, reason: 'Authentication required' };
    }

    if (item.requiredRole && !hasRole(item.requiredRole)) {
      return { hasAccess: false, reason: `${item.requiredRole} role required` };
    }

    if (item.requiredPermissions && item.requiredPermissions.length > 0) {
      const hasAllRequired = item.requireAllPermissions !== false;
      const hasRequiredPermissions = hasAllRequired
        ? item.requiredPermissions.every(permission => hasPermission(permission))
        : item.requiredPermissions.some(permission => hasPermission(permission));

      if (!hasRequiredPermissions) {
        return { 
          hasAccess: false, 
          reason: `${hasAllRequired ? 'All' : 'One'} of these permissions required: ${item.requiredPermissions.join(', ')}` 
        };
      }
    }

    return { hasAccess: true, reason: null };
  };

  const getVisibleNavigationItems = (items: NavigationItem[]) => {
    return items.filter(item => {
      const { hasAccess } = evaluateItemAccess(item);
      return hasAccess || item.showWhenRestricted;
    });
  };

  const navigateToItem = useCallback((item: NavigationItem) => {
    const { hasAccess } = evaluateItemAccess(item);
    if (!hasAccess) return;

    navigate(item.href);
    
    setNavigationState(prev => ({
      ...prev,
      activeItem: item,
      activeCategory: item.category || null,
      navigationHistory: [...prev.navigationHistory.slice(-9), item.href]
    }));

    const existingIndex = recentItems.findIndex(recent => recent.href === item.href);
    if (existingIndex >= 0) {
      const updated = [...recentItems];
      updated[existingIndex] = {
        ...updated[existingIndex],
        lastVisited: new Date(),
        visitCount: updated[existingIndex].visitCount + 1
      };
      setRecentItems(updated.sort((a, b) => b.lastVisited.getTime() - a.lastVisited.getTime()));
    } else {
      const newRecentItem: RecentItem = {
        ...item,
        lastVisited: new Date(),
        visitCount: 1
      };
      setRecentItems(prev => [newRecentItem, ...prev].slice(0, 10));
    }

    if (isMobile) {
      onClose();
    }
  }, [navigate, recentItems, isMobile, onClose]);

  const navigateToRecent = (item: RecentItem) => {
    navigateToItem(item);
  };

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryName)) {
        newSet.delete(categoryName);
      } else {
        newSet.add(categoryName);
      }
      return newSet;
    });
  };

  const getProjectColor = (projectId: string): string => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-yellow-500', 'bg-red-500', 'bg-indigo-500'];
    const index = parseInt(projectId, 36) % colors.length;
    return colors[index];
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const getSidebarWidth = () => {
    if (isMobile) return 'w-80';
    return isCollapsed ? 'w-16' : 'w-80';
  };

  const renderNavigationItem = (item: NavigationItem) => {
    const isCurrentlyActive = navigationState.activeItem?.href === item.href;
    const { hasAccess, reason } = evaluateItemAccess(item);
    
    if (!hasAccess && !item.showWhenRestricted) {
      return null;
    }
    
    const isRestricted = !hasAccess;
    
    return (
      <div key={item.name} className="relative mb-1">
        <NavLink
          to={hasAccess ? item.href : '#'}
          onClick={(e) => {
            if (!hasAccess) {
              e.preventDefault();
              return;
            }
            navigateToItem(item);
          }}
          className={({ isActive }) => `
            group relative flex items-center w-full h-12 px-3 rounded-lg transition-all duration-200
            ${isActive && hasAccess
              ? 'bg-primary-50 text-primary-700'
              : isRestricted
                ? 'text-gray-400 cursor-not-allowed opacity-60'
                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
            }
            ${isCollapsed && !isMobile ? 'justify-center' : ''}
          `}
        >
          {/* Right border indicator for hover/active states */}
          <div className={`absolute right-0 top-0 h-full w-0.5 transition-all duration-200 ${
            isCurrentlyActive && hasAccess
              ? 'bg-primary-500'
              : isRestricted
                ? 'bg-transparent'
                : 'bg-transparent group-hover:bg-gray-300'
          }`}></div>
          
          {/* Icon container */}
          <div className="relative flex items-center justify-center flex-shrink-0">
            <item.icon className={`h-5 w-5 transition-colors duration-200 ${
              isCurrentlyActive && hasAccess
                ? 'text-primary-500'
                : isRestricted
                  ? 'text-gray-300'
                  : 'text-gray-400 group-hover:text-gray-500'
            }`} />
            {item.badge && (
              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                {item.badge}
              </span>
            )}
            {item.isNew && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
            )}
          </div>
          
          {/* Text content - hidden when collapsed on desktop */}
          {(!isCollapsed || isMobile) && (
            <span className="text-sm font-medium ml-3 flex-1 min-w-0 truncate">
              {item.name}
            </span>
          )}
          
          {/* Collapsed state tooltip */}
          {isCollapsed && !isMobile && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
              {item.name}
              {isRestricted && reason && (
                <div className="text-red-300 mt-1">🔒 {reason}</div>
              )}
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 border-4 border-transparent border-r-gray-900"></div>
            </div>
          )}
          
          {/* Restricted access indicator for expanded state */}
          {isRestricted && (!isCollapsed || isMobile) && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-red-600 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
              🔒 {reason}
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 border-4 border-transparent border-r-red-600"></div>
            </div>
          )}
        </NavLink>
      </div>
    );
  };

  const dynamicProjects = sidebarProjects || [];
  const projectMembers = []; // Mock data for now

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && isMobile && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 transition-opacity duration-300 ease-in-out md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        ${isMobile ? 'fixed inset-y-0 left-0 z-50' : 'relative flex-shrink-0'}
        ${getSidebarWidth()} bg-white border-r border-gray-200 shadow-sm
        ${isMobile ? `transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}` : 'transition-all duration-300 ease-in-out'}
        flex flex-col h-full
      `}>
        {/* Sidebar header */}
        <div className="h-16 flex items-center px-4 border-b border-gray-200 bg-white flex-shrink-0 relative">
          {/* Logo and brand */}
          <div className={`flex items-center min-w-0 ${isCollapsed && !isMobile ? 'mx-auto' : 'flex-1'}`}>
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">AM</span>
            </div>
            {(!isCollapsed || isMobile) && (
              <span className="ml-3 text-lg font-semibold text-gray-900 truncate transition-opacity duration-300">
                Asana Clone
              </span>
            )}
          </div>
          
          {/* Desktop collapse toggle */}
          {!isMobile && !isCollapsed && (
            <button
              onClick={toggleCollapse}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors ml-2"
              title="Collapse sidebar"
            >
              <ChevronLeftIcon className="h-4 w-4 transition-transform duration-300" />
            </button>
          )}
          
          {/* Mobile close button */}
          {isMobile && (
          <button
            onClick={onClose}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors ml-2"
          >
            <span className="sr-only">Close sidebar</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          )}
        </div>
        
        {/* Expand button when collapsed */}
        {!isMobile && isCollapsed && (
          <button
            onClick={toggleCollapse}
            className="absolute -right-2 top-8 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-50 transition-colors shadow-sm z-20"
            title="Expand sidebar"
          >
            <ChevronRightIcon className="h-3 w-3" />
          </button>
        )}

        {/* Sidebar content */}
        <div className="flex-1 flex flex-col overflow-y-auto pt-4 pb-4">
          {/* Navigation */}
          <nav className="px-3 space-y-6">
            {navigationCategories.map((category) => {
              const visibleItems = getVisibleNavigationItems(category.items);
              if (visibleItems.length === 0) return null;

              const isExpanded = expandedCategories.has(category.name.toLowerCase());
              const hasActiveItem = visibleItems.some(item => navigationState.activeItem?.href === item.href);

              return (
                <div key={category.name}>
                  {/* Category Header */}
                  {(!isCollapsed || isMobile) && category.collapsible && (
                    <button
                      onClick={() => toggleCategory(category.name.toLowerCase())}
                      className={`flex items-center w-full text-xs font-semibold uppercase tracking-wider transition-colors mb-2 ${
                        hasActiveItem 
                          ? 'text-primary-600' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {isExpanded ? (
                        <ChevronDownIcon className="mr-2 h-3 w-3" />
                      ) : (
                        <ChevronRightIcon className="mr-2 h-3 w-3" />
                      )}
                      {category.name}
                      {hasActiveItem && <div className="ml-2 w-1.5 h-1.5 bg-primary-500 rounded-full"></div>}
                    </button>
                  )}

                  {/* Non-collapsible category */}
                  {(!isCollapsed || isMobile) && !category.collapsible && (
                    <div className={`text-xs font-semibold uppercase tracking-wider mb-2 px-3 flex items-center ${
                      hasActiveItem ? 'text-primary-600' : 'text-gray-500'
                    }`}>
                      {category.name}
                      {hasActiveItem && <div className="ml-2 w-1.5 h-1.5 bg-primary-500 rounded-full"></div>}
                    </div>
                  )}

                  {/* Category Items */}
                  {(isExpanded || !category.collapsible || isCollapsed) && (
                    <div>
                      {visibleItems.map(renderNavigationItem)}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Collapsed Quick Actions - Create Task only */}
          {isCollapsed && !isMobile && user && (
          <div className="mt-8 px-3">
              <div className="relative mb-1">
              <button
                  onClick={() => navigate('/tasks/new')}
                  className="group relative flex items-center justify-center w-full h-12 px-3 rounded-lg transition-all duration-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  title="Create Task"
                >
                  <div className="absolute right-0 top-0 h-full w-0.5 transition-all duration-200 bg-transparent group-hover:bg-gray-300"></div>
                  <div className="relative flex items-center justify-center flex-shrink-0">
                    <PlusIcon className="h-5 w-5 text-gray-400 group-hover:text-gray-500 transition-colors duration-200" />
                  </div>
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                    Create Task
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 border-4 border-transparent border-r-gray-900"></div>
                  </div>
              </button>
              </div>
            </div>
          )}

          {/* User profile at bottom */}
          <div className="flex-shrink-0 border-t border-gray-200 p-4">
            <div className={`${isCollapsed && !isMobile ? 'relative mb-1' : 'flex items-center'}`}>
              {isCollapsed && !isMobile ? (
                <button 
                  onClick={() => navigate('/settings')}
                  className="group relative flex items-center justify-center w-full h-12 px-3 rounded-lg transition-all duration-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  title="User Profile & Settings"
                >
                  <div className="absolute right-0 top-0 h-full w-0.5 transition-all duration-200 bg-transparent group-hover:bg-gray-300"></div>
                  <div className="relative flex items-center justify-center flex-shrink-0">
                    <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                      </span>
                    </div>
                  </div>
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                    {user?.email ? user.email.split('@')[0] : 'User'}
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 border-4 border-transparent border-r-gray-900"></div>
                  </div>
                </button>
              ) : (
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium text-white">
                      {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                    </span>
              </div>
                  {(!isCollapsed || isMobile) && (
                    <>
                      <div className="ml-3 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {user?.email ? user.email.split('@')[0] : 'User'}
                          </p>
                          <UserRoleBadge />
                          {isConnected && (
                            <WifiIcon className="h-3 w-3 text-green-500" title="Real-time updates active" />
            )}
          </div>
                        <p className="text-xs text-gray-500 truncate">
                          {user?.email || 'Loading...'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {sidebarError.projects && (
                          <button 
                            onClick={refresh}
                            className="p-1 rounded-md text-red-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Retry loading data"
                          >
                            <ExclamationCircleIcon className="h-4 w-4" />
              </button>
                        )}
                        <button 
                          onClick={() => navigate('/settings')}
                          className="p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
                        >
                          <CogIcon className="h-4 w-4" />
              </button>
            </div>
                    </>
                  )}
          </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar; 
