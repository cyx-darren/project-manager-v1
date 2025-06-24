import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TaskModal from '../TaskModal'
import { renderWithProviders } from '../../../test/setup'
import type { Task } from '../../../types/supabase'

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
  parent_task_id: null
}

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onSuccess: vi.fn(),
  projectId: 'project-1',
  teamMembers: []
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
      renderWithProviders(<TaskModal {...defaultProps} task={mockTask} />)

      expect(screen.getByText('Edit Task')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test description')).toBeInTheDocument()
    })
  })

  describe('Form Interactions', () => {
    it('should close modal when cancel button is clicked', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      
      renderWithProviders(<TaskModal {...defaultProps} onClose={onClose} />)

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      expect(onClose).toHaveBeenCalled()
    })
  })
}) 