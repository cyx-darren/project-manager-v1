import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import Breadcrumb from '../Breadcrumb';
import { SearchModal } from '../search';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Set up global keyboard shortcuts
  useKeyboardShortcuts({
    onSearch: () => setSearchModalOpen(true),
    onEscape: () => {
      if (searchModalOpen) {
        setSearchModalOpen(false);
      }
    }
  });

  // Handle mobile detection
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // Auto-close sidebar on mobile when screen size changes
      if (mobile && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [sidebarOpen]);

  // Close sidebar when clicking outside on mobile
  const handleBackdropClick = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="h-full flex bg-gray-50">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      {/* Mobile backdrop */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 z-20 md:hidden"
          onClick={handleBackdropClick}
        />
      )}
      
      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-white">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Breadcrumb />
              <div className="mt-6">
                <Outlet />
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Global Search Modal */}
      <SearchModal 
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
      />
    </div>
  );
};

export default Layout; 