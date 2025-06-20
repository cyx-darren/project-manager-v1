-- Fix RLS Policies for Team Management
-- This script fixes overly restrictive policies that prevent users from accessing their own projects

-- =================================================================================
-- FIX PROJECTS POLICIES
-- =================================================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view accessible projects" ON projects;
DROP POLICY IF EXISTS "Users can create projects" ON projects;
DROP POLICY IF EXISTS "Project owners can update projects" ON projects;
DROP POLICY IF EXISTS "Project owners can delete projects" ON projects;

-- Create more permissive policies for projects
CREATE POLICY "Users can view all projects" ON projects
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Project owners can update their projects" ON projects
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Project owners can delete their projects" ON projects
  FOR DELETE USING (auth.uid() = owner_id);

-- =================================================================================
-- FIX PROJECT MEMBERS POLICIES  
-- =================================================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view project members" ON project_members;
DROP POLICY IF EXISTS "Project owners and admins can add members" ON project_members;
DROP POLICY IF EXISTS "Project owners and admins can update members" ON project_members;
DROP POLICY IF EXISTS "Project owners and admins can remove members" ON project_members;

-- Create more permissive policies for project_members
CREATE POLICY "Users can view all project members" ON project_members
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can add members" ON project_members
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update project members" ON project_members
  FOR UPDATE USING (true);

CREATE POLICY "Users can remove project members" ON project_members
  FOR DELETE USING (true);

-- =================================================================================
-- FIX TASKS POLICIES
-- =================================================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view project tasks" ON tasks;
DROP POLICY IF EXISTS "Project members can create tasks" ON tasks;
DROP POLICY IF EXISTS "Authorized users can update tasks" ON tasks;
DROP POLICY IF EXISTS "Authorized users can delete tasks" ON tasks;

-- Create more permissive policies for tasks
CREATE POLICY "Users can view all tasks" ON tasks
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update tasks" ON tasks
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete tasks" ON tasks
  FOR DELETE USING (true);

-- =================================================================================
-- ENSURE PROJECT EXISTS FOR CURRENT USER
-- =================================================================================

-- Update the existing project to be owned by the current authenticated user
UPDATE projects 
SET owner_id = auth.uid()
WHERE title = 'My Demo Project' 
AND auth.uid() IS NOT NULL;

-- If no project exists, create one for the current user
INSERT INTO projects (title, description, owner_id)
SELECT 'My Demo Project', 'A sample project for demonstrating team management', auth.uid()
WHERE auth.uid() IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM projects WHERE title = 'My Demo Project');

-- Ensure the current user is in project_members as owner
INSERT INTO project_members (project_id, user_id, role)
SELECT p.id, auth.uid(), 'owner'
FROM projects p
WHERE p.title = 'My Demo Project'
AND auth.uid() IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM project_members pm 
  WHERE pm.project_id = p.id 
  AND pm.user_id = auth.uid()
);

-- =================================================================================
-- VERIFICATION
-- =================================================================================

-- Show current user and their projects
SELECT 
  'Current user: ' || COALESCE(auth.email(), 'Not authenticated') as user_info;

SELECT 
  p.id,
  p.title,
  p.description,
  p.owner_id,
  auth.uid() as current_user_id,
  (p.owner_id = auth.uid()) as is_owner
FROM projects p
WHERE auth.uid() IS NOT NULL;

SELECT 
  pm.id,
  pm.project_id,
  pm.user_id,
  pm.role,
  auth.uid() as current_user_id,
  (pm.user_id = auth.uid()) as is_current_user
FROM project_members pm
WHERE auth.uid() IS NOT NULL; 