-- =====================================================
-- MULTI-USER COLLABORATION ENHANCEMENT MIGRATION
-- =====================================================
-- This script adds advanced multi-user collaboration features
-- including granular permissions, document versioning, and workspace management

-- =====================================================
-- 1. GRANULAR PERMISSIONS SYSTEM
-- =====================================================

-- Define granular permission actions
CREATE TYPE permission_action AS ENUM (
  -- Project-level permissions
  'project.view', 'project.edit', 'project.delete', 'project.manage_members',
  'project.manage_settings', 'project.archive', 'project.create_templates',
  
  -- Task-level permissions  
  'task.view', 'task.create', 'task.edit', 'task.delete', 'task.assign',
  'task.complete', 'task.comment', 'task.attach_files',
  
  -- Team-level permissions
  'team.view', 'team.edit', 'team.delete', 'team.manage_members',
  
  -- Workspace-level permissions
  'workspace.view', 'workspace.edit', 'workspace.manage_members',
  'workspace.create_projects', 'workspace.manage_billing'
);

-- Permissions catalog
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action permission_action NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Role permissions mapping
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name TEXT NOT NULL, -- 'owner', 'admin', 'member', etc.
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  context_type TEXT NOT NULL, -- 'project', 'team', 'workspace'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role_name, permission_id, context_type)
);

-- Custom user permissions (overrides)
CREATE TABLE IF NOT EXISTS custom_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  context_type TEXT NOT NULL, -- 'project', 'team', 'workspace'
  context_id UUID NOT NULL, -- project_id, team_id, workspace_id
  granted BOOLEAN DEFAULT TRUE, -- true = grant, false = revoke
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, permission_id, context_type, context_id)
);

-- =====================================================
-- 2. DOCUMENT VERSIONING SYSTEM
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
-- 3. WORKSPACE MANAGEMENT (MULTI-TENANT)
-- =====================================================

-- Workspaces for multi-tenant organization
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  subscription_tier TEXT DEFAULT 'free', -- 'free', 'pro', 'enterprise'
  subscription_expires_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workspace member roles
CREATE TYPE workspace_role AS ENUM ('owner', 'admin', 'member', 'billing_manager');

-- Workspace membership
CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role workspace_role DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- Link projects to workspaces
ALTER TABLE projects ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

-- =====================================================
-- 4. INDEXES FOR PERFORMANCE
-- =====================================================

-- Permission system indexes
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_name);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_custom_permissions_user ON custom_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_permissions_context ON custom_permissions(context_type, context_id);

-- Versioning indexes
CREATE INDEX IF NOT EXISTS idx_document_versions_entity ON document_versions(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_created ON document_versions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_version_history_version ON version_history(version_id);

-- Workspace indexes
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_workspace ON projects(workspace_id);

-- =====================================================
-- COMPLETED: Multi-User Collaboration Schema
-- =====================================================
