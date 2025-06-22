-- =====================================================
-- ASANA CLONE - STEP-BY-STEP DATABASE MIGRATION
-- =====================================================
-- Execute each section separately in Supabase SQL Editor
-- Verify each step before proceeding to the next

-- STEP 1: CREATE CUSTOM TYPES
-- ===========================
-- Run this first, then verify before proceeding

CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE activity_action AS ENUM (
  'created', 'updated', 'deleted', 'assigned', 'unassigned', 
  'completed', 'reopened', 'commented', 'invited', 'joined',
  'archived', 'restored', 'status_changed', 'due_date_changed'
);
CREATE TYPE project_status AS ENUM ('active', 'archived', 'completed', 'template');
CREATE TYPE team_role AS ENUM ('owner', 'admin', 'member');

-- Verification: SELECT typname FROM pg_type WHERE typname IN ('priority_level', 'activity_action', 'project_status', 'team_role');

-- STEP 2: CREATE CORE TABLES (PART A)
-- ====================================

-- Subtasks table for task breakdown
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

-- Task assignments for many-to-many user-task relationships
CREATE TABLE IF NOT EXISTS task_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, user_id)
);

-- STEP 3: CREATE CORE TABLES (PART B)  
-- ====================================

-- Teams for organization structure
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team members for team membership
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role team_role DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Project invitations for email-based invites
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

-- STEP 4: CREATE COLLABORATION TABLES
-- ===================================

-- Activity logs for change tracking
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action activity_action NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments system for discussions
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- File attachments
CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STEP 5: ENHANCE EXISTING TABLES
-- ===============================

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

-- STEP 6: CREATE PERFORMANCE INDEXES
-- ==================================

-- Subtasks indexes
CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_order ON subtasks(task_id, order_index);

-- Task assignments indexes
CREATE INDEX IF NOT EXISTS idx_task_assignments_task_id ON task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_user_id ON task_assignments(user_id);

-- Team indexes
CREATE INDEX IF NOT EXISTS idx_teams_created_by ON teams(created_by);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);

-- Project invitations indexes
CREATE INDEX IF NOT EXISTS idx_project_invitations_project_id ON project_invitations(project_id);
CREATE INDEX IF NOT EXISTS idx_project_invitations_email ON project_invitations(email);
CREATE INDEX IF NOT EXISTS idx_project_invitations_token ON project_invitations(token);

-- Activity logs indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_project_id ON activity_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_entity ON comments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- Attachments indexes
CREATE INDEX IF NOT EXISTS idx_attachments_entity ON attachments(entity_type, entity_id);

-- Enhanced tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_order ON tasks(project_id, order_index);
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_task_id);

-- Enhanced projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- STEP 7: CREATE UPDATED_AT TRIGGERS
-- ==================================

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

-- STEP 8: ENABLE ROW LEVEL SECURITY
-- =================================

ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- STEP 9: CREATE RLS POLICIES (PART A)
-- ====================================

-- Subtasks policies
CREATE POLICY "Users can view subtasks of accessible tasks" ON subtasks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tasks t
            JOIN project_members pm ON t.project_id = pm.project_id
            WHERE t.id = subtasks.task_id AND pm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage subtasks of accessible tasks" ON subtasks
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

CREATE POLICY "Admins can manage task assignments" ON task_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM tasks t
            JOIN project_members pm ON t.project_id = pm.project_id
            WHERE t.id = task_assignments.task_id AND pm.user_id = auth.uid()
            AND pm.role IN ('owner', 'admin')
        )
    );

-- STEP 10: CREATE RLS POLICIES (PART B)
-- =====================================

-- Teams policies
CREATE POLICY "Users can view teams they belong to" ON teams
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.team_id = teams.id AND tm.user_id = auth.uid()
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
CREATE POLICY "Project members can view invitations" ON project_invitations
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

-- STEP 11: CREATE HELPER FUNCTIONS
-- ================================

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

-- FINAL VERIFICATION QUERY
-- ========================
-- Run this to verify everything was created successfully

SELECT 'Tables' as type, table_name as name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN (
  'projects', 'project_members', 'tasks', 'subtasks', 'task_assignments',
  'teams', 'team_members', 'project_invitations', 'activity_logs', 
  'comments', 'attachments'
)
UNION ALL
SELECT 'Types' as type, typname as name FROM pg_type 
WHERE typname IN ('priority_level', 'activity_action', 'project_status', 'team_role')
UNION ALL
SELECT 'Functions' as type, routine_name as name FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name IN (
  'user_has_project_access', 'get_user_project_role', 'log_activity'
)
ORDER BY type, name;

-- Expected: 18 rows total (11 tables + 4 types + 3 functions) 