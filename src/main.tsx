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

// CRITICAL: Initialize production safety checks FIRST
import { initializeProductionSafety } from './utils/productionSafety'

console.log('🚀 Main.tsx: Starting app initialization...')

// Initialize production safety checks to prevent localhost connections
try {
  initializeProductionSafety()
  console.log('✅ Production safety checks passed')
} catch (error) {
  console.error('❌ Production safety check failed:', error)
  // Show user-friendly error message
  const errorMessage = error instanceof Error ? error.message : 'Unknown configuration error'
  const errorDiv = document.createElement('div')
  errorDiv.innerHTML = `
    <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: #fee; display: flex; align-items: center; justify-content: center; z-index: 9999;">
      <div style="max-width: 500px; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
        <h2 style="color: #dc2626; margin-bottom: 16px;">⚠️ Configuration Error</h2>
        <p style="margin-bottom: 16px;">The application cannot start due to a configuration issue:</p>
        <code style="background: #f5f5f5; padding: 8px; border-radius: 4px; display: block; margin-bottom: 16px;">${errorMessage}</code>
        <p style="color: #6b7280;">Please check your environment variables and try refreshing the page.</p>
      </div>
    </div>
  `
  document.body.appendChild(errorDiv)
  throw error // Re-throw to prevent further execution
}

// Import emergency fix utilities
import './utils/emergencyFix'
// Import initialization and health checks
import './App'

// Import admin setup utilities for development
import './utils/quickAdminSetup'

// Import and apply security enhancements
import { CSPUtils } from './utils/secureTokenStorage'

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
