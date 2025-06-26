-- =====================================================
-- MULTI-USER COLLABORATION HELPER FUNCTIONS
-- =====================================================

-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION user_has_permission(
  p_user_id UUID,
  p_permission_action permission_action,
  p_context_type TEXT,
  p_context_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  has_permission BOOLEAN := FALSE;
  user_role TEXT;
BEGIN
  -- Check custom permissions first (overrides)
  SELECT granted INTO has_permission
  FROM custom_permissions cp
  JOIN permissions p ON p.id = cp.permission_id
  WHERE cp.user_id = p_user_id
    AND p.action = p_permission_action
    AND cp.context_type = p_context_type
    AND cp.context_id = p_context_id;
  
  IF has_permission IS NOT NULL THEN
    RETURN has_permission;
  END IF;
  
  -- Check role-based permissions
  CASE p_context_type
    WHEN 'project' THEN
      SELECT role::TEXT INTO user_role
      FROM project_members
      WHERE project_id = p_context_id AND user_id = p_user_id;
    WHEN 'team' THEN
      SELECT role::TEXT INTO user_role
      FROM team_members
      WHERE team_id = p_context_id AND user_id = p_user_id;
    WHEN 'workspace' THEN
      SELECT role::TEXT INTO user_role
      FROM workspace_members
      WHERE workspace_id = p_context_id AND user_id = p_user_id;
  END CASE;
  
  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  SELECT TRUE INTO has_permission
  FROM role_permissions rp
  JOIN permissions p ON p.id = rp.permission_id
  WHERE rp.role_name = user_role
    AND p.action = p_permission_action
    AND rp.context_type = p_context_type;
  
  RETURN COALESCE(has_permission, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Function to get user's workspace role
CREATE OR REPLACE FUNCTION get_user_workspace_role(
  p_workspace_id UUID,
  p_user_id UUID
) RETURNS workspace_role AS $$
DECLARE
  user_role workspace_role;
BEGIN
  SELECT role INTO user_role
  FROM workspace_members
  WHERE workspace_id = p_workspace_id AND user_id = p_user_id;
  
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create default workspace for user
CREATE OR REPLACE FUNCTION create_default_workspace(
  p_user_id UUID,
  p_workspace_name TEXT DEFAULT 'My Workspace'
) RETURNS UUID AS $$
DECLARE
  workspace_id UUID;
  workspace_slug TEXT;
BEGIN
  -- Generate unique slug
  workspace_slug := lower(replace(p_workspace_name, ' ', '-')) || '-' || 
                   substring(encode(gen_random_bytes(4), 'hex'), 1, 8);
  
  -- Create workspace
  INSERT INTO workspaces (name, slug, created_by)
  VALUES (p_workspace_name, workspace_slug, p_user_id)
  RETURNING id INTO workspace_id;
  
  -- Add user as workspace owner
  INSERT INTO workspace_members (workspace_id, user_id, role)
  VALUES (workspace_id, p_user_id, 'owner');
  
  RETURN workspace_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to safely delete user data (GDPR compliance)
CREATE OR REPLACE FUNCTION anonymize_user_data(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Anonymize user references in various tables
  UPDATE projects SET owner_id = NULL WHERE owner_id = p_user_id;
  UPDATE tasks SET created_by = NULL WHERE created_by = p_user_id;
  UPDATE tasks SET assignee_id = NULL WHERE assignee_id = p_user_id;
  UPDATE comments SET user_id = NULL WHERE user_id = p_user_id;
  UPDATE attachments SET user_id = NULL WHERE user_id = p_user_id;
  UPDATE document_versions SET created_by = NULL WHERE created_by = p_user_id;
  UPDATE version_history SET user_id = NULL WHERE user_id = p_user_id;
  
  -- Remove user from all memberships
  DELETE FROM project_members WHERE user_id = p_user_id;
  DELETE FROM team_members WHERE user_id = p_user_id;
  DELETE FROM workspace_members WHERE user_id = p_user_id;
  DELETE FROM task_assignments WHERE user_id = p_user_id;
  DELETE FROM custom_permissions WHERE user_id = p_user_id;
  DELETE FROM notification_preferences WHERE user_id = p_user_id;
  DELETE FROM notification_queue WHERE user_id = p_user_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
