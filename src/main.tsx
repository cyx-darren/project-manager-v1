import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import { router } from './routes'
import ErrorBoundary from './components/ErrorBoundary'
import { ThemeProvider } from './contexts/ThemeContext'
import { AuthProvider } from './contexts/AuthContext'
import { ProjectProvider } from './contexts/ProjectContext'
import { SearchProvider } from './contexts/SearchContext'
// Import initialization and health checks
import './App'

// Import admin setup utilities for development
import './utils/quickAdminSetup'

// Import and apply security enhancements
import { CSPUtils } from './utils/secureTokenStorage'

// Apply Content Security Policy for enhanced security
CSPUtils.applyCSSClientSide()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <ProjectProvider>
            <SearchProvider>
              <RouterProvider router={router} />
            </SearchProvider>
          </ProjectProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
)
