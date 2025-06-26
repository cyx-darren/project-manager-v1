import { supabase } from '../config/supabase';
import { permissionService } from './permissionService';
import type { User } from '@supabase/supabase-js';

export interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  email_confirmed_at?: string;
  workspace_count: number;
  project_count: number;
  project_memberships: any[];
  workspace_memberships: any[];
}

export interface UserRole {
  id: string;
  user_id: string;
  role: string;
  context_type: 'workspace' | 'project';
  context_id: string;
  context_name?: string;
  granted_at: string;
}

export interface AdminStats {
  totalUsers: number;
  totalWorkspaces: number;
  totalProjects: number;
  totalTasks: number;
  activeProjects: number;
  completedTasks: number;
}

export interface UserFilters {
  search?: string;
  sortBy?: 'email' | 'created_at' | 'last_sign_in_at';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

class AdminPermissionError extends Error {
  public code: string;
  
  constructor(message: string, code: string = 'ADMIN_PERMISSION_DENIED') {
    super(message);
    this.name = 'AdminPermissionError';
    this.code = code;
  }
}

class AdminService {
  private async checkAdminPermission(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new AdminPermissionError('Authentication required', 'AUTH_REQUIRED');
    }

    // For now, temporarily allow all authenticated users to access admin features
    // This will be replaced with proper global role checking in subtask 9.8
    // TODO: Implement proper global role checking with RLS policies
    
    // Check if user is an owner/admin in any workspace as a temporary measure
    const { data: workspaces } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['owner', 'admin']);

