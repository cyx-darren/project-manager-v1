-- Supabase Database Schema Setup Script
-- This script sets up the complete database schema for the Asana-like project management app
-- Execute this in the Supabase SQL Editor (Dashboard > SQL Editor)

-- =================================================================================
-- STEP 1: CREATE ENUM TYPES
-- =================================================================================

-- Create enum for task status
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'done');

-- Create enum for member roles
CREATE TYPE member_role AS ENUM ('owner', 'admin', 'member');

-- =================================================================================
-- STEP 2: CREATE TABLES
-- =================================================================================

-- 2.1 Projects Table
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2.2 Project Members Table
CREATE TABLE project_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role member_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(project_id, user_id)
);

-- 2.3 Tasks Table
CREATE TABLE tasks (
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
-- STEP 3: CREATE INDEXES FOR PERFORMANCE
-- =================================================================================

-- Projects indexes
CREATE INDEX idx_projects_owner_id ON projects(owner_id);
CREATE INDEX idx_projects_created_at ON projects(created_at);

-- Project Members indexes
CREATE INDEX idx_project_members_project_id ON project_members(project_id);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);
CREATE INDEX idx_project_members_project_user ON project_members(project_id, user_id);

-- Tasks indexes
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);

-- =================================================================================
-- STEP 4: ENABLE ROW LEVEL SECURITY (RLS)
-- =================================================================================

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- =================================================================================
-- STEP 5: CREATE RLS POLICIES
-- =================================================================================

-- 5.1 Projects Policies
-- Users can view projects they own or are members of
CREATE POLICY "Users can view accessible projects" ON projects
  FOR SELECT USING (
    auth.uid() = owner_id OR 
    EXISTS (
      SELECT 1 FROM project_members 
      WHERE project_members.project_id = projects.id 
      AND project_members.user_id = auth.uid()
    )
  );

-- Users can create projects (they become the owner)
CREATE POLICY "Users can create projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Project owners can update their projects
CREATE POLICY "Project owners can update projects" ON projects
  FOR UPDATE USING (auth.uid() = owner_id);

-- Project owners can delete their projects
CREATE POLICY "Project owners can delete projects" ON projects
  FOR DELETE USING (auth.uid() = owner_id);

-- 5.2 Project Members Policies
-- Users can view members of projects they have access to
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

-- Project owners and admins can add members
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

-- Project owners and admins can update member roles
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

-- Project owners and admins can remove members
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
-- Users can view tasks in projects they have access to
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

-- Project members can create tasks
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

-- Task creators, assignees, and project owners/admins can update tasks
CREATE POLICY "Authorized users can update tasks" ON tasks
  FOR UPDATE USING (
    auth.uid() = created_by OR 
    auth.uid() = assignee_id OR
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = tasks.project_id 
      AND owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM project_members 
      WHERE project_id = tasks.project_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- Task creators and project owners/admins can delete tasks
CREATE POLICY "Authorized users can delete tasks" ON tasks
  FOR DELETE USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = tasks.project_id 
      AND owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM project_members 
      WHERE project_id = tasks.project_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- =================================================================================
-- STEP 6: CREATE TRIGGER FUNCTIONS FOR AUTOMATIC UPDATES
-- =================================================================================

-- Function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic updated_at updates
CREATE TRIGGER update_projects_updated_at 
  BEFORE UPDATE ON projects 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at 
  BEFORE UPDATE ON tasks 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =================================================================================
-- STEP 7: INSERT SAMPLE DATA (OPTIONAL - FOR TESTING)
-- =================================================================================

-- Note: This requires actual user authentication, so it's commented out
-- You can run this after creating a user account through Supabase Auth

/*
-- Insert a sample project (replace 'your-user-id' with actual user ID)
INSERT INTO projects (title, description, owner_id) VALUES 
('Sample Project', 'A sample project for testing the database schema', 'your-user-id');

-- Insert sample tasks (replace 'project-id' and 'user-id' with actual IDs)
INSERT INTO tasks (project_id, title, description, status, created_by) VALUES 
('project-id', 'Setup database', 'Create the database schema', 'done', 'user-id'),
('project-id', 'Build frontend', 'Develop the React frontend', 'in_progress', 'user-id'),
('project-id', 'Deploy application', 'Deploy to production', 'todo', 'user-id');
*/

-- =================================================================================
-- VERIFICATION QUERIES
-- =================================================================================

-- Check that tables were created successfully
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('projects', 'project_members', 'tasks');

-- Check that enum types were created
SELECT typname 
FROM pg_type 
WHERE typname IN ('task_status', 'member_role');

-- Check indexes
SELECT indexname 
FROM pg_indexes 
WHERE tablename IN ('projects', 'project_members', 'tasks') 
AND schemaname = 'public';

-- Schema setup complete! 