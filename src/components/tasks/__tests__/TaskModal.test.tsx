import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TaskModal from '../TaskModal'
import { renderWithProviders } from '../../../test/setup'
import type { Task } from '../../../types/supabase'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../../../contexts/AuthContext'
import { ToastProvider } from '../../../contexts/ToastContext'
import { ProjectProvider } from '../../../contexts/ProjectContext'
import { TaskProvider } from '../../../contexts/TaskContext'

// Mock all the contexts and services
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User'
    },
    isAuthenticated: true,
    loading: false
  })
}))

vi.mock('../../../contexts/TaskContext', () => ({
  useTaskContext: () => ({
    createTask: vi.fn().mockResolvedValue({
      id: 'task-1',
      title: 'Test Task',
      description: 'Test description',
      status: 'todo',
      priority: 'medium',
      project_id: 'project-1',
      created_by: 'user-1',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      assignee_id: null,
      due_date: null,
      estimated_hours: null,
      actual_hours: null,
      order_index: 0,
      parent_task_id: null
    }),
    updateTask: vi.fn().mockResolvedValue(true),
    tasks: [],
    loading: false,
    error: null
  })
}))

vi.mock('../../../services/teamService', () => ({
  teamService: {
    getTeamMembers: vi.fn().mockResolvedValue({
      success: true,
      data: [],
      error: null
    })
  }
}))

// Mock Supabase
vi.mock('../../../services/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null }))
      })),
      insert: vi.fn(() => Promise.resolve({ data: [], error: null })),
      update: vi.fn(() => Promise.resolve({ data: [], error: null })),
      delete: vi.fn(() => Promise.resolve({ data: [], error: null }))
    }))
  }
}))

// Test data
const mockTask: Task = {
  id: 'task-1',
  title: 'Test Task',
  description: 'Test description',
  status: 'todo',
  priority: 'medium',
  project_id: 'project-1',
  created_by: 'user-1',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  assignee_id: null,
  due_date: null,
  estimated_hours: null,
  actual_hours: null,
  order_index: 0,
  parent_task_id: null,
  column_id: null
}

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onTaskCreated: vi.fn(),
  projectId: 'project-1',
  task: null,
  mode: 'edit' as const
}

const renderTaskModal = (props = {}) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <ProjectProvider>
            <TaskProvider>
              <TaskModal
                {...defaultProps}
                {...props}
              />
            </TaskProvider>
          </ProjectProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

describe('TaskModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Task Creation Mode', () => {
    it('should render create task form', () => {
      renderWithProviders(<TaskModal {...defaultProps} />)

      expect(screen.getByText('Create New Task')).toBeInTheDocument()
      expect(screen.getByRole('textbox', { name: /task title/i })).toBeInTheDocument()
      expect(screen.getByRole('textbox', { name: /description/i })).toBeInTheDocument()
      expect(screen.getByRole('combobox', { name: /priority/i })).toBeInTheDocument()
      expect(screen.getByRole('combobox', { name: /status/i })).toBeInTheDocument()
    })

    it('should show validation errors for empty title', async () => {
      const user = userEvent.setup()
      renderWithProviders(<TaskModal {...defaultProps} />)

      const submitButton = screen.getByRole('button', { name: /create task/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Task title must be at least 3 characters')).toBeInTheDocument()
      })
    })
  })

  describe('Task Edit Mode', () => {
    it('should render edit task form with pre-filled data', () => {
      renderTaskModal({ task: mockTask, mode: 'edit' })

      expect(screen.getByText('Edit Task')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test description')).toBeInTheDocument()
    })
  })

  describe('Form Interactions', () => {
    it('should close modal when cancel button is clicked', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      
      renderTaskModal({ onClose })

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      expect(onClose).toHaveBeenCalled()
    })
  })

  it('renders in create mode without task data', () => {
    renderTaskModal({ task: null, mode: 'create' })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
}) 