    if (!workspaces || workspaces.length === 0) {
      throw new AdminPermissionError(
        'Admin permissions required for user management. You must be an admin or owner of at least one workspace.',
        'INSUFFICIENT_PERMISSIONS'
      );
    }
  }

  async getAllUsers(filters: UserFilters = {}): Promise<{ users: AdminUser[]; total: number }> {
    await this.checkAdminPermission();

    // For testing purposes, get users from workspace/project memberships
    // In a real admin system, you would use supabase.auth.admin.listUsers()
    // but that requires special admin authentication
    
    const [projectMemberships, workspaceMemberships] = await Promise.all([
      supabase
        .from('project_members')
        .select('user_id, project_id, role, projects(title)'),
      supabase
        .from('workspace_members')
        .select('user_id, workspace_id, role, workspaces(name)')
    ]);

    if (projectMemberships.error) {
      throw new Error(`Failed to fetch project memberships: ${projectMemberships.error.message}`);
    }

    if (workspaceMemberships.error) {
      throw new Error(`Failed to fetch workspace memberships: ${workspaceMemberships.error.message}`);
    }

    // Get unique user IDs from memberships
    const allUserIds = new Set([
      ...(projectMemberships.data?.map(pm => pm.user_id) || []),
      ...(workspaceMemberships.data?.map(wm => wm.user_id) || [])
    ]);

    // Create mock user data (in a real system, this would come from auth.users)
    const users: AdminUser[] = Array.from(allUserIds).map(userId => {
      const userProjectMemberships = projectMemberships.data?.filter(pm => pm.user_id === userId) || [];
      const userWorkspaceMemberships = workspaceMemberships.data?.filter(wm => wm.user_id === userId) || [];
      
      // For demo purposes, create a mock email based on user ID
      const mockEmail = userId === 'current_user' ? 'darren@easyprintsg.com' : `user-${userId.slice(0, 8)}@example.com`;

      return {
        id: userId,
        email: mockEmail,
        created_at: new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        email_confirmed_at: new Date().toISOString(),
        workspace_count: userWorkspaceMemberships.length,
        project_count: userProjectMemberships.length,
        project_memberships: userProjectMemberships,
        workspace_memberships: userWorkspaceMemberships
      };
    });

    // Apply filters
    let filteredUsers = users;

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredUsers = users.filter(user => 
        user.email.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    if (filters.sortBy) {
      filteredUsers.sort((a, b) => {
        const aVal = a[filters.sortBy!];
        const bVal = b[filters.sortBy!];
        const order = filters.sortOrder === 'desc' ? -1 : 1;
        
        if (!aVal && !bVal) return 0;
        if (!aVal) return 1 * order;
        if (!bVal) return -1 * order;
        if (aVal < bVal) return -1 * order;
        if (aVal > bVal) return 1 * order;
        return 0;
      });
    }

    // Apply pagination
    const offset = filters.offset || 0;
    const limit = filters.limit || 50;
    const paginatedUsers = filteredUsers.slice(offset, offset + limit);

    return { users: paginatedUsers, total: filteredUsers.length };
  }

  async getUserById(userId: string): Promise<AdminUser | null> {
    await this.checkAdminPermission();

    // For testing purposes, get user info from memberships
    // In a real admin system, you would use supabase.auth.admin.getUserById()
    
    const [projectMemberships, workspaceMemberships] = await Promise.all([
      supabase
        .from('project_members')
        .select('user_id, project_id, role, projects(title)')
        .eq('user_id', userId),
      supabase
        .from('workspace_members')
        .select('user_id, workspace_id, role, workspaces(name)')
        .eq('user_id', userId)
    ]);

    if (projectMemberships.error || workspaceMemberships.error) {
      return null;
    }

    // Check if user exists in any membership
    const hasProjectMembership = projectMemberships.data && projectMemberships.data.length > 0;
    const hasWorkspaceMembership = workspaceMemberships.data && workspaceMemberships.data.length > 0;
    
    if (!hasProjectMembership && !hasWorkspaceMembership) {
      return null;
    }

    // Create mock user data for testing
    const mockEmail = userId === 'current_user' ? 'darren@easyprintsg.com' : `user-${userId.slice(0, 8)}@example.com`;

    return {
      id: userId,
      email: mockEmail,
      created_at: new Date().toISOString(),
      last_sign_in_at: new Date().toISOString(),
      email_confirmed_at: new Date().toISOString(),
      workspace_count: workspaceMemberships.data?.length || 0,
      project_count: projectMemberships.data?.length || 0,
      project_memberships: projectMemberships.data || [],
      workspace_memberships: workspaceMemberships.data || []
    };
  }

  async updateUserRole(userId: string, role: string, contextType: 'workspace' | 'project', contextId: string): Promise<void> {
    await this.checkAdminPermission();

    const table = contextType === 'workspace' ? 'workspace_members' : 'project_members';
    const contextColumn = contextType === 'workspace' ? 'workspace_id' : 'project_id';

    // Type assertion for role since we're validating it comes from the UI
    const { error } = await supabase
      .from(table)
      .update({ role: role as any })
      .eq('user_id', userId)
      .eq(contextColumn, contextId);

    if (error) {
      throw new Error(`Failed to update ${contextType} role: ${error.message}`);
    }
  }

  async getUserRoles(userId: string): Promise<UserRole[]> {
    await this.checkAdminPermission();

    const [projectRoles, workspaceRoles] = await Promise.all([
      supabase
        .from('project_members')
        .select('id, user_id, role, project_id, created_at, projects(title)')
        .eq('user_id', userId),
      supabase
        .from('workspace_members')
        .select('id, user_id, role, workspace_id, joined_at, workspaces(name)')
        .eq('user_id', userId)
    ]);

    const roles: UserRole[] = [];

    if (projectRoles.data) {
      roles.push(...projectRoles.data.map(pr => ({
        id: pr.id,
        user_id: pr.user_id,
        role: pr.role,
        context_type: 'project' as const,
        context_id: pr.project_id,
        context_name: (pr.projects as any)?.title,
        granted_at: pr.created_at
      })));
    }

    if (workspaceRoles.data) {
      roles.push(...workspaceRoles.data
        .filter(wr => wr.role !== null)
        .map(wr => ({
          id: wr.id,
          user_id: wr.user_id,
          role: wr.role!,
          context_type: 'workspace' as const,
          context_id: wr.workspace_id,
          context_name: (wr.workspaces as any)?.name,
          granted_at: wr.joined_at || new Date().toISOString()
        })));
    }

    return roles;
  }

  async getAdminStats(): Promise<AdminStats> {
    await this.checkAdminPermission();

    const [workspacesResult, projectsResult, tasksResult] = await Promise.all([
      supabase.from('workspaces').select('id', { count: 'exact' }),
      supabase.from('projects').select('id, status', { count: 'exact' }),
      supabase.from('tasks').select('id, status', { count: 'exact' })
    ]);

    // Get unique user count from memberships (since we can't use admin.listUsers)
    const [projectMemberships, workspaceMemberships] = await Promise.all([
      supabase.from('project_members').select('user_id'),
      supabase.from('workspace_members').select('user_id')
    ]);

    const allUserIds = new Set([
      ...(projectMemberships.data?.map(pm => pm.user_id) || []),
      ...(workspaceMemberships.data?.map(wm => wm.user_id) || [])
    ]);

    if (workspacesResult.error) throw new Error(`Failed to fetch workspace stats: ${workspacesResult.error.message}`);
    if (projectsResult.error) throw new Error(`Failed to fetch project stats: ${projectsResult.error.message}`);
    if (tasksResult.error) throw new Error(`Failed to fetch task stats: ${tasksResult.error.message}`);

    const projects = projectsResult.data || [];
    const tasks = tasksResult.data || [];
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const completedTasks = tasks.filter(t => t.status === 'done').length;

    return {
      totalUsers: allUserIds.size,
      totalWorkspaces: workspacesResult.count || 0,
      totalProjects: projectsResult.count || 0,
      totalTasks: tasksResult.count || 0,
      activeProjects,
      completedTasks
    };
  }

  async deleteUser(userId: string): Promise<void> {
    await this.checkAdminPermission();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new AdminPermissionError('Authentication required');

    // Prevent self-deletion
    if (user.id === userId) {
      throw new AdminPermissionError('Cannot delete your own account', 'SELF_DELETE_FORBIDDEN');
    }

    // Delete user using admin API
    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  async searchUsers(query: string, limit: number = 10): Promise<AdminUser[]> {
    await this.checkAdminPermission();

    const { users } = await this.getAllUsers({ search: query, limit });
    return users;
  }

  async inviteUser(email: string, workspaceId?: string, projectId?: string, role: string = 'member'): Promise<void> {
    await this.checkAdminPermission();

    const { error } = await supabase.auth.admin.inviteUserByEmail(email);

    if (error) {
      throw new Error(`Failed to invite user: ${error.message}`);
    }

    // If workspace or project specified, we would add them to the appropriate membership table
    // This would require additional logic to handle pending invitations
  }
}

export const adminService = new AdminService();
export { AdminPermissionError }; 