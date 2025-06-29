import React, { useState } from 'react'
import { 
  useAuth, 
  useRole, 
  useAuthorization, 
  useAuthenticatedFetch 
} from '../contexts/AuthContext'
import { 
  RoleGuard, 
  AdminOnly, 
  MemberOrAbove, 
  PermissionGuard, 
  AccessDenied, 
  UserRoleBadge 
} from '../components/auth/RoleGuard'
import LoadingSpinner from '../components/LoadingSpinner'

const AuthStateDemo: React.FC = () => {
  const { 
    user, 
    session, 
    loading, 
    isAuthenticated, 
    hasRole, 
    hasPermission_legacy,
    hasAnyPermission_legacy,
    hasAllPermissions_legacy,
    refreshSession 
  } = useAuth()
  
  const { role: userRole } = useRole()
  const canManageUsers = useAuthorization(['manage_users'])
  const authenticatedFetch = useAuthenticatedFetch()
  
  const [refreshing, setRefreshing] = useState(false)
  const [testResult, setTestResult] = useState<string>('')

  const handleRefreshSession = async () => {
    setRefreshing(true)
    try {
      const result = await refreshSession()
      if (result.error) {
        setTestResult(`Session refresh failed: ${result.error.message}`)
      } else {
        setTestResult('Session refreshed successfully!')
      }
    } catch (error) {
      setTestResult(`Session refresh error: ${error}`)
    } finally {
      setRefreshing(false)
    }
  }

  const testAuthenticatedFetch = async () => {
    try {
      const response = await authenticatedFetch('/api/protected-test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      setTestResult(`Authenticated fetch configured with headers: ${JSON.stringify(Array.from(response.headers.entries()))}`)
    } catch (error) {
      setTestResult(`Authenticated fetch error: ${error}`)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-center mb-6">Auth State Demo</h1>
          <p className="text-gray-600 text-center">
            Please sign in to view the auth state management demo.
          </p>
          <div className="mt-6 text-center">
            <a 
              href="/login" 
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Auth State Management Demo</h1>
          
          {/* User Information Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Current User Information</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p><strong>Email:</strong> {user?.email}</p>
                  <p><strong>ID:</strong> {user?.id}</p>
                  <p><strong>Role:</strong> <UserRoleBadge /></p>
                  <p><strong>Authenticated:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}</p>
                </div>
                <div>
                  <p><strong>Session Valid:</strong> {session ? '✅ Yes' : '❌ No'}</p>
                  <p><strong>Token Expires:</strong> {session?.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'N/A'}</p>
                  <p><strong>Permissions:</strong> {user?.permissions?.join(', ') || 'None'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Role Testing Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Role-Based Access Testing</h2>
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Current Role Checks:</h3>
                <div className="space-y-2">
                  <p>Is Admin: {hasRole('admin') ? '✅ Yes' : '❌ No'}</p>
                  <p>Is Member: {hasRole('member') ? '✅ Yes' : '❌ No'}</p>
                  <p>Is Guest: {hasRole('guest') ? '✅ Yes' : '❌ No'}</p>
                  <p>Role from Hook: {userRole}</p>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Permission Checks:</h3>
                <div className="space-y-2">
                  <p>Can Manage Users: {hasPermission_legacy('manage_users') ? '✅ Yes' : '❌ No'}</p>
                  <p>Can View Reports: {hasPermission_legacy('view_reports') ? '✅ Yes' : '❌ No'}</p>
                  <p>Can Delete Projects: {hasPermission_legacy('delete_projects') ? '✅ Yes' : '❌ No'}</p>
                  <p>Has Any Permission: {hasAnyPermission_legacy(['manage_users', 'view_reports']) ? '✅ Yes' : '❌ No'}</p>
                  <p>Has All Permissions: {hasAllPermissions_legacy(['manage_users', 'view_reports']) ? '✅ Yes' : '❌ No'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Component Guards Demo */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Component Guards Demo</h2>
            <div className="space-y-4">
              
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Admin Only Content:</h3>
                <AdminOnly fallback={<AccessDenied message="Admin access required" />}>
                  <div className="bg-red-50 p-3 rounded border-red-200 border">
                    🔥 This content is only visible to admins!
                  </div>
                </AdminOnly>
              </div>

              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Member or Above Content:</h3>
                <MemberOrAbove fallback={<AccessDenied message="Member access required" />}>
                  <div className="bg-blue-50 p-3 rounded border-blue-200 border">
                    👥 This content is visible to members and admins!
                  </div>
                </MemberOrAbove>
              </div>

              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Permission-Based Content:</h3>
                <PermissionGuard 
                  permissions={['manage_users']} 
                  fallback={<AccessDenied message="User management permission required" />}
                >
                  <div className="bg-green-50 p-3 rounded border-green-200 border">
                    ⚙️ User management panel would be here!
                  </div>
                </PermissionGuard>
              </div>

              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Role Guard with Multiple Requirements:</h3>
                <RoleGuard 
                  requiredRole="admin"
                  requiredPermissions={['manage_users', 'view_reports']}
                  requireAll={true}
                  fallback={<AccessDenied message="Admin role + full permissions required" />}
                >
                  <div className="bg-purple-50 p-3 rounded border-purple-200 border">
                    👑 Super admin content with full permissions!
                  </div>
                </RoleGuard>
              </div>

            </div>
          </div>

          {/* Session Management */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Session Management</h2>
            <div className="space-y-4">
              <div className="flex space-x-4">
                <button
                  onClick={handleRefreshSession}
                  disabled={refreshing}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {refreshing ? 'Refreshing...' : 'Refresh Session'}
                </button>
                <button
                  onClick={testAuthenticatedFetch}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  Test Authenticated Fetch
                </button>
              </div>
              
              {testResult && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <strong>Test Result:</strong> {testResult}
                </div>
              )}
            </div>
          </div>

          {/* Hook Usage Examples */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Custom Hook Usage Examples</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <pre className="text-sm overflow-x-auto">
{`// Using the enhanced hooks:
const { hasRole, hasPermission } = useAuth()
const userRole = useRole()
const canManageUsers = useAuthorization(['manage_users'])
const authenticatedFetch = useAuthenticatedFetch()

// Current values:
userRole: "${userRole}"
canManageUsers: ${canManageUsers}
hasRole('admin'): ${hasRole('admin')}
hasPermission('manage_users'): ${hasPermission_legacy('manage_users')}`}
              </pre>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default AuthStateDemo 