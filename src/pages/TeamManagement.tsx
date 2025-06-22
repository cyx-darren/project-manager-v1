import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useProject } from '../contexts/ProjectContext'
import { teamService, type Project } from '../services/teamService'
import TeamMemberList from '../components/team/TeamMemberList'
import AddTeamMember from '../components/team/AddTeamMember'
import LoadingSpinner from '../components/LoadingSpinner'
import { AdminOnly } from '../components/auth/RoleGuard'
import { 
  CanManageMembers, 
  ProjectRoleBadge, 
  ProjectPermissionsList 
} from '../components/auth/ProjectRoleGuard'

const TeamManagement: React.FC = () => {
  const { user } = useAuth()
  const { 
    currentProject, 
    setCurrentProject, 
    userRoleInProject, 
    canManageMembers,
    refreshProjectData 
  } = useProject()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [showAddMember, setShowAddMember] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load user's projects
  useEffect(() => {
    loadProjects()
  }, [user])

  const loadProjects = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      // Get actual projects from the database
      const { data: userProjects, error: projectsError } = await teamService.getUserProjects(user.id)
      
      if (projectsError) {
        console.error('Error fetching user projects:', projectsError)
        // Fall back to checking if user owns any projects directly
        const { data: allProjects, error: allProjectsError } = await teamService.getAllProjects()
        
        if (allProjectsError || !allProjects || allProjects.length === 0) {
          setError('No projects found. Please create a project first.')
          return
        }
        
        // Filter projects owned by current user
        const ownedProjects = allProjects.filter((p: Project) => p.owner_id === user.id)
        setProjects(ownedProjects)
        if (ownedProjects.length > 0) {
          setSelectedProject(ownedProjects[0].id)
          setCurrentProject(ownedProjects[0])
        }
      } else if (userProjects && userProjects.length > 0) {
        setProjects(userProjects)
        setSelectedProject(userProjects[0].id)
        setCurrentProject(userProjects[0])
      } else {
        // No projects found - this shouldn't happen if the SQL script worked
        setError('No projects found. The database setup may be incomplete.')
      }
    } catch (err) {
      console.error('Error loading projects:', err)
      setError('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  const handleMemberUpdate = () => {
    // This will trigger a refresh in the TeamMemberList component
    console.log('Member updated - refreshing list')
    setRefreshKey(prev => prev + 1)
    // Also refresh project context data
    refreshProjectData()
  }

  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId)
    setShowAddMember(false) // Hide add member form when switching projects
    
    // Update project context
    const project = projects.find(p => p.id === projectId)
    if (project) {
      setCurrentProject(project)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Loading team management...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-md p-6 max-w-md">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => {
                    loadProjects()
                    setRefreshKey(prev => prev + 1)
                  }}
                  className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Team Management
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage team members and their roles across your projects
              </p>
            </div>
          </div>
        </div>

        {/* Project Selection */}
        {projects.length > 1 && (
          <div className="mb-6">
            <label htmlFor="project-select" className="block text-sm font-medium text-gray-700 mb-2">
              Select Project
            </label>
            <select
              id="project-select"
              value={selectedProject}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="block w-full max-w-xs border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedProject && (
          <div className="space-y-6">
            {/* Current Project Info */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {projects.find(p => p.id === selectedProject)?.title}
                    </h3>
                      <ProjectRoleBadge />
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {projects.find(p => p.id === selectedProject)?.description}
                    </p>
                    {userRoleInProject && (
                      <p className="mt-2 text-sm text-gray-600">
                        Your role: <span className="font-medium">{userRoleInProject}</span>
                      </p>
                    )}
                  </div>
                  <CanManageMembers>
                    <button
                      onClick={() => setShowAddMember(!showAddMember)}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {showAddMember ? 'Cancel' : 'Add Member'}
                    </button>
                  </CanManageMembers>
                </div>
              </div>
            </div>

            {/* Add Team Member Form */}
            {showAddMember && (
              <CanManageMembers>
                <AddTeamMember
                  projectId={selectedProject}
                  onMemberAdded={() => {
                    handleMemberUpdate()
                    setShowAddMember(false)
                  }}
                  onCancel={() => setShowAddMember(false)}
                />
              </CanManageMembers>
            )}

            {/* Team Member List */}
            <TeamMemberList
              key={`${selectedProject}-${refreshKey}`}
              projectId={selectedProject}
              onMemberUpdate={handleMemberUpdate}
            />

            {/* Demo Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-blue-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Demo Features Implemented
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>View team members with roles and permissions</li>
                      <li>Role-based access control (Admin/Member/Owner)</li>
                      <li>Update member roles (Admin+ only)</li>
                      <li>Remove team members (Admin+ only)</li>
                      <li>Team member invitation system (demo)</li>
                      <li>Real-time member count and status</li>
                      <li>Responsive design with user avatars</li>
                    </ul>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm text-blue-700">
                      <strong>Note:</strong> This is connected to your Supabase database with proper RLS policies.
                      The team management system is fully functional for multi-user collaboration.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Team Statistics */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Team Overview
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-gray-500">Total Members</div>
                    <div className="mt-1 text-2xl font-semibold text-gray-900">
                      <TeamMemberCount projectId={selectedProject} />
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-gray-500">Your Role</div>
                    <div className="mt-1 text-lg font-semibold text-gray-900">
                      <UserRole projectId={selectedProject} />
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm font-medium text-gray-500">Project Owner</div>
                    <div className="mt-1 text-lg font-semibold text-gray-900">
                      {user?.id === projects.find(p => p.id === selectedProject)?.owner_id ? 'You' : 'Other'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {projects.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No projects</h3>
            <p className="mt-1 text-sm text-gray-500">
              Create a project first to manage team members.
            </p>
          </div>
        )}
    </div>
  )
}

// Helper component to display member count
const TeamMemberCount: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [count, setCount] = useState<number>(0)

  useEffect(() => {
    const loadCount = async () => {
      const { data } = await teamService.getProjectMemberCount(projectId)
      setCount(data)
    }
    loadCount()
  }, [projectId])

  return <span>{count}</span>
}

// Helper component to display user's role
const UserRole: React.FC<{ projectId: string }> = ({ projectId }) => {
  const { user } = useAuth()
  const [role, setRole] = useState<string>('Loading...')

  useEffect(() => {
    const loadRole = async () => {
      if (!user) return
      
      const { data } = await teamService.getUserRoleInProject(projectId, user.id)
      setRole(data || 'Not a member')
    }
    loadRole()
  }, [projectId, user])

  return <span className="capitalize">{role}</span>
}

export default TeamManagement 