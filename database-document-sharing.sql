-- =====================================================
-- DOCUMENT SHARING SYSTEM
-- =====================================================
-- This script adds document sharing functionality for subtask 9.14
-- Run this in Supabase SQL Editor before implementing the document sharing UI

-- =====================================================
-- 1. DOCUMENT SHARING TABLES
-- =====================================================

-- Shared documents tracking
CREATE TABLE IF NOT EXISTS document_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL, -- 'task', 'project', 'attachment'
  entity_id UUID NOT NULL,
  shared_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for public shares
  share_token TEXT UNIQUE, -- For public/link sharing
  access_level TEXT NOT NULL DEFAULT 'view', -- 'view', 'comment', 'edit'
  expires_at TIMESTAMPTZ, -- NULL for no expiration
  password_hash TEXT, -- For password-protected shares
  settings JSONB DEFAULT '{}', -- Additional sharing settings
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ,
  access_count INTEGER DEFAULT 0,
  
  -- Ensure either shared_with user or share_token exists
  CONSTRAINT check_share_target CHECK (
    (shared_with IS NOT NULL AND share_token IS NULL) OR
    (shared_with IS NULL AND share_token IS NOT NULL)
  )
);

-- Share access logs for audit trail
CREATE TABLE IF NOT EXISTS share_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id UUID NOT NULL REFERENCES document_shares(id) ON DELETE CASCADE,
  accessed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL for anonymous access
  ip_address INET,
  user_agent TEXT,
  action TEXT NOT NULL, -- 'view', 'download', 'comment', 'edit'
  accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Share invitations (for pending shares)
