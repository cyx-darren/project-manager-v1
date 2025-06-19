import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from '../components/layout';
import Dashboard from '../pages/Dashboard';
import NotFound from '../pages/NotFound';
import Unauthorized from '../pages/Unauthorized';
import ProtectedRoute, { AdminRoute, PermissionRoute } from '../components/ProtectedRoute';
import { Login } from '../pages/Login';
import { Signup } from '../pages/Signup';
import { AuthTest } from '../pages/AuthTest';
import { AuthCallback } from '../pages/AuthCallback';
import AuthStateDemo from '../pages/AuthStateDemo';
import TokenSecurityDemo from '../pages/TokenSecurityDemo';

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
          <PermissionRoute requiredPermissions={['view_reports']}>
            <div className="p-6">
              <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
              <p className="text-gray-600 mt-2">Reports and analytics coming soon...</p>
              <div className="mt-4 p-4 bg-green-50 rounded-md">
                <p className="text-sm text-green-800">
                  ✅ You have permission to view reports
                </p>
              </div>
            </div>
          </PermissionRoute>
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
    element: <Login />
  },
  {
    path: '/signup',
    element: <Signup />
  },
  {
    path: '/auth/callback',
    element: <AuthCallback />
  },
  {
    path: '/auth-test',
    element: <AuthTest />
  },
  {
    path: '/auth-demo',
    element: (
      <ProtectedRoute>
        <AuthStateDemo />
      </ProtectedRoute>
    )
  },
  {
    path: '/token-security',
    element: (
      <ProtectedRoute>
        <TokenSecurityDemo />
      </ProtectedRoute>
    )
  },
  {
    path: '/unauthorized',
    element: <Unauthorized />
  },
  {
    path: '/admin',
    element: (
      <AdminRoute>
        <div className="min-h-screen bg-gray-50 p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Admin Controls</h2>
              <p className="text-gray-600 mb-4">
                This page is only accessible to users with admin role.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-900">User Management</h3>
                  <p className="text-sm text-blue-700 mt-1">Manage user accounts and permissions</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-medium text-green-900">System Settings</h3>
                  <p className="text-sm text-green-700 mt-1">Configure system-wide settings</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h3 className="font-medium text-purple-900">Reports & Analytics</h3>
                  <p className="text-sm text-purple-700 mt-1">View detailed system reports</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <h3 className="font-medium text-orange-900">Audit Logs</h3>
                  <p className="text-sm text-orange-700 mt-1">Review system activity logs</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminRoute>
    )
  },
  {
    path: '*',
    element: <NotFound />
  }
]); 