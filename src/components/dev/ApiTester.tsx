import React, { useState } from 'react'
import { projectService, taskService, testSupabaseConnection, collaborationService } from '../../services'
import type { Project, Task } from '../../types/supabase'
import { runCollaborationTests, testCollaborationFeatures } from '../../utils/collaborationTest'
import { RealtimeDemo } from '../realtime/RealtimeDemo'
import ConflictResolutionDemo from '../conflict/ConflictResolutionDemo'
import { UserManagementDemo } from '../user-management/UserManagementDemo'
import { DocumentSharingDemo } from '../document-sharing/DocumentSharingDemo'

const ApiTester: React.FC = () => {
  const [results, setResults] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [showRealtimeDemo, setShowRealtimeDemo] = useState(false)
  const [showConflictDemo, setShowConflictDemo] = useState(false)
  const [showUserManagementDemo, setShowUserManagementDemo] = useState(false)
  const [showDocumentSharingDemo, setShowDocumentSharingDemo] = useState(false)

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testConnection = async () => {
    setLoading(true)
    try {
      const result = await testSupabaseConnection()
      addResult(`Connection test: ${result.success ? '✅' : '❌'} ${result.message}`)
    } catch (error) {
      addResult(`❌ Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    setLoading(false)
  }

  const testGetProjects = async () => {
    setLoading(true)
    try {
      const result = await projectService.getProjects()
      if (result.success && result.data) {
        setProjects(result.data)
        addResult(`✅ Projects fetched: ${result.data.length} projects found`)
      } else {
        addResult(`❌ Failed to fetch projects: ${result.error}`)
      }
    } catch (error) {
      addResult(`❌ Projects test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    setLoading(false)
  }

  const testGetTasks = async () => {
    if (projects.length === 0) {
      addResult('❌ No projects available to test tasks')
      return
    }

    setLoading(true)
    try {
      const firstProject = projects[0]
      const result = await taskService.getTasksByProject(firstProject.id)
      if (result.success && result.data) {
        setTasks(result.data)
        addResult(`✅ Tasks fetched for "${firstProject.title}": ${result.data.length} tasks found`)
      } else {
        addResult(`❌ Failed to fetch tasks: ${result.error}`)
      }
    } catch (error) {
      addResult(`❌ Tasks test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    setLoading(false)
  }

  const testCreateProject = async () => {
    setLoading(true)
    try {
      const result = await projectService.createProject({
        title: `Test Project ${Date.now()}`,
        description: 'This is a test project created by the API tester',
        status: 'active'
      })
      
      if (result.success && result.data) {
        addResult(`✅ Project created: "${result.data.title}" (ID: ${result.data.id})`)
        // Refresh projects list
        await testGetProjects()
      } else {
        addResult(`❌ Failed to create project: ${result.error}`)
      }
    } catch (error) {
      addResult(`❌ Create project test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    setLoading(false)
  }

  // New collaboration tests
  const testCollaborationAPI = async () => {
    setLoading(true)
    addResult('🤝 Starting Collaboration API tests...')
    
    try {
      // Capture console.log output
      const originalLog = console.log
      const logMessages: string[] = []
      console.log = (...args) => {
        logMessages.push(args.join(' '))
        originalLog(...args)
      }
      
      await runCollaborationTests()
      
      // Restore console.log
      console.log = originalLog
      
      // Add captured messages to results
      logMessages.forEach(msg => addResult(msg))
      
    } catch (error) {
      addResult(`❌ Collaboration tests failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    setLoading(false)
  }

  const testCollaborationWithProject = async () => {
    if (projects.length === 0) {
      addResult('❌ No projects available for collaboration testing')
      return
    }

    setLoading(true)
    addResult('🤝 Testing collaboration features with real project...')
    
    try {
      const testProject = projects.find(p => p.title.includes('Demo')) || projects[0]
      
      // Capture console.log output
      const originalLog = console.log
      const logMessages: string[] = []
      console.log = (...args) => {
        logMessages.push(args.join(' '))
        originalLog(...args)
      }
      
      await testCollaborationFeatures(testProject.id)
      
      // Restore console.log
      console.log = originalLog
      
      // Add captured messages to results
      logMessages.forEach(msg => addResult(msg))
      
    } catch (error) {
      addResult(`❌ Project collaboration tests failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    setLoading(false)
  }

  const runAllTests = async () => {
    setResults([])
    addResult('🚀 Starting comprehensive API tests...')
    
    await testConnection()
    await new Promise(resolve => setTimeout(resolve, 500)) // Small delay
    
    await testGetProjects()
    await new Promise(resolve => setTimeout(resolve, 500))
    
    await testGetTasks()
    await new Promise(resolve => setTimeout(resolve, 500))
    
    await testCreateProject()
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Add collaboration tests to the full test suite
    await testCollaborationAPI()
    await new Promise(resolve => setTimeout(resolve, 500))
    
    await testCollaborationWithProject()
    
    addResult('🎉 All tests completed!')
  }

  const clearResults = () => {
    setResults([])
    setProjects([])
    setTasks([])
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">API Services Tester</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Test Controls */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Test Controls</h2>
          
          <div className="space-y-2">
            <button
              onClick={testConnection}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Test Connection
            </button>
            
            <button
              onClick={testGetProjects}
              disabled={loading}
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              Get Projects
            </button>
            
            <button
              onClick={testGetTasks}
              disabled={loading || projects.length === 0}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
            >
              Get Tasks
            </button>
            
            <button
              onClick={testCreateProject}
              disabled={loading}
              className="w-full px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
            >
              Create Test Project
            </button>
            
            <button
              onClick={testCollaborationAPI}
              disabled={loading}
              className="w-full px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700 disabled:opacity-50"
            >
              Test Collaboration API
            </button>
            
            <button
              onClick={testCollaborationWithProject}
              disabled={loading || projects.length === 0}
              className="w-full px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700 disabled:opacity-50"
            >
              Test Project Collaboration
            </button>
            
            <hr className="my-4" />
            
            <button
              onClick={runAllTests}
              disabled={loading}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 font-semibold"
            >
              Run All Tests
            </button>
            
            <button
              onClick={clearResults}
              disabled={loading}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
            >
              Clear Results
            </button>
            
            <hr className="my-4" />
            
            <button
              onClick={() => setShowRealtimeDemo(!showRealtimeDemo)}
              className="w-full px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 font-semibold"
            >
              {showRealtimeDemo ? 'Hide' : 'Show'} Real-time Demo
            </button>
            
            <button
              onClick={() => setShowConflictDemo(!showConflictDemo)}
              className="w-full px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 font-semibold"
            >
              {showConflictDemo ? 'Hide' : 'Show'} Conflict Resolution Demo
            </button>
            
            <button
              onClick={() => setShowUserManagementDemo(!showUserManagementDemo)}
              className="w-full px-4 py-2 bg-violet-600 text-white rounded hover:bg-violet-700 font-semibold"
              data-testid="user-management-demo-button"
            >
              {showUserManagementDemo ? 'Hide' : 'Show'} User Management Demo
            </button>
            
            <button
              onClick={() => setShowDocumentSharingDemo(!showDocumentSharingDemo)}
              className="w-full px-4 py-2 bg-rose-600 text-white rounded hover:bg-rose-700 font-semibold"
              data-testid="document-sharing-demo-button"
            >
              {showDocumentSharingDemo ? 'Hide' : 'Show'} Document Sharing Demo
            </button>
          </div>
        </div>

        {/* Results */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Test Results</h2>
          
          <div className="bg-gray-100 p-4 rounded-lg h-96 overflow-y-auto">
            {loading && (
              <div className="text-blue-600 font-semibold">🔄 Running test...</div>
            )}
            
            {results.length === 0 && !loading && (
              <div className="text-gray-500 italic">No tests run yet. Click a test button to start.</div>
            )}
            
            {results.map((result, index) => (
              <div key={index} className="text-sm font-mono mb-1">
                {result}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Data Display */}
      {(projects.length > 0 || tasks.length > 0) && (
        <div className="mt-6 space-y-4">
          {projects.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Projects ({projects.length})</h3>
              <div className="bg-white border rounded-lg p-4 max-h-40 overflow-y-auto">
                {projects.map(project => (
                  <div key={project.id} className="text-sm border-b py-2">
                    <strong>{project.title}</strong> - {project.status}
                    <br />
                    <span className="text-gray-600">{project.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tasks.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Tasks ({tasks.length})</h3>
              <div className="bg-white border rounded-lg p-4 max-h-40 overflow-y-auto">
                {tasks.map(task => (
                  <div key={task.id} className="text-sm border-b py-2">
                    <strong>{task.title}</strong> - {task.status}
                    <br />
                    <span className="text-gray-600">{task.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Real-time Demo */}
      {showRealtimeDemo && (
        <div className="mt-8">
          <RealtimeDemo />
        </div>
      )}
      
      {/* Conflict Resolution Demo */}
      {showConflictDemo && (
        <div className="mt-8">
          <ConflictResolutionDemo />
        </div>
      )}
      
      {/* User Management Demo */}
      {showUserManagementDemo && (
        <div className="mt-8">
          <UserManagementDemo />
        </div>
      )}
      
      {/* Document Sharing Demo */}
      {showDocumentSharingDemo && (
        <div className="mt-8">
          <DocumentSharingDemo />
        </div>
      )}
    </div>
  )
}

export default ApiTester 