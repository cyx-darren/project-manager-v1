-- =====================================================
-- ASANA CLONE - DATABASE SCHEMA ENHANCEMENT MIGRATION
-- =====================================================
-- This script adds missing tables and enhances existing ones
-- for comprehensive project management functionality

-- Create custom types first
-- =====================================================

-- Priority levels for tasks
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'urgent');

-- Activity actions for logging
CREATE TYPE activity_action AS ENUM (
  'created', 'updated', 'deleted', 'assigned', 'unassigned', 
  'completed', 'reopened', 'commented', 'invited', 'joined',
  'archived', 'restored', 'status_changed', 'due_date_changed'
);

-- Project status
CREATE TYPE project_status AS ENUM ('active', 'archived', 'completed', 'template');

-- Team member roles
CREATE TYPE team_role AS ENUM ('owner', 'admin', 'member');

-- Create new tables
-- =====================================================

-- 1. Subtasks table for task breakdown
CREATE TABLE IF NOT EXISTS subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  order_index INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Task assignments for many-to-many user-task relationships
CREATE TABLE IF NOT EXISTS task_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, user_id)
);

-- 3. Teams for organization structure
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Team members for team membership
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role team_role DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- 5. Project invitations for email-based invites
CREATE TABLE IF NOT EXISTS project_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role member_role DEFAULT 'member',
  token TEXT UNIQUE NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Activity logs for change tracking
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, -- 'task', 'project', 'subtask', 'comment', etc.
  entity_id UUID NOT NULL,
  action activity_action NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Comments system for discussions
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL, -- 'task', 'project', 'subtask'
  entity_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. File attachments
CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL, -- 'task', 'project', 'comment'
  entity_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Board columns for column-based task organization
CREATE TABLE IF NOT EXISTS board_columns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6b7280', -- Default gray color
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(project_id, name), -- Prevent duplicate column names within a project
  UNIQUE(project_id, position) -- Prevent duplicate positions within a project
);

-- Enhance existing tables
-- =====================================================

-- Add columns to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS status project_status DEFAULT 'active';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3B82F6';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT FALSE;

-- Add columns to tasks table  
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority priority_level DEFAULT 'medium';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS estimated_hours DECIMAL(5,2);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS actual_hours DECIMAL(5,2);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS column_id UUID REFERENCES board_columns(id) ON DELETE SET NULL;

-- Create indexes for performance
-- =====================================================

-- Subtasks indexes
CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_order ON subtasks(task_id, order_index);

-- Task assignments indexes
CREATE INDEX IF NOT EXISTS idx_task_assignments_task_id ON task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_user_id ON task_assignments(user_id);

-- Team indexes
CREATE INDEX IF NOT EXISTS idx_teams_created_by ON teams(created_by);

-- Team members indexes
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);

-- Project invitations indexes
CREATE INDEX IF NOT EXISTS idx_project_invitations_project_id ON project_invitations(project_id);
CREATE INDEX IF NOT EXISTS idx_project_invitations_email ON project_invitations(email);
CREATE INDEX IF NOT EXISTS idx_project_invitations_token ON project_invitations(token);
CREATE INDEX IF NOT EXISTS idx_project_invitations_expires_at ON project_invitations(expires_at);

-- Activity logs indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_project_id ON activity_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_entity ON comments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- Attachments indexes
CREATE INDEX IF NOT EXISTS idx_attachments_entity ON attachments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_attachments_user_id ON attachments(user_id);

-- Enhanced tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_order ON tasks(project_id, order_index);
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_column_id ON tasks(column_id);

-- Enhanced projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- Board columns indexes
CREATE INDEX IF NOT EXISTS idx_board_columns_project_id ON board_columns(project_id);
CREATE INDEX IF NOT EXISTS idx_board_columns_position ON board_columns(position);
CREATE INDEX IF NOT EXISTS idx_board_columns_project_position ON board_columns(project_id, position);

-- Create updated_at triggers
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at columns
CREATE TRIGGER update_subtasks_updated_at BEFORE UPDATE ON subtasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_board_columns_updated_at BEFORE UPDATE ON board_columns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
-- =====================================================

ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_columns ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- =====================================================

