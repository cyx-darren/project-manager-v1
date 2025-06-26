-- Enable Row Level Security Migration
-- This migration enables RLS on all core tables and creates comprehensive security policies

-- =============================================
-- 1. ENABLE RLS ON CORE TABLES
-- =============================================

-- Enable RLS on tables that don't have it yet
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_permissions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 2. DROP OVERLY PERMISSIVE EXISTING POLICIES
-- =============================================

-- Remove overly permissive policies that allow viewing all data
DROP POLICY IF EXISTS "Users can view all projects" ON projects;
DROP POLICY IF EXISTS "Users can view all tasks" ON tasks;
DROP POLICY IF EXISTS "Users can view all project members" ON project_members;
DROP POLICY IF EXISTS "Users can update project members" ON project_members;
DROP POLICY IF EXISTS "Users can remove project members" ON project_members;
DROP POLICY IF EXISTS "Users can update tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete tasks" ON tasks;

-- =============================================
-- 3. WORKSPACE POLICIES
-- =============================================

-- Workspace SELECT policies
CREATE POLICY "Users can view workspaces they are members of"
ON workspaces FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workspace_members wm 
    WHERE wm.workspace_id = workspaces.id 
    AND wm.user_id = auth.uid()
  )
);

-- Workspace UPDATE policies
CREATE POLICY "Workspace owners and admins can update workspaces"
ON workspaces FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM workspace_members wm 
    WHERE wm.workspace_id = workspaces.id 
    AND wm.user_id = auth.uid() 
    AND wm.role IN ('owner', 'admin')
  )
);

-- Workspace DELETE policies
CREATE POLICY "Only workspace owners can delete workspaces"
ON workspaces FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM workspace_members wm 
    WHERE wm.workspace_id = workspaces.id 
    AND wm.user_id = auth.uid() 
    AND wm.role = 'owner'
  )
);

-- Workspace INSERT policies
CREATE POLICY "Authenticated users can create workspaces"
ON workspaces FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

-- =============================================
-- 4. WORKSPACE MEMBERS POLICIES
-- =============================================

-- Workspace members SELECT policies
CREATE POLICY "Users can view workspace members of their workspaces"
ON workspace_members FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM workspace_members wm 
    WHERE wm.workspace_id = workspace_members.workspace_id 
    AND wm.user_id = auth.uid()
  )
);

-- Workspace members INSERT policies
CREATE POLICY "Workspace owners and admins can add members"
ON workspace_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workspace_members wm 
    WHERE wm.workspace_id = workspace_members.workspace_id 
    AND wm.user_id = auth.uid() 
    AND wm.role IN ('owner', 'admin')
  )
);

-- Workspace members UPDATE policies
CREATE POLICY "Workspace owners and admins can update member roles"
ON workspace_members FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM workspace_members wm 
    WHERE wm.workspace_id = workspace_members.workspace_id 
    AND wm.user_id = auth.uid() 
    AND wm.role IN ('owner', 'admin')
  )
);

-- Workspace members DELETE policies
CREATE POLICY "Workspace owners and admins can remove members"
ON workspace_members FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM workspace_members wm 
    WHERE wm.workspace_id = workspace_members.workspace_id 
    AND wm.user_id = auth.uid() 
    AND wm.role IN ('owner', 'admin')
  )
  OR user_id = auth.uid() -- Users can remove themselves
);

-- =============================================
-- 5. IMPROVED PROJECT POLICIES
-- =============================================

-- Project SELECT policies (replace the overly permissive one)
CREATE POLICY "Users can view projects they have access to"
ON projects FOR SELECT
USING (
  -- Project owner can see their projects
  owner_id = auth.uid()
  OR
  -- Project members can see projects they belong to
  EXISTS (
    SELECT 1 FROM project_members pm 
    WHERE pm.project_id = projects.id 
    AND pm.user_id = auth.uid()
  )
  OR
  -- Workspace members can see projects in their workspaces
  EXISTS (
    SELECT 1 FROM workspace_members wm 
    WHERE wm.workspace_id = projects.workspace_id 
    AND wm.user_id = auth.uid()
  )
);

