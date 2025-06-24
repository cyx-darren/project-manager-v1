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