-- Subtasks policies
CREATE POLICY "Users can view subtasks of tasks they have access to" ON subtasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tasks t
            JOIN project_members pm ON t.project_id = pm.project_id
            WHERE t.id = subtasks.task_id AND pm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage subtasks of tasks they have access to" ON subtasks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM tasks t
            JOIN project_members pm ON t.project_id = pm.project_id
            WHERE t.id = subtasks.task_id AND pm.user_id = auth.uid()
        )
    );

-- Task assignments policies
CREATE POLICY "Users can view task assignments for accessible tasks" ON task_assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tasks t
            JOIN project_members pm ON t.project_id = pm.project_id
            WHERE t.id = task_assignments.task_id AND pm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage task assignments for accessible tasks" ON task_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM tasks t
            JOIN project_members pm ON t.project_id = pm.project_id
            WHERE t.id = task_assignments.task_id AND pm.user_id = auth.uid()
            AND pm.role IN ('owner', 'admin')
        )
    );

-- Teams policies
CREATE POLICY "Users can view teams they belong to" ON teams
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.team_id = teams.id AND tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Team owners and admins can manage teams" ON teams
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.team_id = teams.id AND tm.user_id = auth.uid()
            AND tm.role IN ('owner', 'admin')
        )
    );

-- Team members policies
CREATE POLICY "Users can view team members of their teams" ON team_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.team_id = team_members.team_id AND tm.user_id = auth.uid()
        )
    );

-- Project invitations policies
CREATE POLICY "Project members can view project invitations" ON project_invitations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = project_invitations.project_id AND pm.user_id = auth.uid()
        )
    );

-- Activity logs policies
CREATE POLICY "Users can view activity logs for accessible projects" ON activity_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = activity_logs.project_id AND pm.user_id = auth.uid()
        )
    );

-- Comments policies
CREATE POLICY "Users can view comments on accessible entities" ON comments
    FOR SELECT USING (
        CASE comments.entity_type
            WHEN 'project' THEN EXISTS (
                SELECT 1 FROM project_members pm
                WHERE pm.project_id = comments.entity_id::UUID AND pm.user_id = auth.uid()
            )
            WHEN 'task' THEN EXISTS (
                SELECT 1 FROM tasks t
                JOIN project_members pm ON t.project_id = pm.project_id
                WHERE t.id = comments.entity_id::UUID AND pm.user_id = auth.uid()
            )
            ELSE false
        END
    );

-- Attachments policies
CREATE POLICY "Users can view attachments on accessible entities" ON attachments
    FOR SELECT USING (
        CASE attachments.entity_type
            WHEN 'project' THEN EXISTS (
                SELECT 1 FROM project_members pm
                WHERE pm.project_id = attachments.entity_id::UUID AND pm.user_id = auth.uid()
            )
            WHEN 'task' THEN EXISTS (
                SELECT 1 FROM tasks t
                JOIN project_members pm ON t.project_id = pm.project_id
                WHERE t.id = attachments.entity_id::UUID AND pm.user_id = auth.uid()
            )
            ELSE false
        END
    );

-- Board columns policies
CREATE POLICY "Users can view project board columns" ON board_columns
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE id = board_columns.project_id 
            AND (owner_id = auth.uid() OR EXISTS (
                SELECT 1 FROM project_members 
                WHERE project_id = projects.id 
                AND user_id = auth.uid()
            ))
        )
    );

CREATE POLICY "Project members can create board columns" ON board_columns
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE id = board_columns.project_id 
            AND (owner_id = auth.uid() OR EXISTS (
                SELECT 1 FROM project_members 
                WHERE project_id = projects.id 
                AND user_id = auth.uid()
            ))
        )
    );

CREATE POLICY "Project members can update board columns" ON board_columns
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE id = board_columns.project_id 
            AND (owner_id = auth.uid() OR EXISTS (
                SELECT 1 FROM project_members 
                WHERE project_id = projects.id 
                AND user_id = auth.uid()
            ))
        )
    );

CREATE POLICY "Project owners and admins can delete board columns" ON board_columns
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM projects 
            WHERE id = board_columns.project_id 
            AND owner_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM project_members 
            WHERE project_id = board_columns.project_id 
            AND user_id = auth.uid() 
            AND role IN ('owner', 'admin')
        )
    );

-- Create helper functions
-- =====================================================