-- =============================================
-- 6. IMPROVED PROJECT MEMBERS POLICIES
-- =============================================

-- Project members SELECT policies (replace overly permissive one)
CREATE POLICY "Users can view project members of accessible projects"
ON project_members FOR SELECT
USING (
  -- Project owner can see all members
  EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = project_members.project_id 
    AND p.owner_id = auth.uid()
  )
  OR
  -- Project members can see other members
  EXISTS (
    SELECT 1 FROM project_members pm 
    WHERE pm.project_id = project_members.project_id 
    AND pm.user_id = auth.uid()
  )
  OR
  -- User can see their own membership
  user_id = auth.uid()
);

-- Project members UPDATE policies (replace overly permissive one)
CREATE POLICY "Project owners and admins can update member roles"
ON project_members FOR UPDATE
USING (
  -- Project owner can update any member
  EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = project_members.project_id 
    AND p.owner_id = auth.uid()
  )
  OR
  -- Project admins can update members (but not owners)
  (
    EXISTS (
      SELECT 1 FROM project_members pm 
      WHERE pm.project_id = project_members.project_id 
      AND pm.user_id = auth.uid() 
      AND pm.role = 'admin'
    )
    AND project_members.role != 'owner'
  )
);

-- Project members DELETE policies (replace overly permissive one)
CREATE POLICY "Project owners and admins can remove members"
ON project_members FOR DELETE
USING (
  -- Project owner can remove any member
  EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = project_members.project_id 
    AND p.owner_id = auth.uid()
  )
  OR
  -- Project admins can remove members (but not owners)
  (
    EXISTS (
      SELECT 1 FROM project_members pm 
      WHERE pm.project_id = project_members.project_id 
      AND pm.user_id = auth.uid() 
      AND pm.role = 'admin'
    )
    AND project_members.role != 'owner'
  )
  OR
  -- Users can remove themselves
  user_id = auth.uid()
);

-- =============================================
-- 7. IMPROVED TASK POLICIES
-- =============================================

-- Task SELECT policies (already has good ones, but let's ensure consistency)
CREATE POLICY "Users can view tasks in accessible projects"
ON tasks FOR SELECT
USING (
  -- Project owner can see all tasks
  EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = tasks.project_id 
    AND p.owner_id = auth.uid()
  )
  OR
  -- Project members can see tasks
  EXISTS (
    SELECT 1 FROM project_members pm 
    WHERE pm.project_id = tasks.project_id 
    AND pm.user_id = auth.uid()
  )
  OR
  -- Task assignee can see their tasks
  assignee_id = auth.uid()
  OR
  -- Task creator can see their tasks
  created_by = auth.uid()
);

-- Task UPDATE policies (replace overly permissive one)
CREATE POLICY "Project members can update tasks with proper permissions"
ON tasks FOR UPDATE
USING (
  -- Project owner can update any task
  EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = tasks.project_id 
    AND p.owner_id = auth.uid()
  )
  OR
  -- Project admins can update tasks
  EXISTS (
    SELECT 1 FROM project_members pm 
    WHERE pm.project_id = tasks.project_id 
    AND pm.user_id = auth.uid() 
    AND pm.role IN ('admin', 'owner')
  )
  OR
  -- Task assignee can update their tasks
  assignee_id = auth.uid()
  OR
  -- Task creator can update their tasks
  created_by = auth.uid()
  OR
  -- Project members can update tasks if they have permission
  (
    EXISTS (
      SELECT 1 FROM project_members pm 
      WHERE pm.project_id = tasks.project_id 
      AND pm.user_id = auth.uid()
    )
    AND
    -- Check if user has task.edit permission via custom permissions or role
    (
      -- Check custom permissions
      EXISTS (
        SELECT 1 FROM custom_permissions cp
        JOIN permissions p ON cp.permission_id = p.id
        WHERE cp.user_id = auth.uid()
        AND cp.context_type = 'project'
        AND cp.context_id = tasks.project_id
        AND p.action = 'task.edit'
        AND cp.granted = true
      )
      OR
      -- Check role permissions
      EXISTS (
        SELECT 1 FROM project_members pm
        JOIN role_permissions rp ON rp.role_name = pm.role::text
        JOIN permissions p ON rp.permission_id = p.id
        WHERE pm.project_id = tasks.project_id
        AND pm.user_id = auth.uid()
        AND rp.context_type = 'project'
        AND p.action = 'task.edit'
      )
    )
  )
);

