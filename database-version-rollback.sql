-- =====================================================
-- VERSION HISTORY ROLLBACK FUNCTIONS
-- =====================================================
-- Additional functions needed for subtask 9.16

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
  
  -- Update the actual entity with the rolled-back content
  CASE p_entity_type
    WHEN 'task' THEN
      UPDATE tasks SET
        title = version_content->>'title',
        description = version_content->>'description',
        status = COALESCE((version_content->>'status')::task_status, status),
        priority = COALESCE((version_content->>'priority')::task_priority, priority),
        due_date = CASE 
          WHEN version_content->>'due_date' IS NOT NULL 
          THEN (version_content->>'due_date')::TIMESTAMPTZ 
          ELSE due_date 
        END,
        updated_at = NOW()
      WHERE id = p_entity_id;
      
    WHEN 'project' THEN
      UPDATE projects SET
        name = version_content->>'name',
        description = version_content->>'description',
        status = COALESCE((version_content->>'status')::project_status, status),
        updated_at = NOW()
      WHERE id = p_entity_id;
  END CASE;
  
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

-- Function to track field-level changes when creating versions
CREATE OR REPLACE FUNCTION track_version_changes(
  p_version_id UUID,
  p_old_content JSONB,
  p_new_content JSONB,
  p_user_id UUID
) RETURNS VOID AS $$
DECLARE
  field_key TEXT;
  old_val JSONB;
  new_val JSONB;
BEGIN
  -- Track changes for each field
  FOR field_key IN SELECT jsonb_object_keys(p_old_content || p_new_content)
  LOOP
    old_val := p_old_content->field_key;
    new_val := p_new_content->field_key;
    
    -- Only track if values are different
    IF old_val != new_val OR (old_val IS NULL) != (new_val IS NULL) THEN
      INSERT INTO version_history (
        version_id,
        field_name,
        old_value,
        new_value,
        change_type,
        user_id
      ) VALUES (
        p_version_id,
        field_key,
        old_val,
        new_val,
        CASE 
          WHEN old_val IS NULL THEN 'create'
          WHEN new_val IS NULL THEN 'delete'
          ELSE 'update'
        END,
        p_user_id
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get detailed change history for a version
CREATE OR REPLACE FUNCTION get_version_changes(
  p_version_id UUID
) RETURNS TABLE (
  field_name TEXT,
  old_value JSONB,
  new_value JSONB,
  change_type TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vh.field_name,
    vh.old_value,
    vh.new_value,
    vh.change_type,
    vh.user_id,
    vh.created_at
  FROM version_history vh
  WHERE vh.version_id = p_version_id
  ORDER BY vh.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced create_document_version function with change tracking
CREATE OR REPLACE FUNCTION create_document_version_with_tracking(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_content JSONB,
  p_summary TEXT,
  p_user_id UUID
) RETURNS UUID AS $$
DECLARE
  next_version INTEGER;
  version_id UUID;
  previous_content JSONB;
BEGIN
  -- Get next version number
  SELECT COALESCE(MAX(version_number), 0) + 1 INTO next_version
  FROM document_versions
  WHERE entity_type = p_entity_type AND entity_id = p_entity_id;
  
  -- Get previous version content for change tracking
  IF next_version > 1 THEN
    SELECT content INTO previous_content
    FROM document_versions
    WHERE entity_type = p_entity_type 
      AND entity_id = p_entity_id 
      AND version_number = next_version - 1;
  END IF;
  
  -- Create version record
  INSERT INTO document_versions (
    entity_type, entity_id, version_number, content, summary, created_by
  ) VALUES (
    p_entity_type, p_entity_id, next_version, p_content, p_summary, p_user_id
  ) RETURNING id INTO version_id;
  
  -- Track changes if there was a previous version
  IF previous_content IS NOT NULL THEN
    PERFORM track_version_changes(version_id, previous_content, p_content, p_user_id);
  END IF;
  
  RETURN version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMPLETED: Version History Rollback Functions
-- ===================================================== 