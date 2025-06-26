-- =====================================================
-- VERSION HISTORY SETUP - COMPLETE
-- =====================================================
-- Run this entire script in Supabase SQL Editor to set up version history functionality
-- This combines the necessary tables and functions for subtask 9.16

-- =====================================================
-- 1. CREATE TABLES (IF NOT EXISTS)
-- =====================================================

-- Document versions for tasks and projects
CREATE TABLE IF NOT EXISTS document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL, -- 'task', 'project'
  entity_id UUID NOT NULL,
  version_number INTEGER NOT NULL,
  content JSONB NOT NULL, -- Full document state
  summary TEXT, -- Brief description of changes
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(entity_type, entity_id, version_number)
);

-- Version change tracking
CREATE TABLE IF NOT EXISTS version_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES document_versions(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL, -- Which field was changed
  old_value JSONB,
  new_value JSONB,
  change_type TEXT NOT NULL, -- 'create', 'update', 'delete'
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Versioning indexes
CREATE INDEX IF NOT EXISTS idx_document_versions_entity ON document_versions(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_created ON document_versions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_version_history_version ON version_history(version_id);

-- =====================================================
-- 3. CREATE CORE FUNCTIONS
-- =====================================================

-- Function to create document version
CREATE OR REPLACE FUNCTION create_document_version(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_content JSONB,
  p_summary TEXT,
  p_user_id UUID
) RETURNS UUID AS $$
DECLARE
  next_version INTEGER;
  version_id UUID;
BEGIN
  -- Get next version number
  SELECT COALESCE(MAX(version_number), 0) + 1 INTO next_version
  FROM document_versions
  WHERE entity_type = p_entity_type AND entity_id = p_entity_id;
  
  -- Create version record
  INSERT INTO document_versions (
    entity_type, entity_id, version_number, content, summary, created_by
  ) VALUES (
    p_entity_type, p_entity_id, next_version, p_content, p_summary, p_user_id
  ) RETURNING id INTO version_id;
  
  RETURN version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to rollback to a specific version
CREATE OR REPLACE FUNCTION rollback_to_version(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_version_number INTEGER,
  p_user_id UUID
) RETURNS UUID AS $$
DECLARE
  version_content JSONB;
  new_version_id UUID;
BEGIN
  -- Get the content from the target version
  SELECT content INTO version_content
  FROM document_versions
  WHERE entity_type = p_entity_type 
    AND entity_id = p_entity_id 
    AND version_number = p_version_number;
  
  IF version_content IS NULL THEN
    RAISE EXCEPTION 'Version % not found for % %', p_version_number, p_entity_type, p_entity_id;
  END IF;
  
  -- Create a new version with the rolled-back content
  SELECT create_document_version(
    p_entity_type,
    p_entity_id,
    version_content,
    'Rolled back to version ' || p_version_number,
    p_user_id
  ) INTO new_version_id;
  
  RETURN new_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get version history for an entity
CREATE OR REPLACE FUNCTION get_version_history(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_limit INTEGER DEFAULT 50
) RETURNS TABLE (
  version_id UUID,
  version_number INTEGER,
  summary TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ,
  creator_email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dv.id,
    dv.version_number,
    dv.summary,
    dv.created_by,
    dv.created_at,
    u.email
  FROM document_versions dv
  LEFT JOIN auth.users u ON u.id = dv.created_by
  WHERE dv.entity_type = p_entity_type 
    AND dv.entity_id = p_entity_id
  ORDER BY dv.version_number DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to compare two versions
CREATE OR REPLACE FUNCTION compare_versions(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_version_1 INTEGER,
  p_version_2 INTEGER
) RETURNS TABLE (
  field_name TEXT,
  version_1_value JSONB,
  version_2_value JSONB,
  changed BOOLEAN
) AS $$
DECLARE
  content_1 JSONB;
  content_2 JSONB;
  field_key TEXT;
BEGIN
  -- Get content for both versions
  SELECT content INTO content_1
  FROM document_versions
  WHERE entity_type = p_entity_type 
    AND entity_id = p_entity_id 
    AND version_number = p_version_1;
    
  SELECT content INTO content_2
  FROM document_versions
  WHERE entity_type = p_entity_type 
    AND entity_id = p_entity_id 
    AND version_number = p_version_2;
  
  -- Compare all fields
  FOR field_key IN SELECT jsonb_object_keys(content_1 || content_2)
  LOOP
    RETURN QUERY SELECT 
      field_key,
      content_1->field_key,
      content_2->field_key,
      (content_1->field_key) != (content_2->field_key);
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. SET UP ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on tables
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE version_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_versions
CREATE POLICY "Users can view document versions for entities they have access to" ON document_versions
  FOR SELECT USING (
    -- Allow if user created the version
    created_by = auth.uid() OR
    -- Allow if user has access to the entity (simplified - can be enhanced)
    TRUE -- For demo purposes, allowing all authenticated users
  );

CREATE POLICY "Users can create document versions" ON document_versions
  FOR INSERT WITH CHECK (
    created_by = auth.uid()
  );

-- RLS Policies for version_history
CREATE POLICY "Users can view version history for accessible versions" ON version_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM document_versions dv 
      WHERE dv.id = version_id AND (dv.created_by = auth.uid() OR TRUE)
    )
  );

CREATE POLICY "Users can create version history entries" ON version_history
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

-- =====================================================
-- 5. VERIFICATION QUERIES
-- =====================================================

-- Verify tables exist
SELECT 'Tables created successfully' as status, 
       COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('document_versions', 'version_history');

-- Verify functions exist
SELECT 'Functions created successfully' as status,
       COUNT(*) as function_count
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('create_document_version', 'rollback_to_version', 'get_version_history', 'compare_versions');

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
-- You can now test the version history functionality at:
-- http://localhost:5175/version-history-demo
-- ===================================================== 