-- Task DELETE policies (replace overly permissive one)
CREATE POLICY "Project owners and admins can delete tasks"
ON tasks FOR DELETE
USING (
  -- Project owner can delete any task
  EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = tasks.project_id 
    AND p.owner_id = auth.uid()
  )
  OR
  -- Project admins can delete tasks
  EXISTS (
    SELECT 1 FROM project_members pm 
    WHERE pm.project_id = tasks.project_id 
    AND pm.user_id = auth.uid() 
    AND pm.role IN ('admin', 'owner')
  )
  OR
  -- Task creator can delete their tasks
  created_by = auth.uid()
  OR
  -- Check if user has task.delete permission
  (
    EXISTS (
      SELECT 1 FROM project_members pm 
      WHERE pm.project_id = tasks.project_id 
      AND pm.user_id = auth.uid()
    )
    AND
    (
      -- Check custom permissions
      EXISTS (
        SELECT 1 FROM custom_permissions cp
        JOIN permissions p ON cp.permission_id = p.id
        WHERE cp.user_id = auth.uid()
        AND cp.context_type = 'project'
        AND cp.context_id = tasks.project_id
        AND p.action = 'task.delete'
        AND cp.granted = true
      )
      OR
      -- Check role permissions
      EXISTS (
        SELECT 1 FROM project_members pm
        JOIN role_permissions rp ON rp.role_name = pm.role::text
        JOIN permissions p ON rp.permission_id = p.id
        WHERE pm.project_id = tasks.project_id
        AND pm.user_id = auth.uid()
        AND rp.context_type = 'project'
        AND p.action = 'task.delete'
      )
    )
  )
);

-- =============================================
-- 8. PERMISSION SYSTEM POLICIES
-- =============================================

-- Permissions table policies (read-only for most users)
CREATE POLICY "All authenticated users can view permissions"
ON permissions FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Role permissions policies
CREATE POLICY "All authenticated users can view role permissions"
ON role_permissions FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Custom permissions policies
CREATE POLICY "Users can view custom permissions relevant to them"
ON custom_permissions FOR SELECT
USING (
  -- Users can see their own custom permissions
  user_id = auth.uid()
  OR
  -- Project/workspace admins can see custom permissions in their context
  (
    context_type = 'project' AND
    EXISTS (
      SELECT 1 FROM project_members pm 
      WHERE pm.project_id = custom_permissions.context_id::uuid
      AND pm.user_id = auth.uid() 
      AND pm.role IN ('admin', 'owner')
    )
  )
  OR
  (
    context_type = 'workspace' AND
    EXISTS (
      SELECT 1 FROM workspace_members wm 
      WHERE wm.workspace_id = custom_permissions.context_id::uuid
      AND wm.user_id = auth.uid() 
      AND wm.role IN ('admin', 'owner')
    )
  )
);

-- Custom permissions INSERT policies
CREATE POLICY "Admins can grant custom permissions"
ON custom_permissions FOR INSERT
WITH CHECK (
  -- Project/workspace admins can grant custom permissions in their context
  (
    context_type = 'project' AND
    EXISTS (
      SELECT 1 FROM project_members pm 
      WHERE pm.project_id = custom_permissions.context_id::uuid
      AND pm.user_id = auth.uid() 
      AND pm.role IN ('admin', 'owner')
    )
  )
  OR
  (
    context_type = 'workspace' AND
    EXISTS (
      SELECT 1 FROM workspace_members wm 
      WHERE wm.workspace_id = custom_permissions.context_id::uuid
      AND wm.user_id = auth.uid() 
      AND wm.role IN ('admin', 'owner')
    )
  )
);

