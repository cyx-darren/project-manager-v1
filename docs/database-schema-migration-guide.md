# Database Schema Migration Guide

## Overview
This guide provides step-by-step instructions for applying the enhanced database schema for the Asana clone project. The migration adds comprehensive project management functionality while maintaining compatibility with existing data.

## Prerequisites
- Access to your Supabase project dashboard
- Admin privileges on the database
- Backup of existing data (recommended)

## Migration Steps

### Step 1: Apply the Migration SQL
Copy and paste the contents of `database-schema-enhancement.sql` into your Supabase SQL Editor and execute it.

**Important:** The script uses `IF NOT EXISTS` clauses, so it's safe to run multiple times.

### Step 2: Verify Tables Created
After running the migration, verify these new tables exist:

1. ✅ **subtasks** - Task breakdown functionality
2. ✅ **task_assignments** - Many-to-many user-task relationships  
3. ✅ **teams** - Team organization
4. ✅ **team_members** - Team membership
5. ✅ **project_invitations** - Email-based project invites
6. ✅ **activity_logs** - Change tracking and audit trail
7. ✅ **comments** - Discussion system for tasks/projects
8. ✅ **attachments** - File attachment support

### Step 3: Verify Enhanced Columns
Check that these columns were added to existing tables:

**Projects table enhancements:**
- `status` (project_status enum)
- `color` (TEXT)
- `is_template` (BOOLEAN)

**Tasks table enhancements:**
- `priority` (priority_level enum)
- `order_index` (INTEGER)
- `estimated_hours` (DECIMAL)
- `actual_hours` (DECIMAL)
- `parent_task_id` (UUID)

### Step 4: Verify Custom Types
Ensure these custom types were created:
- `priority_level` ('low', 'medium', 'high', 'urgent')
- `activity_action` (various action types)
- `project_status` ('active', 'archived', 'completed', 'template')
- `team_role` ('owner', 'admin', 'member')

### Step 5: Test RLS Policies
Verify that Row Level Security is enabled and policies are working:

1. Check that all new tables have RLS enabled
2. Test that users can only access data they have permissions for
3. Verify that project members can access project-related data

### Step 6: Verify Indexes
Confirm that performance indexes were created for:
- Foreign key relationships
- Frequently queried columns
- Composite indexes for complex queries

## Schema Relationship Overview

```
auth.users (Supabase Auth)
    ↓
projects ← project_members → teams ← team_members
    ↓           ↓                        ↓
  tasks ← task_assignments          (team structure)
    ↓
subtasks

Cross-cutting tables:
- project_invitations (email invites)
- activity_logs (audit trail)
- comments (discussions)
- attachments (file uploads)
```

## Key Features Added

### 1. Hierarchical Task Structure
- **Subtasks**: Break down complex tasks into manageable pieces
- **Parent Tasks**: Optional hierarchical task relationships
- **Order Management**: Custom ordering within projects

### 2. Advanced User Management
- **Teams**: Organize users into teams
- **Multiple Assignments**: Tasks can have multiple assignees
- **Role-Based Access**: Fine-grained permissions per project

### 3. Collaboration Features
- **Comments**: Discussion threads on tasks and projects
- **Activity Logs**: Complete audit trail of changes
- **File Attachments**: Support for file uploads

### 4. Project Organization
- **Project Status**: Active, archived, completed, template
- **Color Coding**: Visual organization
- **Templates**: Reusable project structures

### 5. Invitation System
- **Email Invites**: Invite users by email with tokens
- **Role Assignment**: Set roles during invitation
- **Expiration**: Time-limited invitation tokens

## Helper Functions Available

### 1. `user_has_project_access(project_uuid, user_uuid)`
Check if a user has access to a specific project.

### 2. `get_user_project_role(project_uuid, user_uuid)`
Get the user's role within a specific project.

### 3. `log_activity(user_id, project_id, entity_type, entity_id, action, details)`
Log an activity for audit trail purposes.

## Security Considerations

### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only access data they have permissions for
- Project-based access control throughout

### Data Integrity
- Foreign key constraints maintain referential integrity
- Cascade deletes prevent orphaned records
- Unique constraints prevent duplicate relationships

## Performance Optimizations

### Indexes Created
- All foreign keys are indexed
- Frequently queried columns have dedicated indexes
- Composite indexes for complex query patterns

### Query Optimization
- Use the helper functions for common access checks
- Leverage indexes for filtering and sorting
- Consider materialized views for complex aggregations

## Troubleshooting

### Common Issues

1. **Migration Fails**: Check for existing conflicting data types or tables
2. **RLS Blocks Access**: Verify user is properly added to project_members
3. **Performance Issues**: Ensure indexes are created and queries use them

### Rollback Plan

If you need to rollback the migration:

```sql
-- Drop new tables (in reverse dependency order)
DROP TABLE IF EXISTS attachments CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS project_invitations CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS task_assignments CASCADE;
DROP TABLE IF EXISTS subtasks CASCADE;

-- Remove added columns
ALTER TABLE projects DROP COLUMN IF EXISTS status;
ALTER TABLE projects DROP COLUMN IF EXISTS color;
ALTER TABLE projects DROP COLUMN IF EXISTS is_template;

ALTER TABLE tasks DROP COLUMN IF EXISTS priority;
ALTER TABLE tasks DROP COLUMN IF EXISTS order_index;
ALTER TABLE tasks DROP COLUMN IF EXISTS estimated_hours;
ALTER TABLE tasks DROP COLUMN IF EXISTS actual_hours;
ALTER TABLE tasks DROP COLUMN IF EXISTS parent_task_id;

-- Drop custom types
DROP TYPE IF EXISTS team_role CASCADE;
DROP TYPE IF EXISTS project_status CASCADE;
DROP TYPE IF EXISTS activity_action CASCADE;
DROP TYPE IF EXISTS priority_level CASCADE;
```

## Next Steps

After successfully applying this migration:

1. **Update TypeScript Types**: Create interfaces matching the new schema
2. **Create API Services**: Build services to interact with new tables
3. **Test Data Access**: Verify RLS policies work as expected
4. **Performance Testing**: Monitor query performance with real data
5. **Documentation**: Update API documentation with new endpoints

## Support

If you encounter issues:
1. Check Supabase logs for detailed error messages
2. Verify user permissions in the Supabase dashboard
3. Test RLS policies with different user roles
4. Review the migration script for any missed dependencies 