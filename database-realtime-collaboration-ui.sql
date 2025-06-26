-- =====================================================
-- REAL-TIME COLLABORATION UI DATABASE SCHEMA
-- =====================================================
-- This script adds database support for real-time collaboration UI features
-- including user presence, typing indicators, cursor positions, and collaborative editing

-- =====================================================
-- 1. USER PRESENCE SYSTEM
-- =====================================================

-- User presence status
CREATE TYPE presence_status AS ENUM ('online', 'away', 'busy', 'offline');

-- User presence tracking
CREATE TABLE IF NOT EXISTS user_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status presence_status DEFAULT 'online',
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  current_page TEXT, -- Current page/route user is viewing
  session_id TEXT, -- Browser session identifier
  device_info JSONB DEFAULT '{}', -- Browser, OS, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, session_id)
);

-- Entity presence (which users are viewing/editing specific entities)
CREATE TABLE IF NOT EXISTS entity_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, -- 'task', 'project', 'comment'
  entity_id UUID NOT NULL,
  presence_type TEXT NOT NULL, -- 'viewing', 'editing', 'commenting'
  cursor_position JSONB, -- { "field": "title", "position": 15, "selection": [10, 20] }
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, entity_type, entity_id, presence_type, session_id)
);

-- =====================================================
-- 2. TYPING INDICATORS
-- =====================================================

-- Typing indicator tracking
CREATE TABLE IF NOT EXISTS typing_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, -- 'task', 'project', 'comment'
  entity_id UUID NOT NULL,
  field_name TEXT NOT NULL, -- 'title', 'description', 'comment_content'
  is_typing BOOLEAN DEFAULT TRUE,
  cursor_position INTEGER DEFAULT 0,
  selection_start INTEGER,
  selection_end INTEGER,
  session_id TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_keystroke TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 seconds'),
  UNIQUE(user_id, entity_type, entity_id, field_name, session_id)
);

-- =====================================================
-- 3. COLLABORATIVE EDITING STATE
-- =====================================================

-- Lock status for collaborative editing
CREATE TYPE edit_lock_status AS ENUM ('unlocked', 'soft_lock', 'hard_lock');

-- Edit locks for preventing conflicts
CREATE TABLE IF NOT EXISTS edit_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  field_name TEXT, -- Specific field being edited (null = entire entity)
  locked_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lock_status edit_lock_status DEFAULT 'soft_lock',
  lock_reason TEXT, -- 'editing', 'reviewing', 'admin_override'
  acquired_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '10 minutes'),
  session_id TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  UNIQUE(entity_type, entity_id, field_name)
);

-- Collaborative editing sessions
CREATE TABLE IF NOT EXISTS collaboration_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  session_name TEXT, -- Optional session name
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  settings JSONB DEFAULT '{}', -- { "allow_simultaneous": true, "auto_save": true }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  UNIQUE(entity_type, entity_id, created_by) DEFERRABLE INITIALLY DEFERRED
);

-- Session participants
CREATE TABLE IF NOT EXISTS session_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'participant', -- 'owner', 'editor', 'viewer', 'participant'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  permissions JSONB DEFAULT '{}',
  UNIQUE(session_id, user_id)
);

-- =====================================================
-- 4. REAL-TIME ACTIVITY TRACKING
-- =====================================================

-- Real-time activity events
CREATE TABLE IF NOT EXISTS realtime_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  activity_type TEXT NOT NULL, -- 'cursor_move', 'selection_change', 'field_focus', 'field_blur'
  activity_data JSONB NOT NULL, -- Event-specific data
  session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient querying of recent activity
CREATE INDEX IF NOT EXISTS idx_realtime_activity_recent ON realtime_activity(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_realtime_activity_user ON realtime_activity(user_id, created_at DESC);

-- =====================================================
-- 5. CURSOR AND SELECTION TRACKING
-- =====================================================

-- User cursor positions in real-time
CREATE TABLE IF NOT EXISTS user_cursors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  field_name TEXT NOT NULL,
  cursor_position INTEGER NOT NULL DEFAULT 0,
  selection_start INTEGER,
  selection_end INTEGER,
  selection_text TEXT,
  cursor_color TEXT DEFAULT '#3B82F6', -- User's cursor color
  session_id TEXT NOT NULL,
  last_moved TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '5 minutes'),
  UNIQUE(user_id, entity_type, entity_id, field_name, session_id)
);

