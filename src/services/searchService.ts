import type { SearchResult } from '../contexts/SearchContext'
import { taskService } from './taskService'
import { sidebarService } from './sidebarService'
import { projectService } from './projectService'
import type { Task, Project } from '../types/supabase'

export interface SearchOptions {
  includeProjects?: boolean
  includeTasks?: boolean
  projectId?: string
  userId?: string
  limit?: number
}

class SearchService {
  /**
   * Perform a global search across projects and tasks
   */
  async globalSearch(
    query: string, 
    userId: string, 
    options: SearchOptions = {}
  ): Promise<{ data: SearchResult[] | null; error: any }> {
    try {
      if (!query.trim()) {
        return { data: [], error: null }
      }

      const {
        includeProjects = true,
        includeTasks = true,
        limit = 50
      } = options

      const searchPromises: Promise<any>[] = []
      
      // Search projects if enabled
      if (includeProjects) {
        searchPromises.push(this.searchProjects(query, userId))
      }

      // Search tasks if enabled
      if (includeTasks) {
        searchPromises.push(this.searchTasks(query, options.projectId))
      }

      const results = await Promise.allSettled(searchPromises)
      
      let combinedResults: SearchResult[] = []

      // Process project results
      if (includeProjects && results[0]) {
        if (results[0].status === 'fulfilled') {
          const projectResults = this.transformProjectsToSearchResults(results[0].value.data || [])
          combinedResults = [...combinedResults, ...projectResults]
        }
      }

      // Process task results
      const taskResultIndex = includeProjects ? 1 : 0
      if (includeTasks && results[taskResultIndex]) {
        if (results[taskResultIndex].status === 'fulfilled') {
          const taskResults = await this.transformTasksToSearchResults(results[taskResultIndex].value.data || [])
          combinedResults = [...combinedResults, ...taskResults]
        }
      }

      // Sort by relevance (exact matches first, then by recency)
      combinedResults.sort((a, b) => {
        const aExactMatch = a.title.toLowerCase().includes(query.toLowerCase())
        const bExactMatch = b.title.toLowerCase().includes(query.toLowerCase())
        
        if (aExactMatch && !bExactMatch) return -1
        if (!aExactMatch && bExactMatch) return 1
        
        // Sort by updated_at if both are exact matches or neither
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      })

      // Apply limit
      const limitedResults = combinedResults.slice(0, limit)

      return { data: limitedResults, error: null }
    } catch (error) {
      console.error('Error in global search:', error)
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Search failed' 
      }
    }
  }

  /**
   * Search projects using the sidebar service
   */
  private async searchProjects(query: string, userId: string) {
    return await sidebarService.searchProjects(userId, query)
  }

  /**
   * Search tasks across all projects or within a specific project
   */
  private async searchTasks(query: string, projectId?: string) {
    if (projectId) {
      // Search within specific project
      return await taskService.searchTasks(projectId, query)
    } else {
      // Search across all user projects using the new global search method
      return await taskService.searchTasksGlobal(query)
    }
  }

  /**
   * Transform project data to SearchResult format
   */
  private transformProjectsToSearchResults(projects: any[]): SearchResult[] {
    return projects.map(project => ({
      id: project.id,
      type: 'project' as const,
      title: project.title,
      description: project.description,
      status: project.status,
      created_at: project.created_at,
      updated_at: project.updated_at
    }))
  }

  /**
   * Transform task data to SearchResult format
   */
  private async transformTasksToSearchResults(tasks: Task[]): Promise<SearchResult[]> {
    const results: SearchResult[] = []
    
    for (const task of tasks) {
      // Get project info for each task
      const projectResponse = await projectService.getProjectById(task.project_id)
      const project = projectResponse.success ? projectResponse.data : null
      
      results.push({
        id: task.id,
        type: 'task' as const,
        title: task.title,
        description: task.description || undefined,
        project: project ? {
          id: project.id,
          title: project.title
        } : undefined,
        status: task.status,
        priority: task.priority || undefined,
        due_date: task.due_date || undefined,
        created_at: task.created_at,
        updated_at: task.updated_at
      })
    }
    
    return results
  }

  /**
   * Search within a specific project (both project info and its tasks)
   */
  async searchInProject(
    query: string, 
    projectId: string, 
    userId: string
  ): Promise<{ data: SearchResult[] | null; error: any }> {
    return this.globalSearch(query, userId, {
      includeProjects: false,
      includeTasks: true,
      projectId,
      limit: 25
    })
  }

  /**
   * Search only projects
   */
  async searchProjectsOnly(
    query: string, 
    userId: string
  ): Promise<{ data: SearchResult[] | null; error: any }> {
    return this.globalSearch(query, userId, {
      includeProjects: true,
      includeTasks: false,
      limit: 25
    })
  }
}

export const searchService = new SearchService()
export default searchService 