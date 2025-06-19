import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from '../components/layout';
import Dashboard from '../pages/Dashboard';
import NotFound from '../pages/NotFound';
import ProtectedRoute from '../components/ProtectedRoute';

// Main application routes
export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        )
      },
      {
        path: 'tasks',
        element: (
          <ProtectedRoute>
            <div className="p-6">
              <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
              <p className="text-gray-600 mt-2">Task management coming soon...</p>
            </div>
          </ProtectedRoute>
        )
      },
      {
        path: 'calendar',
        element: (
          <ProtectedRoute>
            <div className="p-6">
              <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
              <p className="text-gray-600 mt-2">Calendar view coming soon...</p>
            </div>
          </ProtectedRoute>
        )
      },
      {
        path: 'reports',
        element: (
          <ProtectedRoute>
            <div className="p-6">
              <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
              <p className="text-gray-600 mt-2">Reports and analytics coming soon...</p>
            </div>
          </ProtectedRoute>
        )
      },
      {
        path: 'projects/:projectId',
        element: (
          <ProtectedRoute>
            <div className="p-6">
              <h1 className="text-2xl font-bold text-gray-900">Project Details</h1>
              <p className="text-gray-600 mt-2">Project view coming soon...</p>
            </div>
          </ProtectedRoute>
        )
      }
    ]
  },
  {
    path: '/login',
    element: <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Authentication coming soon...
          </p>
        </div>
      </div>
    </div>
  },
  {
    path: '*',
    element: <NotFound />
  }
]); 