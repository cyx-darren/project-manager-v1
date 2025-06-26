-- =====================================================
-- DEFAULT PERMISSIONS DATA
-- =====================================================

-- Insert all permission definitions
INSERT INTO permissions (action, name, description, category) VALUES
-- Project permissions
('project.view', 'View Project', 'Can view project details and tasks', 'project'),
('project.edit', 'Edit Project', 'Can modify project settings and details', 'project'),
('project.delete', 'Delete Project', 'Can permanently delete the project', 'project'),
('project.manage_members', 'Manage Members', 'Can add/remove project members', 'project'),
('project.manage_settings', 'Manage Settings', 'Can modify project settings', 'project'),
('project.archive', 'Archive Project', 'Can archive/restore the project', 'project'),
('project.create_templates', 'Create Templates', 'Can create project templates', 'project'),

-- Task permissions
('task.view', 'View Tasks', 'Can view tasks in the project', 'task'),
('task.create', 'Create Tasks', 'Can create new tasks', 'task'),
('task.edit', 'Edit Tasks', 'Can modify task details', 'task'),
('task.delete', 'Delete Tasks', 'Can delete tasks', 'task'),
('task.assign', 'Assign Tasks', 'Can assign tasks to users', 'task'),
('task.complete', 'Complete Tasks', 'Can mark tasks as complete', 'task'),
('task.comment', 'Comment on Tasks', 'Can add comments to tasks', 'task'),
('task.attach_files', 'Attach Files', 'Can attach files to tasks', 'task'),

-- Team permissions
('team.view', 'View Team', 'Can view team details and members', 'team'),
('team.edit', 'Edit Team', 'Can modify team settings', 'team'),
('team.delete', 'Delete Team', 'Can delete the team', 'team'),
('team.manage_members', 'Manage Team Members', 'Can add/remove team members', 'team'),

-- Workspace permissions
('workspace.view', 'View Workspace', 'Can view workspace details', 'workspace'),
('workspace.edit', 'Edit Workspace', 'Can modify workspace settings', 'workspace'),
('workspace.manage_members', 'Manage Workspace Members', 'Can add/remove workspace members', 'workspace'),
('workspace.create_projects', 'Create Projects', 'Can create new projects in workspace', 'workspace'),
('workspace.manage_billing', 'Manage Billing', 'Can manage workspace billing and subscription', 'workspace')
ON CONFLICT (action) DO NOTHING;

-- Insert default role permissions for project context
WITH project_permissions AS (
  SELECT 
    unnest(ARRAY['owner', 'admin', 'member']) as role_name,
    unnest(ARRAY[
      'project.view,project.edit,project.delete,project.manage_members,project.manage_settings,project.archive,project.create_templates,task.view,task.create,task.edit,task.delete,task.assign,task.complete,task.comment,task.attach_files',
      'project.view,project.edit,project.manage_members,project.manage_settings,project.archive,task.view,task.create,task.edit,task.delete,task.assign,task.complete,task.comment,task.attach_files',
      'project.view,task.view,task.create,task.edit,task.complete,task.comment,task.attach_files'
    ]) as permissions_str
)
INSERT INTO role_permissions (role_name, permission_id, context_type)
SELECT 
  pp.role_name,
  p.id,
  'project'
FROM project_permissions pp
CROSS JOIN LATERAL unnest(string_to_array(pp.permissions_str, ',')) AS perm(action)
JOIN permissions p ON p.action::TEXT = perm.action
ON CONFLICT (role_name, permission_id, context_type) DO NOTHING;

-- Insert default role permissions for workspace context
WITH workspace_permissions AS (
  SELECT 
    unnest(ARRAY['owner', 'admin', 'member', 'billing_manager']) as role_name,
    unnest(ARRAY[
      'workspace.view,workspace.edit,workspace.manage_members,workspace.create_projects,workspace.manage_billing',
      'workspace.view,workspace.edit,workspace.create_projects',
      'workspace.view',
      'workspace.view,workspace.manage_billing'
    ]) as permissions_str
)
INSERT INTO role_permissions (role_name, permission_id, context_type)
SELECT 
  wp.role_name,
  p.id,
  'workspace'
FROM workspace_permissions wp
CROSS JOIN LATERAL unnest(string_to_array(wp.permissions_str, ',')) AS perm(action)
JOIN permissions p ON p.action::TEXT = perm.action
ON CONFLICT (role_name, permission_id, context_type) DO NOTHING;