-- Function to check if user has project access
CREATE OR REPLACE FUNCTION user_has_project_access(project_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM project_members
        WHERE project_id = project_uuid AND user_id = user_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's role in project
CREATE OR REPLACE FUNCTION get_user_project_role(project_uuid UUID, user_uuid UUID)
RETURNS member_role AS $$
DECLARE
    user_role member_role;
BEGIN
    SELECT role INTO user_role
    FROM project_members
    WHERE project_id = project_uuid AND user_id = user_uuid;
    
    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log activity
CREATE OR REPLACE FUNCTION log_activity(
    p_user_id UUID,
    p_project_id UUID,
    p_entity_type TEXT,
    p_entity_id UUID,
    p_action activity_action,
    p_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO activity_logs (user_id, project_id, entity_type, entity_id, action, details)
    VALUES (p_user_id, p_project_id, p_entity_type, p_entity_id, p_action, p_details)
    RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Summary of changes:
-- - Added 9 new tables: subtasks, task_assignments, teams, team_members, 
--   project_invitations, activity_logs, comments, attachments, board_columns
-- - Enhanced existing tables with new columns
-- - Created comprehensive indexes for performance
-- - Implemented Row Level Security policies
-- - Added helper functions for common operations
-- - Created updated_at triggers for timestamp management

-- Next steps:
-- 1. Update API endpoints to work with board_columns
-- 2. Update frontend to use column-based organization
-- 3. Test the new functionality thoroughly
-- 4. Consider deprecating the old status field after successful migration

-- =================================================================================
-- DATABASE MIGRATION: Custom Board Columns Enhancement
-- Purpose: Add support for custom board columns and migrate from status-based to column-based task organization
-- Version: 1.0
-- Date: 2025-06-24
-- =================================================================================

-- STEP 1: Create board_columns table
-- =================================================================================

CREATE TABLE board_columns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6b7280', -- Default gray color
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(project_id, name), -- Prevent duplicate column names within a project
  UNIQUE(project_id, position) -- Prevent duplicate positions within a project
);

-- STEP 2: Create indexes for board_columns
-- =================================================================================

CREATE INDEX idx_board_columns_project_id ON board_columns(project_id);
CREATE INDEX idx_board_columns_position ON board_columns(position);
CREATE INDEX idx_board_columns_project_position ON board_columns(project_id, position);

-- STEP 3: Add column_id to tasks table
-- =================================================================================

-- Add the new column_id field (nullable initially for migration)
ALTER TABLE tasks ADD COLUMN column_id UUID REFERENCES board_columns(id) ON DELETE SET NULL;

-- Create index for the new column_id field
CREATE INDEX idx_tasks_column_id ON tasks(column_id);

-- STEP 4: Enable RLS for board_columns
-- =================================================================================

ALTER TABLE board_columns ENABLE ROW LEVEL SECURITY;

-- STEP 5: Create RLS policies for board_columns
-- =================================================================================

-- Users can view columns for projects they have access to
CREATE POLICY "Users can view project board columns" ON board_columns
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = board_columns.project_id 
      AND (owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM project_members 
        WHERE project_id = projects.id 
        AND user_id = auth.uid()
      ))
    )
  );

-- Project members can create columns
CREATE POLICY "Project members can create board columns" ON board_columns
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = board_columns.project_id 
      AND (owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM project_members 
        WHERE project_id = projects.id 
        AND user_id = auth.uid()
      ))
    )
  );

-- Project members can update columns
CREATE POLICY "Project members can update board columns" ON board_columns
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = board_columns.project_id 
      AND (owner_id = auth.uid() OR EXISTS (
        SELECT 1 FROM project_members 
        WHERE project_id = projects.id 
        AND user_id = auth.uid()
      ))
    )
  );

-- Project owners and admins can delete columns
CREATE POLICY "Project owners and admins can delete board columns" ON board_columns
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE id = board_columns.project_id 
      AND owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM project_members 
      WHERE project_id = board_columns.project_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- STEP 6: Create trigger for board_columns updated_at
-- =================================================================================

CREATE TRIGGER update_board_columns_updated_at 
  BEFORE UPDATE ON board_columns 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- STEP 7: Data Migration - Create default columns for existing projects
-- =================================================================================

