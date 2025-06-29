import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useProject } from '../contexts/ProjectContext'
import { teamService, type Project } from '../services/teamService'
import LoadingSpinner from '../components/LoadingSpinner'
import { 
  AdminOnly, 
  MemberOrAbove, 
  PermissionGuard, 
  AccessDenied, 
  UserRoleBadge 
} from '../components/auth/RoleGuard'
import {
  ProjectOwnerOnly,
  ProjectAdminOrAbove,
  ProjectMemberOrAbove,
  CanManageMembers,
  CanManageTasks,
  ProjectRoleBadge,
  ProjectPermissionsList
} from '../components/auth/ProjectRoleGuard'

const RoleDemo: React.FC = () => {
  const { 
    user, 
    hasRole, 
    hasPermission_legacy 
  } = useAuth()
  
  const { 
    currentProject, 
    setCurrentProject, 
    userRoleInProject, 
    isProjectOwner, 
    isProjectAdmin, 
    canManageMembers,
    hasProjectRole, 
    hasProjectPermission, 
    canPerformAction,
    loading: projectLoading 
  } = useProject()
  
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  // Load user's projects
  useEffect(() => {
    loadProjects()
  }, [user])

  const loadProjects = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data: userProjects, error } = await teamService.getUserProjects(user.id)
      
      if (error) {
        console.error('Error loading projects:', error)
        return
      }

      if (userProjects && userProjects.length > 0) {
        setProjects(userProjects)
        if (!currentProject) {
          setCurrentProject(userProjects[0])
        }
      }
    } catch (error) {
      console.error('Error loading projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProjectChange = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    if (project) {
      setCurrentProject(project)
    }
  }

  if (loading || projectLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Role-Based Access Control Demo</h1>
          <p className="text-gray-600">
            This page demonstrates both global auth roles and project-specific role-based access control.
          </p>
        </div>

        {/* User Information Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Current User Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2">Global Auth State:</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>ID:</strong> {user?.id?.slice(0, 8)}...</p>
                <p><strong>Global Role:</strong> <UserRoleBadge /></p>
                <p><strong>Authenticated:</strong> {user ? '✅ Yes' : '❌ No'}</p>
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-2">Global Role Checks:</h3>
              <div className="space-y-1 text-sm">
                <p>Is Admin: {hasRole('admin') ? '✅ Yes' : '❌ No'}</p>
                <p>Is Member: {hasRole('member') ? '✅ Yes' : '❌ No'}</p>
                <p>Is Guest: {hasRole('guest') ? '✅ Yes' : '❌ No'}</p>
                <p>Has manage_users permission: {hasPermission_legacy('manage_users') ? '✅ Yes' : '❌ No'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Project Selection */}
        {projects.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Project Context</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="project-select" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Project:
                </label>
                <select
                  id="project-select"
                  value={currentProject?.id || ''}
                  onChange={(e) => handleProjectChange(e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">No project selected</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.title}
                    </option>
                  ))}
                </select>
              </div>
              
              {currentProject && (
                <div>
                  <h3 className="font-medium mb-2">Current Project Role:</h3>
                  <div className="flex items-center gap-2 mb-3">
                    <ProjectRoleBadge />
                    <span className="text-sm text-gray-600">
                      in "{currentProject.title}"
                    </span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p>Role: {userRoleInProject || 'No role'}</p>
                    <p>Is Owner: {isProjectOwner ? '✅ Yes' : '❌ No'}</p>
                    <p>Is Admin: {isProjectAdmin ? '✅ Yes' : '❌ No'}</p>
                    <p>Can Manage Members: {canManageMembers ? '✅ Yes' : '❌ No'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Global Role Guards Demo */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Global Role Guards Demo</h2>
          <div className="space-y-4">
            
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Admin Only Content:</h3>
              <AdminOnly fallback={<AccessDenied message="Admin access required" />}>
                <div className="bg-red-50 p-3 rounded border-red-200 border">
                  🔥 This content is only visible to global admins!
                </div>
              </AdminOnly>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Member or Above Content:</h3>
              <MemberOrAbove fallback={<AccessDenied message="Member access required" />}>
                <div className="bg-blue-50 p-3 rounded border-blue-200 border">
                  👥 This content is visible to global members and admins!
                </div>
              </MemberOrAbove>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-2">Permission-Based Content:</h3>
              <PermissionGuard 
                permissions={['manage_users']} 
                fallback={<AccessDenied message="User management permission required" />}
              >
                <div className="bg-green-50 p-3 rounded border-green-200 border">
                  ⚙️ Global user management panel would be here!
                </div>
              </PermissionGuard>
            </div>

          </div>
        </div>

        {/* Project Role Guards Demo */}
        {currentProject && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Project Role Guards Demo</h2>
            <div className="space-y-4">
              
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Project Owner Only:</h3>
                <ProjectOwnerOnly fallback={<AccessDenied message="Project owner access required" />}>
                  <div className="bg-purple-50 p-3 rounded border-purple-200 border">
                    👑 This content is only visible to the project owner!
                  </div>
                </ProjectOwnerOnly>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Project Admin or Above:</h3>
                <ProjectAdminOrAbove fallback={<AccessDenied message="Project admin access required" />}>
                  <div className="bg-red-50 p-3 rounded border-red-200 border">
                    ⚡ This content is visible to project admins and owners!
                  </div>
                </ProjectAdminOrAbove>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Project Member or Above:</h3>
                <ProjectMemberOrAbove fallback={<AccessDenied message="Project member access required" />}>
                  <div className="bg-blue-50 p-3 rounded border-blue-200 border">
                    👤 This content is visible to all project members!
                  </div>
                </ProjectMemberOrAbove>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Can Manage Members:</h3>
                <CanManageMembers fallback={<AccessDenied message="Member management permission required" />}>
                  <div className="bg-yellow-50 p-3 rounded border-yellow-200 border">
                    👥 Member management controls would be here!
                  </div>
                </CanManageMembers>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Can Manage Tasks:</h3>
                <CanManageTasks fallback={<AccessDenied message="Task management permission required" />}>
                  <div className="bg-indigo-50 p-3 rounded border-indigo-200 border">
                    📋 Task management controls would be here!
                  </div>
                </CanManageTasks>
              </div>

            </div>
          </div>
        )}

        {/* Project Permissions Details */}
        {currentProject && userRoleInProject && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Your Project Permissions</h2>
            <ProjectPermissionsList />
            
            <div className="mt-6 space-y-2">
              <h3 className="font-medium">Permission Check Examples:</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p>Can edit project: {hasProjectPermission('edit_project') ? '✅ Yes' : '❌ No'}</p>
                  <p>Can delete project: {hasProjectPermission('delete_project') ? '✅ Yes' : '❌ No'}</p>
                  <p>Can manage members: {hasProjectPermission('manage_members') ? '✅ Yes' : '❌ No'}</p>
                </div>
                <div>
                  <p>Can create tasks: {hasProjectPermission('create_tasks') ? '✅ Yes' : '❌ No'}</p>
                  <p>Can invite members: {canPerformAction('invite_members') ? '✅ Yes' : '❌ No'}</p>
                  <p>Can remove members: {canPerformAction('remove_members') ? '✅ Yes' : '❌ No'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Role Hierarchy Demo */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Role Hierarchy Demo</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Global Role Hierarchy:</h3>
              <div className="text-sm text-gray-600">
                <p>guest &lt; member &lt; admin</p>
                <p>Each higher role includes permissions of lower roles.</p>
              </div>
            </div>
            
            {currentProject && (
              <div>
                <h3 className="font-medium mb-2">Project Role Hierarchy:</h3>
                <div className="text-sm text-gray-600">
                  <p>member &lt; admin &lt; owner</p>
                  <p>Project roles are specific to each project.</p>
                </div>
                
                <div className="mt-4 space-y-2">
                  <h4 className="font-medium">Current Project Role Checks:</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Has Member Role:</p>
                      <p>{hasProjectRole('member') ? '✅ Yes' : '❌ No'}</p>
                    </div>
                    <div>
                      <p className="font-medium">Has Admin Role:</p>
                      <p>{hasProjectRole('admin') ? '✅ Yes' : '❌ No'}</p>
                    </div>
                    <div>
                      <p className="font-medium">Has Owner Role:</p>
                      <p>{hasProjectRole('owner') ? '✅ Yes' : '❌ No'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Integration Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">Implementation Complete! 🎉</h2>
          <div className="text-blue-800 text-sm space-y-2">
            <p>✅ <strong>Global Authentication Roles:</strong> Basic admin/member/guest roles from user metadata</p>
            <p>✅ <strong>Project-Specific Roles:</strong> Owner/admin/member roles from database project_members table</p>
            <p>✅ <strong>Role Guard Components:</strong> Both global and project-specific access control</p>
            <p>✅ <strong>Permission System:</strong> Granular permissions for different actions</p>
            <p>✅ <strong>Context Integration:</strong> AuthContext + ProjectContext working together</p>
            <p>✅ <strong>Database Integration:</strong> RLS policies enforcing role-based security</p>
          </div>
        </div>

      </div>
    </div>
  )
}

export default RoleDemo 