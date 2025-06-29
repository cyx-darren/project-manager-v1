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

console.log('🚀 Main.tsx: Starting app initialization...')

const root = createRoot(document.getElementById('root')!)

console.log('📦 Main.tsx: Root element created, about to render app...')

try {
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
  console.log('✅ Main.tsx: Root.render() call completed')
} catch (error) {
  console.error('❌ Main.tsx: Error during root.render():', error)
}

console.log('✅ Main.tsx: App rendered successfully')
