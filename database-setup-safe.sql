-- Supabase Database Schema Setup Script (Safe Version)
-- This script safely sets up the database schema, handling existing types and tables
-- Execute this in the Supabase SQL Editor (Dashboard > SQL Editor)

-- =================================================================================
-- STEP 1: CREATE ENUM TYPES (SAFE)
-- =================================================================================

-- Create enum for task status (only if it doesn't exist)
DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'done');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for member roles (only if it doesn't exist)
DO $$ BEGIN
    CREATE TYPE member_role AS ENUM ('owner', 'admin', 'member');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =================================================================================
-- STEP 2: CREATE TABLES (SAFE)
-- =================================================================================

-- 2.1 Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2.2 Project Members Table
CREATE TABLE IF NOT EXISTS project_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role member_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(project_id, user_id)
);

-- 2.3 Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'todo',
  due_date DATE,
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- =================================================================================
-- STEP 3: CREATE INDEXES FOR PERFORMANCE (SAFE)
-- =================================================================================

-- Projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);

-- Project Members indexes
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project_user ON project_members(project_id, user_id);

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);

-- =================================================================================
-- STEP 4: ENABLE ROW LEVEL SECURITY (RLS)
-- =================================================================================

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- =================================================================================
-- STEP 5: CREATE RLS POLICIES (SAFE)
-- =================================================================================

-- Drop existing policies if they exist, then recreate them
-- This ensures we have the correct policies even if some were created before

-- 5.1 Projects Policies
DROP POLICY IF EXISTS "Users can view accessible projects" ON projects;
CREATE POLICY "Users can view accessible projects" ON projects
  FOR SELECT USING (
    auth.uid() = owner_id OR 
    EXISTS (
      SELECT 1 FROM project_members 
      WHERE project_members.project_id = projects.id 
      AND project_members.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create projects" ON projects;
CREATE POLICY "Users can create projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Project owners can update projects" ON projects;
CREATE POLICY "Project owners can update projects" ON projects
  FOR UPDATE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Project owners can delete projects" ON projects;
CREATE POLICY "Project owners can delete projects" ON projects
  FOR DELETE USING (auth.uid() = owner_id);

-- 5.2 Project Members Policies
DROP POLICY IF EXISTS "Users can view project members" ON project_members;
CREATE POLICY "Users can view project members" ON project_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = project_members.project_id 
      AND (owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM project_members pm2 
        WHERE pm2.project_id = projects.id 
        AND pm2.user_id = auth.uid()
      ))
    )
  );

DROP POLICY IF EXISTS "Project owners and admins can add members" ON project_members;
CREATE POLICY "Project owners and admins can add members" ON project_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members 
      WHERE project_id = project_members.project_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    ) OR
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = project_members.project_id 
      AND owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Project owners and admins can update members" ON project_members;
CREATE POLICY "Project owners and admins can update members" ON project_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM project_members 
      WHERE project_id = project_members.project_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    ) OR
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = project_members.project_id 
      AND owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Project owners and admins can remove members" ON project_members;
CREATE POLICY "Project owners and admins can remove members" ON project_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM project_members 
      WHERE project_id = project_members.project_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    ) OR
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = project_members.project_id 
      AND owner_id = auth.uid()
    )
  );

-- 5.3 Tasks Policies
DROP POLICY IF EXISTS "Users can view project tasks" ON tasks;
CREATE POLICY "Users can view project tasks" ON tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = tasks.project_id 
      AND (owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM project_members 
        WHERE project_id = projects.id 
        AND user_id = auth.uid()
      ))
    )
  );

DROP POLICY IF EXISTS "Project members can create tasks" ON tasks;
CREATE POLICY "Project members can create tasks" ON tasks
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = tasks.project_id 
      AND (owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM project_members 
        WHERE project_id = projects.id 
        AND user_id = auth.uid()
      ))
    )
  );

DROP POLICY IF EXISTS "Authorized users can update tasks" ON tasks;
CREATE POLICY "Authorized users can update tasks" ON tasks
  FOR UPDATE USING (
    auth.uid() = created_by OR 
    auth.uid() = assignee_id OR
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = tasks.project_id 
      AND (owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM project_members 
        WHERE project_id = projects.id 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'admin')
      ))
    )
  );

DROP POLICY IF EXISTS "Authorized users can delete tasks" ON tasks;
CREATE POLICY "Authorized users can delete tasks" ON tasks
  FOR DELETE USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = tasks.project_id 
      AND (owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM project_members 
        WHERE project_id = projects.id 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'admin')
      ))
    )
  );

-- =================================================================================
-- STEP 6: CREATE DEMO DATA (OPTIONAL)
-- =================================================================================

-- Insert a demo project for testing (only if no projects exist)
INSERT INTO projects (title, description, owner_id)
SELECT 'Demo Project', 'A sample project for demonstrating team management', auth.uid()
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE title = 'Demo Project')
AND auth.uid() IS NOT NULL;

-- =================================================================================
-- STEP 7: VERIFICATION QUERIES
-- =================================================================================

-- Check if everything was created successfully
SELECT 'Tables created successfully' as status;

-- Show table counts
SELECT 
  'projects' as table_name, 
  COUNT(*) as row_count 
FROM projects
UNION ALL
SELECT 
  'project_members' as table_name, 
  COUNT(*) as row_count 
FROM project_members
UNION ALL
SELECT 
  'tasks' as table_name, 
  COUNT(*) as row_count 
FROM tasks;

-- Show current user info
SELECT 
  'Current user: ' || COALESCE(auth.email(), 'Not authenticated') as user_info; 