-- Custom permissions UPDATE policies
CREATE POLICY "Admins can update custom permissions"
ON custom_permissions FOR UPDATE
USING (
  -- Project/workspace admins can update custom permissions in their context
  (
    context_type = 'project' AND
    EXISTS (
      SELECT 1 FROM project_members pm 
      WHERE pm.project_id = custom_permissions.context_id::uuid
      AND pm.user_id = auth.uid() 
      AND pm.role IN ('admin', 'owner')
    )
  )
  OR
  (
    context_type = 'workspace' AND
    EXISTS (
      SELECT 1 FROM workspace_members wm 
      WHERE wm.workspace_id = custom_permissions.context_id::uuid
      AND wm.user_id = auth.uid() 
      AND wm.role IN ('admin', 'owner')
    )
  )
);

-- Custom permissions DELETE policies
CREATE POLICY "Admins can revoke custom permissions"
ON custom_permissions FOR DELETE
USING (
  -- Project/workspace admins can revoke custom permissions in their context
  (
    context_type = 'project' AND
    EXISTS (
      SELECT 1 FROM project_members pm 
      WHERE pm.project_id = custom_permissions.context_id::uuid
      AND pm.user_id = auth.uid() 
      AND pm.role IN ('admin', 'owner')
    )
  )
  OR
  (
    context_type = 'workspace' AND
    EXISTS (
      SELECT 1 FROM workspace_members wm 
      WHERE wm.workspace_id = custom_permissions.context_id::uuid
      AND wm.user_id = auth.uid() 
      AND wm.role IN ('admin', 'owner')
    )
  )
);

-- =============================================
-- 9. HELPER FUNCTIONS FOR PERMISSION CHECKING
-- =============================================

-- Create a function to check if a user has a specific permission in a context
CREATE OR REPLACE FUNCTION check_user_permission(
  user_id_param uuid,
  permission_action text,
  context_type_param text DEFAULT NULL,
  context_id_param uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check custom permissions first
  IF EXISTS (
    SELECT 1 FROM custom_permissions cp
    JOIN permissions p ON cp.permission_id = p.id
    WHERE cp.user_id = user_id_param
    AND p.action = permission_action
    AND (context_type_param IS NULL OR cp.context_type = context_type_param)
    AND (context_id_param IS NULL OR cp.context_id = context_id_param)
    AND cp.granted = true
  ) THEN
    RETURN true;
  END IF;

  -- Check role-based permissions for project context
  IF context_type_param = 'project' AND context_id_param IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM project_members pm
      JOIN role_permissions rp ON rp.role_name = pm.role::text
      JOIN permissions p ON rp.permission_id = p.id
      WHERE pm.project_id = context_id_param
      AND pm.user_id = user_id_param
      AND rp.context_type = 'project'
      AND p.action = permission_action
    ) THEN
      RETURN true;
    END IF;
  END IF;

  -- Check role-based permissions for workspace context
  IF context_type_param = 'workspace' AND context_id_param IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM workspace_members wm
      JOIN role_permissions rp ON rp.role_name = wm.role::text
      JOIN permissions p ON rp.permission_id = p.id
      WHERE wm.workspace_id = context_id_param
      AND wm.user_id = user_id_param
      AND rp.context_type = 'workspace'
      AND p.action = permission_action
    ) THEN
      RETURN true;
    END IF;
  END IF;

  RETURN false;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_user_permission(uuid, text, text, uuid) TO authenticated;

-- =============================================
-- 10. COMMENTS AND DOCUMENTATION
-- =============================================

COMMENT ON POLICY "Users can view workspaces they are members of" ON workspaces IS 
'Users can only see workspaces where they are members. This ensures workspace privacy.';

COMMENT ON POLICY "Users can view projects they have access to" ON projects IS 
'Users can see projects they own, are members of, or are in the same workspace.';

COMMENT ON POLICY "Project members can update tasks with proper permissions" ON tasks IS 
'Task updates require proper permissions through role-based or custom permissions.';

COMMENT ON FUNCTION check_user_permission(uuid, text, text, uuid) IS 
'Helper function to check if a user has a specific permission in a given context. Checks both custom permissions and role-based permissions.'; 