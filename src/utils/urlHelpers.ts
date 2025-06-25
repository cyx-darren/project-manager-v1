/**
 * URL generation utilities for consistent task and project navigation
 */

export type TabType = 'overview' | 'tasks' | 'team' | 'calendar' | 'board'
export type TaskMode = 'view' | 'edit'

/**
 * Generate a URL for a specific project tab
 */
export function generateProjectTabUrl(projectId: string, tab: TabType): string {
  return `/projects/${projectId}/${tab}`
}

/**
 * Generate a URL for a specific task within a project tab
 */
export function generateTaskUrl(
  projectId: string, 
  tab: TabType, 
  taskId: string, 
  options?: {
    mode?: TaskMode
    queryParams?: Record<string, string>
  }
): string {
  const baseUrl = `/projects/${projectId}/${tab}/${taskId}`
  const searchParams = new URLSearchParams()
  
  // Add mode parameter if specified and not 'edit' (default)
  if (options?.mode && options.mode !== 'edit') {
    searchParams.set('mode', options.mode)
  }
  
  // Add any additional query parameters
  if (options?.queryParams) {
    Object.entries(options.queryParams).forEach(([key, value]) => {
      searchParams.set(key, value)
    })
  }
  
  const queryString = searchParams.toString()
  return queryString ? `${baseUrl}?${queryString}` : baseUrl
}

/**
 * Generate a URL for creating a new task within a project tab
 */
export function generateNewTaskUrl(
  projectId: string, 
  tab: TabType, 
  options?: {
    dueDate?: string
    queryParams?: Record<string, string>
  }
): string {
  const baseUrl = `/projects/${projectId}/${tab}/new`
  const searchParams = new URLSearchParams()
  
  // Always set new=true for new task creation
  searchParams.set('new', 'true')
  
  // Add due date if specified
  if (options?.dueDate) {
    searchParams.set('due_date', options.dueDate)
  }
  
  // Add any additional query parameters
  if (options?.queryParams) {
    Object.entries(options.queryParams).forEach(([key, value]) => {
      searchParams.set(key, value)
    })
  }
  
  const queryString = searchParams.toString()
  return `${baseUrl}?${queryString}`
}

/**
 * Parse URL segments to extract project ID, tab, and task ID
 */
export function parseProjectUrl(pathname: string): {
  projectId?: string
  tab?: TabType
  taskId?: string
  isNewTask?: boolean
} {
  const pathSegments = pathname.split('/').filter(Boolean)
  
  // Expected patterns:
  // /projects/:projectId/:tab
  // /projects/:projectId/:tab/:taskId
  
  const result: ReturnType<typeof parseProjectUrl> = {}
  
  if (pathSegments.length >= 2 && pathSegments[0] === 'projects') {
    result.projectId = pathSegments[1]
  }
  
  if (pathSegments.length >= 3) {
    const tabSegment = pathSegments[2]
    if (['overview', 'tasks', 'team', 'calendar', 'board'].includes(tabSegment)) {
      result.tab = tabSegment as TabType
    }
  }
  
  // Check for task ID in URL pattern: /:tab/:taskId
  if (pathSegments.length >= 4) {
    const taskIdSegment = pathSegments[3]
    if (taskIdSegment === 'new') {
      result.isNewTask = true
    } else if (taskIdSegment.length > 0) {
      result.taskId = taskIdSegment
    }
  }
  
  return result
}

/**
 * Check if a URL is a task URL
 */
export function isTaskUrl(pathname: string): boolean {
  const { taskId, isNewTask } = parseProjectUrl(pathname)
  return !!(taskId || isNewTask)
}

/**
 * Get the project tab URL from a task URL (removes task-specific segments)
 */
export function getProjectTabUrlFromTaskUrl(pathname: string): string | null {
  const { projectId, tab } = parseProjectUrl(pathname)
  
  if (projectId && tab) {
    return generateProjectTabUrl(projectId, tab)
  }
  
  return null
}

/**
 * Preserve query parameters when navigating between URLs
 */
export function preserveQueryParams(
  newUrl: string, 
  currentSearch: string, 
  preserveKeys?: string[]
): string {
  if (!currentSearch) return newUrl
  
  const currentParams = new URLSearchParams(currentSearch)
  const [baseUrl, existingQuery] = newUrl.split('?')
  const newParams = new URLSearchParams(existingQuery || '')
  
  // If preserveKeys is specified, only preserve those keys
  if (preserveKeys) {
    preserveKeys.forEach(key => {
      const value = currentParams.get(key)
      if (value) {
        newParams.set(key, value)
      }
    })
  } else {
    // Preserve all current params that don't conflict with new ones
    currentParams.forEach((value, key) => {
      if (!newParams.has(key)) {
        newParams.set(key, value)
      }
    })
  }
  
  const queryString = newParams.toString()
  return queryString ? `${baseUrl}?${queryString}` : baseUrl
} 