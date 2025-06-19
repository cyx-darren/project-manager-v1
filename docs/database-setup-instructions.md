# Database Schema Setup Instructions

## Overview
Since the Supabase MCP is currently in read-only mode (`supabase_read_only_user`), we need to execute the database schema setup through the Supabase Dashboard.

## Steps to Execute

### 1. Access Supabase Dashboard
1. Open your browser and go to: **https://supabase.com/dashboard**
2. Navigate to your project: **https://qdazqudzhzuqocsnwtry.supabase.co**
3. Click on "SQL Editor" in the left sidebar

### 2. Execute the Schema Setup
1. Copy the entire contents of `database-setup.sql` 
2. Paste it into the SQL Editor
3. Click "Run" to execute the script

### 3. Verify Setup
The script includes verification queries at the end that will show:
- Tables created: `projects`, `project_members`, `tasks`
- Enum types created: `task_status`, `member_role`
- Indexes created for performance optimization

## What This Script Creates

### Tables
- **projects**: Store project information with owner references
- **project_members**: Handle multi-user project access with roles
- **tasks**: Store task data with status, assignments, and project relationships

### Security Features
- **Row Level Security (RLS)**: Enabled on all tables
- **Policies**: Comprehensive access control based on user roles
- **Foreign Key Constraints**: Ensure data integrity

### Performance Features
- **Indexes**: Optimized for common query patterns
- **Triggers**: Automatic `updated_at` timestamp updates

## Next Steps
After executing the script, we can:
1. Verify the schema using the Supabase MCP (read-only access)
2. Test authentication and user creation
3. Begin implementing the frontend integration with the database

## Troubleshooting
- If you get permission errors, ensure you're logged in as the project owner
- If tables already exist, drop them first or modify the script to use `IF NOT EXISTS`
- Check the Supabase logs for any specific error details 