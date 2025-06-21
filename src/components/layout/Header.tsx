import React, { useState } from 'react';
import { 
  MagnifyingGlassIcon, 
  BellIcon, 
  ChevronDownIcon,
  Bars3Icon,
  CogIcon,
  UserIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useProject } from '../../contexts/ProjectContext';
import { useSidebarData } from '../../hooks/useSidebarData';
import { UserRoleBadge, AdminOnly, PermissionGuard } from '../auth';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { currentProject } = useProject();
  const { stats, loading } = useSidebarData();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsUserMenuOpen(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsUserMenuOpen(false);
  };

  // Get user initials for avatar
  const getUserInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  // Get dynamic notification count
  const notificationCount = loading.stats ? 0 : (stats?.notifications || 0);

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Mobile menu button and search */}
          <div className="flex items-center flex-1">
            {/* Mobile menu button */}
            <button
              onClick={onMenuClick}
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
            >
              <span className="sr-only">Open sidebar</span>
              <Bars3Icon className="h-6 w-6" />
            </button>
            
            {/* Search bar */}
            <div className="flex-1 max-w-lg ml-4 md:ml-0">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search tasks, projects..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-sm transition-colors"
                />
              </div>
            </div>

            {/* Project context indicator (desktop only) */}
            {currentProject && (
              <div className="hidden lg:flex items-center ml-6 px-3 py-1 bg-blue-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-sm font-medium text-blue-700 truncate max-w-32">
                  {currentProject.title}
                </span>
              </div>
            )}
          </div>

          {/* Right side - Notifications and user menu */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button 
              onClick={() => navigate('/inbox')}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 relative transition-colors"
            >
              <span className="sr-only">View notifications</span>
              <BellIcon className="h-6 w-6" />
              {/* Dynamic notification badge */}
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-white">
                    {loading.stats ? '...' : Math.min(notificationCount, 9)}
                  </span>
                </span>
              )}
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-3 p-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
              >
                <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {user ? getUserInitials(user.email || '') : 'U'}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.email ? user.email.split('@')[0] : 'User'}
                    </p>
                    <UserRoleBadge />
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email || 'user@example.com'}
                  </p>
                </div>
                <ChevronDownIcon className="hidden md:block h-4 w-4 text-gray-400" />
              </button>

              {/* Enhanced User dropdown menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <div className="py-1">
                    {/* User info section */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {user ? getUserInitials(user.email || '') : 'U'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {user?.email ? user.email.split('@')[0] : 'User'}
                            </p>
                            <UserRoleBadge />
                          </div>
                          <p className="text-xs text-gray-500 truncate">
                            {user?.email || 'user@example.com'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Navigation items */}
                    <button
                      onClick={() => handleNavigation('/profile')}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <UserIcon className="h-4 w-4 mr-3 text-gray-400" />
                      Your Profile
                    </button>
                    
                    <button
                      onClick={() => handleNavigation('/settings')}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <CogIcon className="h-4 w-4 mr-3 text-gray-400" />
                      Settings
                    </button>

                    {/* Permission-based menu items */}
                    <PermissionGuard permissions={['manage_users']}>
                      <button
                        onClick={() => handleNavigation('/team')}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <UserIcon className="h-4 w-4 mr-3 text-gray-400" />
                        Team Management
                      </button>
                    </PermissionGuard>

                    <AdminOnly>
                      <button
                        onClick={() => handleNavigation('/admin')}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <CogIcon className="h-4 w-4 mr-3 text-gray-400" />
                        Admin Dashboard
                      </button>
                    </AdminOnly>

                    {/* Demo/Development items */}
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <div className="px-4 py-2">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Development</p>
                      </div>
                      <button
                        onClick={() => handleNavigation('/auth-demo')}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        Auth Demo
                      </button>
                      <button
                        onClick={() => handleNavigation('/token-security')}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        Token Security Demo
                      </button>
                      <button
                        onClick={() => handleNavigation('/role-demo')}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        Role Demo
                      </button>
                      <PermissionGuard permissions={['view_reports']}>
                        <button
                          onClick={() => handleNavigation('/reports')}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          Reports (Permission Demo)
                        </button>
                      </PermissionGuard>
                    </div>

                    {/* Sign out */}
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        onClick={handleSignOut}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3 text-gray-400" />
                        Sign out
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 