-- =====================================================
-- 6. COLLABORATIVE ANNOTATIONS
-- =====================================================

-- Real-time annotations and highlights
CREATE TABLE IF NOT EXISTS collaborative_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  field_name TEXT NOT NULL,
  annotation_type TEXT NOT NULL, -- 'highlight', 'comment', 'suggestion', 'cursor'
  start_position INTEGER NOT NULL,
  end_position INTEGER,
  content TEXT,
  style JSONB DEFAULT '{}', -- Color, background, etc.
  is_temporary BOOLEAN DEFAULT FALSE, -- True for cursors, false for persistent annotations
  session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- =====================================================
-- 7. FUNCTIONS FOR REAL-TIME OPERATIONS
-- =====================================================

-- Function to update user presence
CREATE OR REPLACE FUNCTION update_user_presence(
  p_user_id UUID,
  p_status presence_status DEFAULT 'online',
  p_current_page TEXT DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_device_info JSONB DEFAULT '{}'::JSONB
) RETURNS UUID AS $$
DECLARE
  presence_id UUID;
BEGIN
  INSERT INTO user_presence (user_id, status, current_page, session_id, device_info, updated_at)
  VALUES (p_user_id, p_status, p_current_page, p_session_id, p_device_info, NOW())
  ON CONFLICT (user_id, session_id) 
  DO UPDATE SET 
    status = EXCLUDED.status,
    current_page = EXCLUDED.current_page,
    device_info = EXCLUDED.device_info,
    last_seen = NOW(),
    updated_at = NOW()
  RETURNING id INTO presence_id;
  
  RETURN presence_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set entity presence