-- Create a function to migrate existing projects to use default board columns
CREATE OR REPLACE FUNCTION migrate_projects_to_board_columns()
RETURNS void AS $$
DECLARE
  project_record RECORD;
  todo_column_id UUID;
  in_progress_column_id UUID;
  done_column_id UUID;
BEGIN
  -- Loop through all existing projects
  FOR project_record IN SELECT id FROM projects LOOP
    -- Create default columns for each project
    INSERT INTO board_columns (project_id, name, color, position) VALUES 
      (project_record.id, 'To Do', '#3b82f6', 0) RETURNING id INTO todo_column_id;
    
    INSERT INTO board_columns (project_id, name, color, position) VALUES 
      (project_record.id, 'In Progress', '#f59e0b', 1) RETURNING id INTO in_progress_column_id;
    
    INSERT INTO board_columns (project_id, name, color, position) VALUES 
      (project_record.id, 'Done', '#10b981', 2) RETURNING id INTO done_column_id;
    
    -- Migrate existing tasks to use the new columns based on their status
    UPDATE tasks SET column_id = todo_column_id 
    WHERE project_id = project_record.id AND status = 'todo';
    
    UPDATE tasks SET column_id = in_progress_column_id 
    WHERE project_id = project_record.id AND status = 'in_progress';
    
    UPDATE tasks SET column_id = done_column_id 
    WHERE project_id = project_record.id AND status = 'done';
  END LOOP;
  
  RAISE NOTICE 'Migration completed successfully for % projects', (SELECT COUNT(*) FROM projects);
END;
$$ LANGUAGE plpgsql;

-- Execute the migration
SELECT migrate_projects_to_board_columns();

-- Drop the migration function as it's no longer needed
DROP FUNCTION migrate_projects_to_board_columns();

-- STEP 8: Create function to automatically create default columns for new projects
-- =================================================================================

CREATE OR REPLACE FUNCTION create_default_board_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Create default columns for the new project
  INSERT INTO board_columns (project_id, name, color, position) VALUES 
    (NEW.id, 'To Do', '#3b82f6', 0),
    (NEW.id, 'In Progress', '#f59e0b', 1),
    (NEW.id, 'Done', '#10b981', 2);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create default columns for new projects
CREATE TRIGGER create_default_board_columns_trigger
  AFTER INSERT ON projects
  FOR EACH ROW EXECUTE FUNCTION create_default_board_columns();

-- STEP 9: Validation and verification queries
-- =================================================================================

-- Check that board_columns table was created successfully
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'board_columns';

-- Check that column_id was added to tasks table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'tasks' 
AND column_name = 'column_id';

-- Check that indexes were created
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'board_columns' 
AND schemaname = 'public';

-- Verify data migration: Count tasks that have been assigned to columns
SELECT 
  COUNT(*) as total_tasks,
  COUNT(column_id) as tasks_with_columns,
  COUNT(*) - COUNT(column_id) as tasks_without_columns
FROM tasks;

-- Verify default columns were created for all projects
SELECT 
  p.id as project_id,
  p.title as project_title,
  COUNT(bc.id) as column_count
FROM projects p
LEFT JOIN board_columns bc ON p.id = bc.project_id
GROUP BY p.id, p.title
ORDER BY p.title;

-- Show sample of board columns created
SELECT 
  bc.name,
  bc.color,
  bc.position,
  p.title as project_title,
  COUNT(t.id) as task_count
FROM board_columns bc
JOIN projects p ON bc.project_id = p.id
LEFT JOIN tasks t ON bc.id = t.column_id
GROUP BY bc.id, bc.name, bc.color, bc.position, p.title
ORDER BY p.title, bc.position;

-- =================================================================================
-- MIGRATION COMPLETE
-- =================================================================================

-- Summary:
-- ✅ Created board_columns table with proper structure and constraints
-- ✅ Added column_id to tasks table with foreign key relationship
-- ✅ Created appropriate indexes for performance
-- ✅ Set up RLS policies for security
-- ✅ Migrated existing tasks from status-based to column-based organization
-- ✅ Created default columns (To Do, In Progress, Done) for all existing projects
-- ✅ Set up automatic column creation for new projects
-- ✅ Added verification queries to confirm successful migration

-- Next steps:
-- 1. Update API endpoints to work with board_columns
-- 2. Update frontend to use column-based organization
-- 3. Test the new functionality thoroughly
-- 4. Consider deprecating the old status field after successful migration 