import React, { useState, useEffect } from 'react'
import { 
  Download,
  Upload,
  FileText,
  Users,
  ChevronDown,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Share2
} from 'lucide-react'
import { ShareButton } from './ShareButton'
import { ShareModal } from './ShareModal'
import { ShareAnalytics } from './ShareAnalytics'

export const DocumentSharingDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'projects' | 'analytics'>('overview')
  const [selectedEntity, setSelectedEntity] = useState<{
    type: 'task' | 'project' | 'attachment'
    id: string
    title: string
  } | null>(null)

  // Demo data
  const demoTasks = [
    { id: 'task-1', title: 'Design System Documentation', status: 'In Progress', assignee: 'Alice' },
    { id: 'task-2', title: 'API Integration Testing', status: 'Review', assignee: 'Bob' },
    { id: 'task-3', title: 'User Feedback Analysis', status: 'Done', assignee: 'Charlie' }
  ]

  const demoProjects = [
    { id: 'project-1', title: 'Mobile App Redesign', members: 8, status: 'Active' },
    { id: 'project-2', title: 'Marketing Campaign Q1', members: 5, status: 'Planning' },
    { id: 'project-3', title: 'Infrastructure Upgrade', members: 12, status: 'Active' }
  ]

  const demoAttachments = [
    { id: 'attachment-1', title: 'Design Mockups.figma', size: '2.4 MB', type: 'Design File' },
    { id: 'attachment-2', title: 'Requirements.pdf', size: '856 KB', type: 'Document' },
    { id: 'attachment-3', title: 'Test Results.xlsx', size: '1.2 MB', type: 'Spreadsheet' }
  ]

  const handleShareClick = (type: 'task' | 'project' | 'attachment', id: string, title: string) => {
    setSelectedEntity({ type, id, title })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Done': return 'bg-green-100 text-green-800'
      case 'In Progress': return 'bg-blue-100 text-blue-800'
      case 'Review': return 'bg-yellow-100 text-yellow-800'
      case 'Active': return 'bg-green-100 text-green-800'
      case 'Planning': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'Design File': return <FileText className="w-5 h-5 text-purple-600" />
      case 'Document': return <FileText className="w-5 h-5 text-red-600" />
      case 'Spreadsheet': return <FileText className="w-5 h-5 text-green-600" />
      default: return <FileText className="w-5 h-5 text-gray-600" />
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden" data-testid="document-sharing-demo">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-4 text-white">
        <div className="flex items-center gap-3">
          <Share2 className="w-6 h-6" />
          <div>
            <h2 className="text-xl font-semibold" data-testid="demo-title">
              Document Sharing System
            </h2>
            <p className="text-violet-100 text-sm mt-1">
              Share documents, manage access, and track engagement
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === 'overview'
              ? 'text-violet-600 border-b-2 border-violet-600 bg-white'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          data-testid="overview-tab"
        >
          <div className="flex items-center justify-center gap-2">
            <Eye className="w-4 h-4" />
            Overview
          </div>
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === 'tasks'
              ? 'text-violet-600 border-b-2 border-violet-600 bg-white'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          data-testid="tasks-tab"
        >
          <div className="flex items-center justify-center gap-2">
            <FileText className="w-4 h-4" />
            Tasks
          </div>
        </button>
        <button
          onClick={() => setActiveTab('projects')}
          className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === 'projects'
              ? 'text-violet-600 border-b-2 border-violet-600 bg-white'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          data-testid="projects-tab"
        >
          <div className="flex items-center justify-center gap-2">
            <FileText className="w-4 h-4" />
            Projects
          </div>
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
            activeTab === 'analytics'
              ? 'text-violet-600 border-b-2 border-violet-600 bg-white'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          data-testid="analytics-tab"
        >
          <div className="flex items-center justify-center gap-2">
            <FileText className="w-4 h-4" />
            Analytics
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6" data-testid="overview-content">
            <div className="text-center">
              <Share2 className="w-16 h-16 text-violet-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Document Sharing Features
              </h3>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Comprehensive sharing system with granular permissions, link sharing, 
                analytics tracking, and secure access controls.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Direct Sharing */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="w-8 h-8 text-blue-600" />
                  <h4 className="text-lg font-semibold text-blue-900">Direct Sharing</h4>
                </div>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                    Share with specific users via email
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                    Granular access levels (view, comment, edit)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                    Email notifications with custom messages
                  </li>
                </ul>
              </div>

              {/* Link Sharing */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="w-8 h-8 text-green-600" />
                  <h4 className="text-lg font-semibold text-green-900">Link Sharing</h4>
                </div>
                <ul className="space-y-2 text-sm text-green-800">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                    Generate shareable links instantly
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                    Password protection options
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                    Expiration date controls
                  </li>
                </ul>
              </div>

              {/* Analytics */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <FileText className="w-8 h-8 text-purple-600" />
                  <h4 className="text-lg font-semibold text-purple-900">Analytics</h4>
                </div>
                <ul className="space-y-2 text-sm text-purple-800">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
                    Track access and engagement
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
                    Detailed activity logs
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-purple-600 rounded-full"></div>
                    Usage insights and reports
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                How to Test Document Sharing
              </h4>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Quick Actions:</h5>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                    <li>Navigate to Tasks, Projects, or Analytics tabs</li>
                    <li>Click any "Share" button to open the sharing modal</li>
                    <li>Test direct sharing with email addresses</li>
                    <li>Create shareable links with different permissions</li>
                    <li>View analytics for shared items</li>
                  </ol>
                </div>
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">Features to Explore:</h5>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                    <li>Access level controls (view, comment, edit)</li>
                    <li>Link expiration and password protection</li>
                    <li>Share management and revocation</li>
                    <li>Activity tracking and analytics</li>
                    <li>Copy-to-clipboard functionality</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="space-y-4" data-testid="tasks-content">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Demo Tasks</h3>
              <span className="text-sm text-gray-500">
                Click "Share" to test task sharing features
              </span>
            </div>

            <div className="grid gap-4">
              {demoTasks.map((task) => (
                <div
                  key={task.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  data-testid={`task-item-${task.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{task.title}</h4>
                      <div className="flex items-center gap-4 mt-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                        <span className="text-sm text-gray-500">
                          Assigned to {task.assignee}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ShareButton
                        entityType="task"
                        entityId={task.id}
                        entityTitle={task.title}
                        variant="secondary"
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Attachments Section */}
            <div className="border-t border-gray-200 pt-6 mt-8">
              <h4 className="text-md font-semibold text-gray-900 mb-4">Task Attachments</h4>
              <div className="grid gap-3">
                {demoAttachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    data-testid={`attachment-item-${attachment.id}`}
                  >
                    <div className="flex items-center gap-3">
                      {getFileIcon(attachment.type)}
                      <div>
                        <p className="font-medium text-gray-900">{attachment.title}</p>
                        <p className="text-sm text-gray-500">{attachment.size} • {attachment.type}</p>
                      </div>
                    </div>
                    <ShareButton
                      entityType="attachment"
                      entityId={attachment.id}
                      entityTitle={attachment.title}
                      variant="icon"
                      size="sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="space-y-4" data-testid="projects-content">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Demo Projects</h3>
              <span className="text-sm text-gray-500">
                Click "Share" to test project sharing features
              </span>
            </div>

            <div className="grid gap-4">
              {demoProjects.map((project) => (
                <div
                  key={project.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  data-testid={`project-item-${project.id}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{project.title}</h4>
                      <div className="flex items-center gap-4 mt-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                          {project.status}
                        </span>
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {project.members} members
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ShareButton
                        entityType="project"
                        entityId={project.id}
                        entityTitle={project.title}
                        variant="secondary"
                        size="sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6" data-testid="analytics-content">
            <div className="text-center">
              <FileText className="w-12 h-12 text-violet-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Sharing Analytics Demo
              </h3>
              <p className="text-gray-600">
                View analytics for any shared task or project
              </p>
            </div>

            {/* Demo Analytics for Task 1 */}
            <ShareAnalytics
              entityType="task"
              entityId="task-1"
              className="mb-6"
            />

            {/* Demo Analytics for Project 1 */}
            <ShareAnalytics
              entityType="project"
              entityId="project-1"
            />
          </div>
        )}
      </div>

      {/* Share Modal */}
      {selectedEntity && (
        <ShareModal
          isOpen={!!selectedEntity}
          onClose={() => setSelectedEntity(null)}
          entityType={selectedEntity.type}
          entityId={selectedEntity.id}
          entityTitle={selectedEntity.title}
        />
      )}
    </div>
  )
} 