CREATE OR REPLACE FUNCTION set_entity_presence(
  p_user_id UUID,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_presence_type TEXT,
  p_cursor_position JSONB DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  presence_id UUID;
BEGIN
  INSERT INTO entity_presence (user_id, entity_type, entity_id, presence_type, cursor_position, session_id, last_activity)
  VALUES (p_user_id, p_entity_type, p_entity_id, p_presence_type, p_cursor_position, p_session_id, NOW())
  ON CONFLICT (user_id, entity_type, entity_id, presence_type, session_id)
  DO UPDATE SET 
    cursor_position = EXCLUDED.cursor_position,
    last_activity = NOW()
  RETURNING id INTO presence_id;
  
  RETURN presence_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update typing indicator
CREATE OR REPLACE FUNCTION update_typing_indicator(
  p_user_id UUID,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_field_name TEXT,
  p_is_typing BOOLEAN,
  p_cursor_position INTEGER DEFAULT 0,
  p_selection_start INTEGER DEFAULT NULL,
  p_selection_end INTEGER DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  indicator_id UUID;
BEGIN
  INSERT INTO typing_indicators (
    user_id, entity_type, entity_id, field_name, is_typing, 
    cursor_position, selection_start, selection_end, session_id,
    last_keystroke, expires_at
  )
  VALUES (
    p_user_id, p_entity_type, p_entity_id, p_field_name, p_is_typing,
    p_cursor_position, p_selection_start, p_selection_end, p_session_id,
    NOW(), NOW() + INTERVAL '30 seconds'
  )
  ON CONFLICT (user_id, entity_type, entity_id, field_name, session_id)
  DO UPDATE SET 
    is_typing = EXCLUDED.is_typing,
    cursor_position = EXCLUDED.cursor_position,
    selection_start = EXCLUDED.selection_start,
    selection_end = EXCLUDED.selection_end,
    last_keystroke = NOW(),
    expires_at = NOW() + INTERVAL '30 seconds'
  RETURNING id INTO indicator_id;
  
  RETURN indicator_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update cursor position
CREATE OR REPLACE FUNCTION update_cursor_position(
  p_user_id UUID,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_field_name TEXT,
  p_cursor_position INTEGER,
  p_selection_start INTEGER DEFAULT NULL,
  p_selection_end INTEGER DEFAULT NULL,
  p_selection_text TEXT DEFAULT NULL,
  p_cursor_color TEXT DEFAULT '#3B82F6',
  p_session_id TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  cursor_id UUID;
BEGIN
  INSERT INTO user_cursors (
    user_id, entity_type, entity_id, field_name, cursor_position,
    selection_start, selection_end, selection_text, cursor_color, session_id,
    last_moved, expires_at
  )
  VALUES (
    p_user_id, p_entity_type, p_entity_id, p_field_name, p_cursor_position,
    p_selection_start, p_selection_end, p_selection_text, p_cursor_color, p_session_id,
    NOW(), NOW() + INTERVAL '5 minutes'
  )
  ON CONFLICT (user_id, entity_type, entity_id, field_name, session_id)
  DO UPDATE SET 
    cursor_position = EXCLUDED.cursor_position,
    selection_start = EXCLUDED.selection_start,
    selection_end = EXCLUDED.selection_end,
    selection_text = EXCLUDED.selection_text,
    cursor_color = EXCLUDED.cursor_color,
    last_moved = NOW(),
    expires_at = NOW() + INTERVAL '5 minutes'
  RETURNING id INTO cursor_id;
  
  RETURN cursor_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. CLEANUP FUNCTIONS
-- =====================================================

-- Function to clean up expired presence data
CREATE OR REPLACE FUNCTION cleanup_expired_presence() RETURNS INTEGER AS $$
DECLARE
  cleaned_count INTEGER := 0;
BEGIN
  -- Clean up expired typing indicators
  DELETE FROM typing_indicators WHERE expires_at < NOW();
  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
  
  -- Clean up expired cursors
  DELETE FROM user_cursors WHERE expires_at < NOW();
  
  -- Clean up expired edit locks
  DELETE FROM edit_locks WHERE expires_at < NOW();
  
  -- Clean up old real-time activity (keep last 24 hours)
  DELETE FROM realtime_activity WHERE created_at < NOW() - INTERVAL '24 hours';
  
  -- Clean up inactive entity presence (no activity for 10 minutes)
  DELETE FROM entity_presence WHERE last_activity < NOW() - INTERVAL '10 minutes';
  
  -- Clean up old collaborative annotations that are temporary
  DELETE FROM collaborative_annotations 
  WHERE is_temporary = TRUE AND (expires_at IS NULL OR expires_at < NOW());
  
  RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE edit_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE realtime_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cursors ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborative_annotations ENABLE ROW LEVEL SECURITY;

-- User presence policies
CREATE POLICY "Users can view all user presence" ON user_presence
  FOR SELECT USING (true);

CREATE POLICY "Users can update own presence" ON user_presence
  FOR ALL USING (auth.uid() = user_id);

-- Entity presence policies  
CREATE POLICY "Users can view entity presence for entities they can access" ON entity_presence
  FOR SELECT USING (true); -- TODO: Add proper entity access checks

CREATE POLICY "Users can manage own entity presence" ON entity_presence
  FOR ALL USING (auth.uid() = user_id);

-- Typing indicators policies
CREATE POLICY "Users can view typing indicators for entities they can access" ON typing_indicators
  FOR SELECT USING (true); -- TODO: Add proper entity access checks

CREATE POLICY "Users can manage own typing indicators" ON typing_indicators
  FOR ALL USING (auth.uid() = user_id);

-- Similar policies for other tables
CREATE POLICY "Users can view edit locks for entities they can access" ON edit_locks
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own edit locks" ON edit_locks
  FOR ALL USING (auth.uid() = locked_by);

CREATE POLICY "Users can view collaboration sessions for entities they can access" ON collaboration_sessions
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own collaboration sessions" ON collaboration_sessions
  FOR ALL USING (auth.uid() = created_by);

CREATE POLICY "Users can view session participants for sessions they can access" ON session_participants
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own session participation" ON session_participants
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view realtime activity for entities they can access" ON realtime_activity
  FOR SELECT USING (true);

CREATE POLICY "Users can create own realtime activity" ON realtime_activity
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view cursors for entities they can access" ON user_cursors
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own cursors" ON user_cursors
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view annotations for entities they can access" ON collaborative_annotations
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own annotations" ON collaborative_annotations
  FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- 10. INDEXES FOR PERFORMANCE
-- =====================================================

-- User presence indexes
CREATE INDEX IF NOT EXISTS idx_user_presence_user ON user_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_status ON user_presence(status);
CREATE INDEX IF NOT EXISTS idx_user_presence_updated ON user_presence(updated_at DESC);

-- Entity presence indexes
CREATE INDEX IF NOT EXISTS idx_entity_presence_entity ON entity_presence(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_presence_user ON entity_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_entity_presence_activity ON entity_presence(last_activity DESC);

-- Typing indicators indexes
CREATE INDEX IF NOT EXISTS idx_typing_indicators_entity ON typing_indicators(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_expires ON typing_indicators(expires_at);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_user ON typing_indicators(user_id);

-- Edit locks indexes
CREATE INDEX IF NOT EXISTS idx_edit_locks_entity ON edit_locks(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_edit_locks_expires ON edit_locks(expires_at);
CREATE INDEX IF NOT EXISTS idx_edit_locks_user ON edit_locks(locked_by);

-- Collaboration sessions indexes
CREATE INDEX IF NOT EXISTS idx_collaboration_sessions_entity ON collaboration_sessions(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_sessions_active ON collaboration_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_collaboration_sessions_created ON collaboration_sessions(created_at DESC);

-- Session participants indexes
CREATE INDEX IF NOT EXISTS idx_session_participants_session ON session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_user ON session_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_active ON session_participants(is_active);

-- User cursors indexes
CREATE INDEX IF NOT EXISTS idx_user_cursors_entity ON user_cursors(entity_type, entity_id, field_name);
CREATE INDEX IF NOT EXISTS idx_user_cursors_user ON user_cursors(user_id);
CREATE INDEX IF NOT EXISTS idx_user_cursors_expires ON user_cursors(expires_at);

-- Collaborative annotations indexes
CREATE INDEX IF NOT EXISTS idx_collaborative_annotations_entity ON collaborative_annotations(entity_type, entity_id, field_name);
CREATE INDEX IF NOT EXISTS idx_collaborative_annotations_user ON collaborative_annotations(user_id);
CREATE INDEX IF NOT EXISTS idx_collaborative_annotations_temporary ON collaborative_annotations(is_temporary, expires_at);

-- =====================================================
-- 11. TRIGGERS FOR AUTOMATIC CLEANUP
-- =====================================================

-- Create a function to be called by cron job for cleanup
CREATE OR REPLACE FUNCTION schedule_presence_cleanup() RETURNS void AS $$
BEGIN
  PERFORM cleanup_expired_presence();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMPLETED: Real-time Collaboration UI Schema
-- =====================================================

-- Insert default permissions for real-time collaboration
INSERT INTO permissions (action, name, description, category) VALUES
  ('project.view_presence', 'View User Presence', 'See who is currently viewing/editing the project', 'real-time'),
  ('project.edit_collaborative', 'Collaborative Editing', 'Participate in real-time collaborative editing', 'real-time'),
  ('task.view_presence', 'View User Presence', 'See who is currently viewing/editing the task', 'real-time'),
  ('task.edit_collaborative', 'Collaborative Editing', 'Participate in real-time collaborative editing', 'real-time')
ON CONFLICT (action) DO NOTHING;

-- Grant real-time permissions to all roles by default
INSERT INTO role_permissions (role_name, permission_id, context_type)
SELECT 'member', p.id, 'project' FROM permissions p WHERE p.action IN ('project.view_presence', 'project.edit_collaborative')
UNION ALL
SELECT 'admin', p.id, 'project' FROM permissions p WHERE p.action IN ('project.view_presence', 'project.edit_collaborative')
UNION ALL
SELECT 'owner', p.id, 'project' FROM permissions p WHERE p.action IN ('project.view_presence', 'project.edit_collaborative')
UNION ALL
SELECT 'member', p.id, 'task' FROM permissions p WHERE p.action IN ('task.view_presence', 'task.edit_collaborative')
UNION ALL
SELECT 'admin', p.id, 'task' FROM permissions p WHERE p.action IN ('task.view_presence', 'task.edit_collaborative')
UNION ALL
SELECT 'owner', p.id, 'task' FROM permissions p WHERE p.action IN ('task.view_presence', 'task.edit_collaborative')
ON CONFLICT (role_name, permission_id, context_type) DO NOTHING; 