CREATE TABLE IF NOT EXISTS share_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  share_id UUID NOT NULL REFERENCES document_shares(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitation_token TEXT UNIQUE NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'expired'
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. SHARING PERMISSIONS AND FUNCTIONS
-- =====================================================

-- Function to generate secure share token
CREATE OR REPLACE FUNCTION generate_share_token() RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64url');
END;
$$ LANGUAGE plpgsql;

-- Function to create document share
CREATE OR REPLACE FUNCTION create_document_share(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_shared_by UUID,
  p_shared_with UUID DEFAULT NULL,
  p_access_level TEXT DEFAULT 'view',
  p_expires_at TIMESTAMPTZ DEFAULT NULL,
  p_password TEXT DEFAULT NULL,
  p_settings JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  share_id UUID;
  share_token TEXT;
  password_hash TEXT;
BEGIN
  -- Generate share token for link sharing (when shared_with is NULL)
  IF p_shared_with IS NULL THEN
    share_token := generate_share_token();
  END IF;
  
  -- Hash password if provided
  IF p_password IS NOT NULL THEN
    password_hash := crypt(p_password, gen_salt('bf'));
  END IF;
  
  -- Create share record
  INSERT INTO document_shares (
    entity_type, entity_id, shared_by, shared_with, share_token,
    access_level, expires_at, password_hash, settings
  ) VALUES (
    p_entity_type, p_entity_id, p_shared_by, p_shared_with, share_token,
    p_access_level, p_expires_at, password_hash, p_settings
  ) RETURNING id INTO share_id;
  
  RETURN share_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate share access
CREATE OR REPLACE FUNCTION validate_share_access(
  p_share_token TEXT,
  p_user_id UUID DEFAULT NULL,
  p_password TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  share_record RECORD;
  result JSONB;
BEGIN
  -- Get share record
  SELECT * INTO share_record
  FROM document_shares
  WHERE share_token = p_share_token;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Share not found');
  END IF;
  
  -- Check expiration
  IF share_record.expires_at IS NOT NULL AND share_record.expires_at < NOW() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Share expired');
  END IF;
  
  -- Check password if required
  IF share_record.password_hash IS NOT NULL THEN
    IF p_password IS NULL OR NOT (share_record.password_hash = crypt(p_password, share_record.password_hash)) THEN
      RETURN jsonb_build_object('valid', false, 'error', 'Invalid password');
    END IF;
  END IF;
  
  -- Update access tracking
  UPDATE document_shares 
  SET last_accessed_at = NOW(), access_count = access_count + 1
  WHERE id = share_record.id;
  
  -- Log access
  INSERT INTO share_access_logs (share_id, accessed_by, action)
  VALUES (share_record.id, p_user_id, 'view');
  
  -- Return share details
  result := jsonb_build_object(
    'valid', true,
    'share_id', share_record.id,
    'entity_type', share_record.entity_type,
    'entity_id', share_record.entity_id,
    'access_level', share_record.access_level,
    'settings', share_record.settings
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send share invitation
CREATE OR REPLACE FUNCTION create_share_invitation(
  p_share_id UUID,
  p_email TEXT,
  p_invited_by UUID,
  p_message TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  invitation_id UUID;
  invitation_token TEXT;
BEGIN
  -- Generate invitation token
  invitation_token := generate_share_token();
  
  -- Create invitation
  INSERT INTO share_invitations (
    share_id, email, invited_by, invitation_token, message
  ) VALUES (
    p_share_id, p_email, p_invited_by, invitation_token, p_message
  ) RETURNING id INTO invitation_id;
  
  RETURN invitation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. INDEXES FOR PERFORMANCE
-- =====================================================

-- Document shares indexes
CREATE INDEX IF NOT EXISTS idx_document_shares_entity ON document_shares(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_document_shares_shared_by ON document_shares(shared_by);
CREATE INDEX IF NOT EXISTS idx_document_shares_shared_with ON document_shares(shared_with);
CREATE INDEX IF NOT EXISTS idx_document_shares_token ON document_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_document_shares_expires ON document_shares(expires_at);

-- Share access logs indexes
CREATE INDEX IF NOT EXISTS idx_share_access_logs_share ON share_access_logs(share_id);
CREATE INDEX IF NOT EXISTS idx_share_access_logs_accessed_by ON share_access_logs(accessed_by);
CREATE INDEX IF NOT EXISTS idx_share_access_logs_accessed_at ON share_access_logs(accessed_at);

-- Share invitations indexes
CREATE INDEX IF NOT EXISTS idx_share_invitations_share ON share_invitations(share_id);
CREATE INDEX IF NOT EXISTS idx_share_invitations_email ON share_invitations(email);
CREATE INDEX IF NOT EXISTS idx_share_invitations_token ON share_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_share_invitations_status ON share_invitations(status);

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all sharing tables
ALTER TABLE document_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_invitations ENABLE ROW LEVEL SECURITY;

-- Document shares policies
CREATE POLICY "Users can view shares they created" ON document_shares
  FOR SELECT USING (shared_by = auth.uid());

CREATE POLICY "Users can view shares made to them" ON document_shares
  FOR SELECT USING (shared_with = auth.uid());

CREATE POLICY "Users can create shares" ON document_shares
  FOR INSERT WITH CHECK (shared_by = auth.uid());

CREATE POLICY "Users can update their own shares" ON document_shares
  FOR UPDATE USING (shared_by = auth.uid());

CREATE POLICY "Users can delete their own shares" ON document_shares
  FOR DELETE USING (shared_by = auth.uid());

-- Share access logs policies
CREATE POLICY "Users can view access logs for their shares" ON share_access_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM document_shares ds 
      WHERE ds.id = share_access_logs.share_id 
      AND ds.shared_by = auth.uid()
    )
  );

CREATE POLICY "System can insert access logs" ON share_access_logs
  FOR INSERT WITH CHECK (true);

-- Share invitations policies
CREATE POLICY "Users can view invitations they sent" ON share_invitations
  FOR SELECT USING (invited_by = auth.uid());

CREATE POLICY "Users can view invitations to their email" ON share_invitations
  FOR SELECT USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Users can create invitations for their shares" ON share_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM document_shares ds 
      WHERE ds.id = share_invitations.share_id 
      AND ds.shared_by = auth.uid()
    )
  );

CREATE POLICY "Users can update invitations they sent" ON share_invitations
  FOR UPDATE USING (invited_by = auth.uid());

-- =====================================================
-- 5. TRIGGERS FOR AUTOMATIC CLEANUP
-- =====================================================

-- Function to clean up expired shares
CREATE OR REPLACE FUNCTION cleanup_expired_shares() RETURNS void AS $$
BEGIN
  -- Delete expired shares
  DELETE FROM document_shares 
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
  
  -- Delete expired invitations
  DELETE FROM share_invitations 
  WHERE expires_at < NOW() AND status = 'pending';
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_document_shares_updated_at
  BEFORE UPDATE ON document_shares
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMPLETED: Document Sharing System
-- =====================================================
-- Tables created:
-- - document_shares: Main sharing records
-- - share_access_logs: Audit trail for share access
-- - share_invitations: Pending share invitations
--
-- Functions created:
-- - generate_share_token(): Generate secure share tokens
-- - create_document_share(): Create new document shares
-- - validate_share_access(): Validate and log share access
-- - create_share_invitation(): Send share invitations
-- - cleanup_expired_shares(): Clean up expired shares
--
-- Ready for UI implementation in subtask 9.14
-- ===================================================== 