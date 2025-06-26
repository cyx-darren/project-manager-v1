-- =====================================================
-- REAL-TIME COLLABORATION UI DATABASE SCHEMA (FINAL)
-- =====================================================
-- This script adds database support for real-time collaboration UI features
-- including user presence, typing indicators, cursor positions, and collaborative editing

-- =====================================================
-- 1. EXTEND EXISTING PERMISSION ENUM
-- =====================================================

-- First, extend the existing permission_action enum to include real-time collaboration actions
ALTER TYPE permission_action ADD VALUE IF NOT EXISTS 'project.view_presence';
ALTER TYPE permission_action ADD VALUE IF NOT EXISTS 'project.edit_collaborative';
ALTER TYPE permission_action ADD VALUE IF NOT EXISTS 'task.view_presence';
ALTER TYPE permission_action ADD VALUE IF NOT EXISTS 'task.edit_collaborative';

-- =====================================================
-- 2. CREATE NEW ENUMS (WITH PROPER ERROR HANDLING)
-- =====================================================

-- User presence status (create only if it doesn't exist)
DO $$ BEGIN
  CREATE TYPE presence_status AS ENUM ('online', 'away', 'busy', 'offline');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Lock status for collaborative editing (create only if it doesn't exist)
DO $$ BEGIN
  CREATE TYPE edit_lock_status AS ENUM ('unlocked', 'soft_lock', 'hard_lock');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- 3. USER PRESENCE SYSTEM
-- =====================================================

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
-- 4. TYPING INDICATORS
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
-- 5. COLLABORATIVE EDITING STATE
-- =====================================================

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
-- 6. REAL-TIME ACTIVITY TRACKING
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

-- =====================================================
-- 7. CURSOR AND SELECTION TRACKING
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
-- 8. COLLABORATIVE ANNOTATIONS
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
-- 9. FUNCTIONS FOR REAL-TIME OPERATIONS
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

-- =====================================================
-- 10. ROW LEVEL SECURITY (RLS) & INDEXES
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

-- Basic policies
CREATE POLICY "Users can view all user presence" ON user_presence FOR SELECT USING (true);
CREATE POLICY "Users can update own presence" ON user_presence FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view entity presence" ON entity_presence FOR SELECT USING (true);
CREATE POLICY "Users can manage own entity presence" ON entity_presence FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view typing indicators" ON typing_indicators FOR SELECT USING (true);
CREATE POLICY "Users can manage own typing indicators" ON typing_indicators FOR ALL USING (auth.uid() = user_id);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_user_presence_user ON user_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_entity_presence_entity ON entity_presence(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_entity ON typing_indicators(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_realtime_activity_recent ON realtime_activity(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_realtime_activity_user ON realtime_activity(user_id, created_at DESC);

-- =====================================================
-- COMPLETED: Real-time Collaboration UI Schema (FINAL)
-- ===================================================== 