import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { teamService, type MemberRole, type Project, type TeamMember } from '../services/teamService'

interface ProjectContextType {
  // Current project state
  currentProject: Project | null
  userRoleInProject: MemberRole | null
  projectMembers: TeamMember[]
  isProjectOwner: boolean
  isProjectAdmin: boolean
  canManageMembers: boolean
  loading: boolean
  
  // Project management methods
  setCurrentProject: (project: Project | null) => void
  refreshProjectData: () => Promise<void>
  switchProject: (projectId: string) => Promise<void>
  
  // Permission checks specific to current project
  hasProjectRole: (role: MemberRole) => boolean
  hasProjectPermission: (permission: ProjectPermission) => boolean
  canPerformAction: (action: ProjectAction) => boolean
}

export type ProjectPermission = 
  | 'view_project' 
  | 'edit_project' 
  | 'delete_project'
  | 'manage_members' 
  | 'assign_tasks' 
  | 'create_tasks' 
  | 'edit_tasks' 
  | 'delete_tasks'

export type ProjectAction = 
  | 'invite_members'
  | 'remove_members' 
  | 'change_member_roles'
  | 'delete_project'
  | 'edit_project_settings'

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

export const useProject = () => {
  const context = useContext(ProjectContext)
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider')
  }
  return context
}

// Convenience hooks for common checks
export const useProjectRole = () => {
  const { userRoleInProject } = useProject()
  return userRoleInProject || null
}

export const useProjectPermissions = () => {
  const { hasProjectPermission, canPerformAction } = useProject()
  return { hasProjectPermission, canPerformAction }
}

interface ProjectProviderProps {
  children: ReactNode
}

export const ProjectProvider: React.FC<ProjectProviderProps> = ({ children }) => {
  const { user } = useAuth()
  const [currentProject, setCurrentProjectState] = useState<Project | null>(null)
  const [userRoleInProject, setUserRoleInProject] = useState<MemberRole | null>(null)
  const [projectMembers, setProjectMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(false)

  // Calculate derived permissions
  const isProjectOwner = currentProject?.owner_id === user?.id
  const isProjectAdmin = userRoleInProject === 'admin' || isProjectOwner
  const canManageMembers = isProjectAdmin || userRoleInProject === 'owner'

  // Refresh project data (role, members, etc.)
  const refreshProjectData = useCallback(async () => {
    if (!currentProject || !user) {
      setUserRoleInProject(null)
      setProjectMembers([])
      return
    }

    setLoading(true)
    try {
      // Get user's role in the current project
      const { data: role, error: roleError } = await teamService.getUserRoleInProject(
        currentProject.id, 
        user.id
      )
      
      if (roleError) {
        console.error('Error fetching user role:', roleError)
        setUserRoleInProject(null)
      } else {
        setUserRoleInProject(role)
      }

      // Get project members
      const { data: members, error: membersError } = await teamService.getProjectMembers(
        currentProject.id
      )
      
      if (membersError) {
        console.error('Error fetching project members:', membersError)
        setProjectMembers([])
      } else {
        setProjectMembers(members || [])
      }
    } catch (error) {
      console.error('Error refreshing project data:', error)
      setUserRoleInProject(null)
      setProjectMembers([])
    } finally {
      setLoading(false)
    }
  }, [currentProject, user])

  // Set current project and refresh data
  const setCurrentProject = useCallback((project: Project | null) => {
    setCurrentProjectState(project)
    if (!project) {
      setUserRoleInProject(null)
      setProjectMembers([])
    }
  }, [])

  // Switch to a different project by ID
  const switchProject = useCallback(async (projectId: string) => {
    if (!user) return

    setLoading(true)
    try {
      // For now, we'll need to get the project from the user's projects
      // This could be enhanced with a getProjectById method in teamService
      const { data: userProjects, error } = await teamService.getUserProjects(user.id)
      
      if (error) {
        console.error('Error fetching user projects:', error)
        return
      }

      const project = userProjects?.find(p => p.id === projectId)
      if (project) {
        setCurrentProject(project)
      }
    } catch (error) {
      console.error('Error switching project:', error)
    } finally {
      setLoading(false)
    }
  }, [user, setCurrentProject])

  // Refresh project data when project or user changes
  useEffect(() => {
    refreshProjectData()
  }, [refreshProjectData])

  // Permission checking methods
  const hasProjectRole = useCallback((role: MemberRole): boolean => {
    if (!userRoleInProject) return false
    
    // Define role hierarchy: owner > admin > member
    const roleHierarchy: Record<MemberRole, number> = {
      owner: 3,
      admin: 2,
      member: 1
    }
    
    const userLevel = roleHierarchy[userRoleInProject]
    const requiredLevel = roleHierarchy[role]
    
    return userLevel >= requiredLevel
  }, [userRoleInProject])

  const hasProjectPermission = useCallback((permission: ProjectPermission): boolean => {
    if (!userRoleInProject || !currentProject) return false

    // Define permissions for each role
    const rolePermissions: Record<MemberRole, ProjectPermission[]> = {
      owner: [
        'view_project', 'edit_project', 'delete_project',
        'manage_members', 'assign_tasks', 'create_tasks', 'edit_tasks', 'delete_tasks'
      ],
      admin: [
        'view_project', 'edit_project',
        'manage_members', 'assign_tasks', 'create_tasks', 'edit_tasks', 'delete_tasks'
      ],
      member: [
        'view_project', 'create_tasks', 'edit_tasks'
      ]
    }

    return rolePermissions[userRoleInProject]?.includes(permission) ?? false
  }, [userRoleInProject, currentProject])

  const canPerformAction = useCallback((action: ProjectAction): boolean => {
    if (!userRoleInProject || !currentProject) return false

    // Map actions to permission checks
    const actionPermissions: Record<ProjectAction, ProjectPermission[]> = {
      invite_members: ['manage_members'],
      remove_members: ['manage_members'],
      change_member_roles: ['manage_members'],
      delete_project: ['delete_project'],
      edit_project_settings: ['edit_project']
    }

    const requiredPermissions = actionPermissions[action]
    return requiredPermissions?.some(permission => hasProjectPermission(permission)) ?? false
  }, [hasProjectPermission, userRoleInProject, currentProject])

  const value: ProjectContextType = {
    currentProject,
    userRoleInProject,
    projectMembers,
    isProjectOwner,
    isProjectAdmin,
    canManageMembers,
    loading,
    setCurrentProject,
    refreshProjectData,
    switchProject,
    hasProjectRole,
    hasProjectPermission,
    canPerformAction
  }

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
} 