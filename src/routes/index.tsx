import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from '../components/layout';
import Dashboard from '../pages/Dashboard';
import Projects from '../pages/Projects';
import ProjectDetail from '../pages/ProjectDetail';
import NotFound from '../pages/NotFound';
import Unauthorized from '../pages/Unauthorized';
import ProtectedRoute, { AdminRoute, PermissionRoute } from '../components/ProtectedRoute';
import { Login } from '../pages/Login';
import { Signup } from '../pages/Signup';
import { AuthTest } from '../pages/AuthTest';
import { AuthCallback } from '../pages/AuthCallback';
import AuthStateDemo from '../pages/AuthStateDemo';
import TokenSecurityDemo from '../pages/TokenSecurityDemo';
import TeamManagement from '../pages/TeamManagement';
import RoleDemo from '../pages/RoleDemo';
import ApiTester from '../components/dev/ApiTester'
import PermissionDemo from '../components/dev/PermissionDemo';
import SchemaValidationTest from '../pages/SchemaValidationTest';
import CustomKanbanTest from '../pages/CustomKanbanTest';
import CollaborationDemo from '../pages/CollaborationDemo';
import { VersionHistoryDemo } from '../pages/VersionHistoryDemo';
import { WorkspaceSettings } from '../pages/WorkspaceSettings';
import { WorkspaceList } from '../pages/WorkspaceList';
import { AdminUserManagement } from '../pages/AdminUserManagement';
import { AdminRLSTesting } from '../pages/AdminRLSTesting';
import { ActivityDashboard } from '../components/activity/ActivityDashboard';
import SecurityAuditDashboard from '../components/admin/SecurityAuditDashboard';


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
        path: 'inbox',
        element: (
          <ProtectedRoute>
            <div className="p-6">
              <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
              <p className="text-gray-600 mt-2">Your notifications and updates...</p>
            </div>
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
        path: 'tasks/new',
        element: (
          <ProtectedRoute>
            <div className="p-6">
              <h1 className="text-2xl font-bold text-gray-900">Create New Task</h1>
              <p className="text-gray-600 mt-2">Task creation form coming soon...</p>
            </div>
          </ProtectedRoute>
        )
      },
      {
        path: 'projects',
        element: (
          <ProtectedRoute>
            <Projects />
          </ProtectedRoute>
        )
      },
      {
        path: 'projects/new',
        element: (
          <PermissionRoute requiredPermissions={['create_projects']}>
            <div className="p-6">
              <h1 className="text-2xl font-bold text-gray-900">Create New Project</h1>
              <p className="text-gray-600 mt-2">Project creation form coming soon...</p>
            </div>
          </PermissionRoute>
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
        path: 'activity',
        element: (
          <ProtectedRoute>
            <div className="p-6">
              <ActivityDashboard />
            </div>
          </ProtectedRoute>
        )
      },
      {
        path: 'projects/:projectId/*',
        element: (
          <ProtectedRoute>
            <ProjectDetail />
          </ProtectedRoute>
        )
      },
      {
        path: 'team',
        element: (
          <ProtectedRoute>
            <TeamManagement />
          </ProtectedRoute>
        )
      },
      {
        path: 'team/invite',
        element: (
          <PermissionRoute requiredPermissions={['manage_users']}>
            <div className="p-6">
              <h1 className="text-2xl font-bold text-gray-900">Invite Team Members</h1>
              <p className="text-gray-600 mt-2">Team invitation form coming soon...</p>
            </div>
          </PermissionRoute>
        )
      },
      {
        path: 'workspaces',
        element: (
          <ProtectedRoute>
            <WorkspaceList />
          </ProtectedRoute>
        )
      },
      {
        path: 'workspaces/:workspaceId/settings',
        element: (
          <ProtectedRoute>
            <WorkspaceSettings />
          </ProtectedRoute>
        )
      },
      {
        path: 'settings',
        element: (
          <ProtectedRoute>
            <div className="p-6">
              <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600 mt-2">User settings and preferences...</p>
            </div>
          </ProtectedRoute>
        )
      },
      {
        path: 'docs',
        element: (
          <ProtectedRoute>
            <div className="p-6">
              <h1 className="text-2xl font-bold text-gray-900">Documentation</h1>
              <p className="text-gray-600 mt-2">Help and documentation...</p>
            </div>
          </ProtectedRoute>
        )
      },
      {
        path: 'support',
        element: (
          <ProtectedRoute>
            <div className="p-6">
              <h1 className="text-2xl font-bold text-gray-900">Support</h1>
              <p className="text-gray-600 mt-2">Get help and support...</p>
            </div>
          </ProtectedRoute>
        )
      },
      {
        path: 'role-demo',
        element: (
          <ProtectedRoute>
            <RoleDemo />
          </ProtectedRoute>
        )
      },
      {
        path: 'api-test',
        element: (
          <ProtectedRoute>
            <ApiTester />
          </ProtectedRoute>
        )
      },
      {
        path: 'permission-demo',
        element: (
          <ProtectedRoute>
            <PermissionDemo />
          </ProtectedRoute>
        )
      },
      {
        path: 'schema-validation-test',
        element: (
          <ProtectedRoute>
            <SchemaValidationTest />
          </ProtectedRoute>
        )
      },
      {
        path: 'custom-kanban-test/:projectId',
        element: (
          <ProtectedRoute>
            <CustomKanbanTest />
          </ProtectedRoute>
        )
      },
      {
        path: 'collaboration-demo',
        element: (
          <ProtectedRoute>
            <CollaborationDemo />
          </ProtectedRoute>
        )
      },
      {
        path: 'version-history-demo',
        element: (
          <ProtectedRoute>
            <VersionHistoryDemo />
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
                <a
                  href="/admin/users"
                  className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  data-testid="admin-user-management-link"
                >
                  <h3 className="font-medium text-blue-900">User Management</h3>
                  <p className="text-sm text-blue-700 mt-1">Manage user accounts and permissions</p>
                </a>
                <a
                  href="/admin/rls-testing"
                  className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                  data-testid="admin-rls-testing-link"
                >
                  <h3 className="font-medium text-green-900">RLS Testing</h3>
                  <p className="text-sm text-green-700 mt-1">Test Row Level Security policies</p>
                </a>
                <a
                  href="/admin/security-audit"
                  className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                  data-testid="admin-security-audit-link"
                >
                  <h3 className="font-medium text-purple-900">Security & Performance Audit</h3>
                  <p className="text-sm text-purple-700 mt-1">Comprehensive security and performance monitoring</p>
                </a>
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
    path: '/admin/users',
    element: (
      <AdminRoute>
        <AdminUserManagement />
      </AdminRoute>
    )
  },
  {
    path: '/admin/rls-testing',
    element: (
      <AdminRoute>
        <AdminRLSTesting />
      </AdminRoute>
    )
  },
  {
    path: '/admin/security-audit',
    element: (
      <AdminRoute>
        <SecurityAuditDashboard />
      </AdminRoute>
    )
  },

  {
    path: '*',
    element: <NotFound />
  }
]); 