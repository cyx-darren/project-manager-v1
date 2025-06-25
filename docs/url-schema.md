# URL Schema Documentation

## Overview

This document describes the URL structure and routing patterns used in the Task Management Application, specifically for project and task navigation.

## Project URLs

### Base Project Navigation

All project-related URLs follow the pattern `/projects/:projectId/:tab` where:

- `:projectId` - Unique identifier for the project (UUID format)
- `:tab` - The active tab/view within the project

#### Supported Tabs

| Tab | URL Pattern | Description |
|-----|-------------|-------------|
| Overview | `/projects/:projectId/overview` | Project dashboard and summary |
| Tasks | `/projects/:projectId/tasks` | Project task list view |
| Team | `/projects/:projectId/team` | Team management and members |
| Calendar | `/projects/:projectId/calendar` | Calendar view of project tasks |
| Board | `/projects/:projectId/board` | Kanban board view |

#### Examples

```
/projects/123e4567-e89b-12d3-a456-426614174000/overview
/projects/123e4567-e89b-12d3-a456-426614174000/tasks
/projects/123e4567-e89b-12d3-a456-426614174000/calendar
```

## Task URLs

### Individual Task Access

Tasks can be accessed directly via URLs that include the task ID. This enables deep linking, sharing, and browser navigation for specific tasks.

#### URL Pattern

```
/projects/:projectId/:tab/tasks/:taskId[?queryParams]
```

Where:
- `:projectId` - Project UUID
- `:tab` - The tab context from which the task is accessed
- `:taskId` - Task UUID or 'new' for task creation

#### Supported Task URL Patterns

| Pattern | Description | Example |
|---------|-------------|---------|
| View/Edit Task | `/projects/:projectId/:tab/tasks/:taskId` | `/projects/123.../tasks/tasks/456...` |
| New Task | `/projects/:projectId/:tab/tasks/new` | `/projects/123.../tasks/tasks/new` |

#### Context-Aware Task URLs

Tasks maintain the context of the tab from which they were accessed:

```
/projects/123.../overview/tasks/456...     # Task from overview tab
/projects/123.../tasks/tasks/456...        # Task from tasks tab  
/projects/123.../calendar/tasks/456...     # Task from calendar tab
/projects/123.../board/tasks/456...        # Task from board tab
```

## Query Parameters

### Task Modal Behavior

| Parameter | Values | Description | Example |
|-----------|--------|-------------|---------|
| `mode` | `view`, `edit` | Task modal display mode | `?mode=view` |
| `new` | `true` | Indicates new task creation | `?new=true` |
| `due_date` | `YYYY-MM-DD` | Pre-fill due date for new tasks | `?due_date=2024-12-25` |

#### Query Parameter Examples

```
# View task in read-only mode
/projects/123.../tasks/tasks/456...?mode=view

# Create new task with pre-filled due date
/projects/123.../calendar/tasks/new?new=true&due_date=2024-12-25

# Edit task (default behavior)
/projects/123.../tasks/tasks/456...?mode=edit
```

## Navigation Behavior

### Browser Integration

- **Back/Forward Buttons**: Fully supported for tab and task navigation
- **Bookmarks**: All URLs are bookmarkable and shareable
- **Direct Access**: Users can navigate directly to any task via URL
- **URL Persistence**: Current state is always reflected in the URL

### User Preferences

- **Tab Preferences**: Last visited tab is remembered per project
- **Auto-Redirect**: Base project URLs redirect to user's preferred tab
- **Context Preservation**: Task URLs preserve the originating tab context

### Error Handling

| Scenario | Behavior |
|----------|----------|
| Invalid Project ID | Redirect to `/projects` with error message |
| Unauthorized Access | Redirect to `/unauthorized` |
| Task Not Found | Redirect to tab view without task, show error toast |
| Invalid Tab | Redirect to user's preferred tab or overview |

## Implementation Details

### Route Configuration

The application uses React Router with a wildcard pattern for project routes:

```typescript
{
  path: 'projects/:projectId/*',
  element: <ProtectedRoute><ProjectDetail /></ProtectedRoute>
}
```

### URL Parsing

The `ProjectDetail` component handles URL parsing internally:

```typescript
// Parse URL segments
const pathSegments = location.pathname.split('/').filter(Boolean)

// Extract tab and task ID
const tab = pathSegments[2] // overview, tasks, etc.
const taskId = pathSegments[4] // when pattern is /:tab/tasks/:taskId
```

### Navigation Helpers

```typescript
// Navigate to task
navigateToTask(taskId: string, mode: 'view' | 'edit' = 'edit')

// Navigate to new task
navigateToNewTask(dueDate?: string)

// Navigate away from task
navigateAwayFromTask()
```

## Best Practices

### URL Construction

1. Always use the navigation helpers instead of manual URL construction
2. Preserve query parameters when switching contexts
3. Use replace navigation for preference updates, push for user actions

### Task Linking

1. Include tab context in task URLs for better user experience
2. Use appropriate query parameters for task modal behavior
3. Provide fallback navigation for invalid task IDs

### Performance Considerations

1. Task modal state is driven by URL changes
2. Debounce rapid URL changes to prevent excessive re-renders
3. Memoize URL parsing functions for performance

## Migration Guide

### From Modal-Only to URL-Driven Tasks

The implementation maintains backward compatibility:

- Existing modal-triggered task interactions continue to work
- New URL-driven behavior is additive
- Components can gradually adopt URL navigation patterns

### Component Updates Required

1. Update task click handlers to use `navigateToTask()`
2. Replace modal state management with URL-driven approach
3. Add support for URL query parameters in task creation flows

## Security Considerations

- All task URLs require authentication via `ProtectedRoute`
- Project access is validated before displaying task content
- Task IDs are validated against project membership
- No sensitive information is exposed in URLs (only UUIDs)

## Future Enhancements

### Potential Additions

1. **Task Comments**: `/projects/:projectId/:tab/tasks/:taskId/comments/:commentId`
2. **Task History**: `/projects/:projectId/:tab/tasks/:taskId/history`
3. **Task Attachments**: `/projects/:projectId/:tab/tasks/:taskId/attachments`
4. **Bulk Operations**: Query parameters for multi-task selection

### URL Shortening

Consider implementing URL shortening for:
- Long task URLs with multiple query parameters
- Sharing URLs in external systems
- Analytics and tracking purposes 