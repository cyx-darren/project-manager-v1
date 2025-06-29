import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import { router } from './routes'
import ErrorBoundary from './components/ErrorBoundary'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import { PermissionProvider } from './contexts/PermissionContext'
import { ProjectProvider } from './contexts/ProjectContext'
import { SearchProvider } from './contexts/SearchContext'
import { ToastProvider } from './contexts/ToastContext'
import { TaskProvider } from './contexts/TaskContext'
import { CollaborativeNotificationsProvider } from './components/notifications/CollaborativeNotificationsProvider'
// Import emergency fix utilities
import './utils/emergencyFix'
// Import initialization and health checks
import './App'

// Import admin setup utilities for development
import './utils/quickAdminSetup'

// Import and apply security enhancements
import { CSPUtils } from './utils/secureTokenStorage'

console.log('🚀 Main.tsx: Starting app initialization...')

// Apply CSP enhancements
CSPUtils.applyCSSClientSide()

console.log('🔒 Main.tsx: CSP enhancements applied')

const root = createRoot(document.getElementById('root')!)

console.log('📦 Main.tsx: Root element created, about to render app...')

root.render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <PermissionProvider>
            <ProjectProvider>
              <SearchProvider>
                <ToastProvider>
                  <CollaborativeNotificationsProvider>
                  <TaskProvider>
                    <RouterProvider router={router} />
                  </TaskProvider>
                  </CollaborativeNotificationsProvider>
                </ToastProvider>
              </SearchProvider>
            </ProjectProvider>
          </PermissionProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>
)

console.log('✅ Main.tsx: App rendered successfully')
