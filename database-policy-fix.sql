-- Fix for Infinite Recursion in RLS Policies
-- Run this in Supabase Dashboard SQL Editor to fix the policy issues

-- 1. Drop ALL existing policies (using the actual policy names from the database)
-- Projects policies
DROP POLICY IF EXISTS "Users can view accessible projects" ON projects;
DROP POLICY IF EXISTS "Users can create projects" ON projects;
DROP POLICY IF EXISTS "Project owners can update projects" ON projects;
DROP POLICY IF EXISTS "Project owners can delete projects" ON projects;

-- Project Members policies
DROP POLICY IF EXISTS "Users can view project members" ON project_members;
DROP POLICY IF EXISTS "Project owners and admins can add members" ON project_members;
DROP POLICY IF EXISTS "Project owners and admins can update members" ON project_members;
DROP POLICY IF EXISTS "Project owners and admins can remove members" ON project_members;

-- Tasks policies
DROP POLICY IF EXISTS "Users can view project tasks" ON tasks;
DROP POLICY IF EXISTS "Project members can create tasks" ON tasks;
DROP POLICY IF EXISTS "Authorized users can update tasks" ON tasks;
DROP POLICY IF EXISTS "Authorized users can delete tasks" ON tasks;

-- 2. Create simplified policies without circular references

-- Projects: Users can only see projects they own (simple, no recursion)
CREATE POLICY "Users can view projects they own" ON projects
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can create projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own projects" ON projects
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own projects" ON projects
  FOR DELETE USING (auth.uid() = owner_id);

-- Project Members: Users can see memberships where they are the user
CREATE POLICY "Users can view their own memberships" ON project_members
  FOR SELECT USING (auth.uid() = user_id);

-- Project owners can see all members of their projects
CREATE POLICY "Project owners can view all members" ON project_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_members.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can join projects" ON project_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Tasks: Users can see tasks in projects they own
CREATE POLICY "Users can view tasks in owned projects" ON tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = tasks.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

-- Users can see tasks assigned to them
CREATE POLICY "Users can view assigned tasks" ON tasks
  FOR SELECT USING (auth.uid() = assignee_id);

CREATE POLICY "Users can create tasks in owned projects" ON tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = tasks.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tasks in owned projects" ON tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = tasks.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tasks in owned projects" ON tasks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = tasks.project_id 
      AND projects.owner_id = auth.uid()
    )
  );

-- 3. Verify policies are working
SELECT 'Projects policies:' as info;
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'projects';

SELECT 'Project members policies:' as info;
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'project_members';

SELECT 'Tasks policies:' as info;
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'tasks'; 