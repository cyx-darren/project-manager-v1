import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Plus, Save, Loader2, AlertTriangle } from 'lucide-react';
import { z } from 'zod';
import { InputField, TextAreaField, SelectField } from '../forms';
import { UserSelector } from '../common';
import { teamService } from '../../services/teamService';
import { useAuth } from '../../contexts/AuthContext';
import { useTaskContext } from '../../contexts/TaskContext';
import { validateTaskData } from '../../utils/taskErrorHandler';
import type { Task } from '../../types/supabase';
import type { AssignableUser } from '../../services/teamService';

// Simple form schema for the modal
const taskFormSchema = z.object({
  title: z.string().min(3, 'Task title must be at least 3 characters').max(200, 'Title too long'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  status: z.enum(['todo', 'in_progress', 'done']),
  due_date: z.string().optional(),
  estimated_hours: z.coerce.number().optional(),
});

type TaskFormData = z.infer<typeof taskFormSchema>;

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated?: (task: Task) => void;
  onTaskUpdated?: (task: Task) => void;
  projectId: string;
  task?: Task | null;
  teamMembers?: Array<{ id: string; email: string; name?: string }>;
}

const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onTaskCreated,
  onTaskUpdated,
  projectId,
  task,
  teamMembers = []
}) => {
  const { user } = useAuth();
  const { createTask, updateTask } = useTaskContext();
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // User assignment state
  const [assignees, setAssignees] = useState<AssignableUser[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState<AssignableUser | null>(null);
  const [isLoadingAssignees, setIsLoadingAssignees] = useState(false);

  const isEditing = !!task;

  // Load project assignees
  const loadProjectAssignees = async () => {
    if (!projectId) return;
    
    setIsLoadingAssignees(true);
    try {
      const { data, error } = await teamService.getProjectAssignees(projectId);
      if (error) {
        console.error('Error loading assignees:', error);
      } else {
        setAssignees(data || []);
      }
    } catch (error) {
      console.error('Error loading assignees:', error);
    } finally {
      setIsLoadingAssignees(false);
    }
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty }
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      status: 'todo',
      due_date: '',
      estimated_hours: undefined,
    }
  });

  // Load project assignees when modal opens
  useEffect(() => {
    if (isOpen && projectId) {
      loadProjectAssignees();
    }
  }, [isOpen, projectId]);

  // Reset form when task changes or modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (task) {
        // Editing mode - populate with task data
        reset({
          title: task.title,
          description: task.description || '',
          priority: task.priority || 'medium',
          status: task.status,
          due_date: task.due_date ? task.due_date.split('T')[0] : '',
          estimated_hours: task.estimated_hours || undefined,
        });
        
        // Set selected assignee if task has one
        if (task.assignee_id && assignees.length > 0) {
          const assignee = assignees.find(a => a.id === task.assignee_id);
          setSelectedAssignee(assignee || null);
        } else {
          setSelectedAssignee(null);
        }
      } else {
        // Creating mode - reset to defaults
        reset({
          title: '',
          description: '',
          priority: 'medium',
          status: 'todo',
          due_date: '',
          estimated_hours: undefined,
        });
        setSelectedAssignee(null);
      }
      setSubmitError(null);
    }
  }, [isOpen, task, reset, assignees]);

  const onSubmit = async (data: TaskFormData) => {
    if (!user) return;

    setIsLoading(true);
    setSubmitError(null);

    try {
      // Prepare the data for API submission
      const submitData = {
        title: data.title.trim(),
        description: data.description?.trim() || null,
        priority: data.priority,
        status: data.status,
        due_date: data.due_date || null,
        estimated_hours: data.estimated_hours || null,
        assignee_id: selectedAssignee?.id || null,
      };

      // Additional client-side validation
      const validation = validateTaskData(submitData);
      if (!validation.isValid) {
        setSubmitError(validation.errors.join(', '));
        return;
      }

      if (isEditing && task) {
        // Update existing task using TaskContext
        const updatedTask = await updateTask(task.id, submitData);

        if (updatedTask) {
          // TaskContext handles success toast automatically
          onTaskUpdated?.(updatedTask);
          onClose();
        } else {
          // TaskContext handles error toast automatically
          setSubmitError('Failed to update task. Please try again.');
        }
      } else {
        // Create new task using TaskContext
        const newTask = await createTask({
          ...submitData,
          project_id: projectId,
          created_by: user.id,
        });

        if (newTask) {
          // TaskContext handles success toast automatically
          onTaskCreated?.(newTask);
          onClose();
        } else {
          // TaskContext handles error toast automatically
          setSubmitError('Failed to create task. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error in task submission:', error);
      setSubmitError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (isDirty) {
      const confirmClose = window.confirm(
        'You have unsaved changes. Are you sure you want to close?'
      );
      if (!confirmClose) return;
    }
    onClose();
  };

  // Priority options
  const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
  ];

  // Status options
  const statusOptions = [
    { value: 'todo', label: 'To Do' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'done', label: 'Done' },
  ];

  // Assignee options
  const assigneeOptions = [
    { value: '', label: 'Unassigned' },
    ...teamMembers.map(member => ({
      value: member.id,
      label: member.name || member.email
    }))
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        />
        
        {/* Modal */}
        <div className="relative transform rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6" style={{ overflow: 'visible' }}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Edit Task' : 'Create New Task'}
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 overflow-visible">
            {/* Task Title */}
            <InputField
              label="Task Title"
              name="title"
              type="text"
              register={register}
              error={errors.title}
              placeholder="Enter task title..."
              required
            />

            {/* Task Description */}
            <TextAreaField
              label="Description"
              name="description"
              register={register}
              error={errors.description}
              placeholder="Enter task description..."
              rows={4}
              maxLength={1000}
            />

            {/* Priority and Status Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField
                label="Priority"
                name="priority"
                register={register}
                error={errors.priority}
                options={priorityOptions}
                required
              />

              <SelectField
                label="Status"
                name="status"
                register={register}
                error={errors.status}
                options={statusOptions}
                required
              />
            </div>

            {/* Due Date and Estimated Hours Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Due Date"
                name="due_date"
                type="date"
                register={register}
                error={errors.due_date}
              />

              <InputField
                label="Estimated Hours"
                name="estimated_hours"
                type="number"
                register={register}
                error={errors.estimated_hours}
                placeholder="0"
              />
            </div>

            {/* Assignee */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assignee
              </label>
              <UserSelector
                users={assignees}
                selectedUser={selectedAssignee}
                onUserSelect={setSelectedAssignee}
                placeholder="Select assignee..."
                disabled={isLoadingAssignees}
                allowUnassigned={true}
              />
              {isLoadingAssignees && (
                <p className="mt-1 text-xs text-gray-500">Loading team members...</p>
              )}
            </div>

            {/* Submit Error */}
            {submitError && (
              <div 
                className="p-3 bg-red-50 border border-red-200 rounded-md" 
                role="alert"
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-600">{submitError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    {isEditing ? (
                      <>
                        <Save size={16} />
                        Update Task
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        Create Task
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskModal; 