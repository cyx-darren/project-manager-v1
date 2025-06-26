-- =====================================================
-- VERIFICATION QUERIES FOR MULTI-USER COLLABORATION
-- =====================================================

-- 1. VERIFY CUSTOM TYPES EXIST
-- =====================================================

-- Check if permission_action enum exists and show all values
SELECT 
  t.typname as type_name,
  e.enumlabel as enum_value,
  e.enumsortorder as sort_order
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE t.typname = 'permission_action'
ORDER BY e.enumsortorder;

-- Check if workspace_role enum exists and show all values
SELECT 
  t.typname as type_name,
  e.enumlabel as enum_value,
  e.enumsortorder as sort_order
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE t.typname = 'workspace_role'
ORDER BY e.enumsortorder;

-- Alternative: List all custom enum types in public schema
SELECT 
  t.typname as type_name,
  array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'public' 
  AND t.typname IN ('permission_action', 'workspace_role')
GROUP BY t.typname;

-- 2. VERIFY TABLES EXIST
-- =====================================================

-- Check if all new tables exist
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'permissions', 
    'role_permissions', 
    'custom_permissions',
    'document_versions',
    'version_history', 
    'workspaces',
    'workspace_members'
  )
ORDER BY table_name;

-- Check table structure for key tables
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('permissions', 'workspaces', 'workspace_members')
ORDER BY table_name, ordinal_position;

-- 3. VERIFY FUNCTIONS EXIST
-- =====================================================

-- Check if all helper functions exist
SELECT 
  routine_name as function_name,
  routine_type,
  data_type as return_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'user_has_permission',
    'create_document_version', 
    'get_user_workspace_role',
    'create_default_workspace',
    'anonymize_user_data'
  )
ORDER BY routine_name;

-- Alternative: Check functions with their parameters
SELECT 
  p.proname as function_name,
  pg_get_function_result(p.oid) as return_type,
  pg_get_function_arguments(p.oid) as parameters
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'user_has_permission',
    'create_document_version', 
    'get_user_workspace_role',
    'create_default_workspace',
    'anonymize_user_data'
  )
ORDER BY p.proname;

-- 4. VERIFY DATA WAS INSERTED
-- =====================================================

-- Check if permissions were inserted
SELECT 
  category,
  COUNT(*) as permission_count
FROM permissions 
GROUP BY category
ORDER BY category;

-- Check if role permissions were inserted
SELECT 
  context_type,
  role_name,
  COUNT(*) as permission_count
FROM role_permissions rp
GROUP BY context_type, role_name
ORDER BY context_type, role_name;

-- Show sample permissions data
SELECT 
  p.category,
  p.action,
  p.name,
  p.description
FROM permissions p
ORDER BY p.category, p.action
LIMIT 10;

-- 5. VERIFY INDEXES EXIST
-- =====================================================

-- Check if indexes were created
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND (
    indexname LIKE 'idx_role_permissions%' OR
    indexname LIKE 'idx_custom_permissions%' OR
    indexname LIKE 'idx_document_versions%' OR
    indexname LIKE 'idx_workspace%'
  )
ORDER BY tablename, indexname;

-- 6. VERIFY WORKSPACE_ID COLUMN ADDED TO PROJECTS
-- =====================================================

-- Check if workspace_id column was added to projects table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'projects'
  AND column_name = 'workspace_id';

-- 7. TEST FUNCTION EXECUTION (SAFE TESTS)
-- =====================================================

-- Test if user_has_permission function can be called (will return false for non-existent data)
SELECT user_has_permission(
  '00000000-0000-0000-0000-000000000000'::uuid,
  'project.view'::permission_action,
  'project',
  '00000000-0000-0000-0000-000000000000'::uuid
) as test_permission_function;

-- Test if create_default_workspace function exists (don't actually call it)
SELECT 
  p.proname as function_name,
  'Function exists and callable' as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'create_default_workspace';
