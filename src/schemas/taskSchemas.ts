import { z } from 'zod';

/**
 * Validation schema for task creation and editing
 */
export const taskSchema = z.object({
  title: z
    .string()
    .min(1, 'Task title is required')
    .min(3, 'Task title must be at least 3 characters')
    .max(200, 'Task title must not exceed 200 characters'),
  description: z
    .string()
    .max(1000, 'Description must not exceed 1000 characters')
    .optional(),
  priority: z
    .enum(['low', 'medium', 'high', 'urgent'])
    .optional()
    .default('medium'),
  status: z
    .enum(['todo', 'in_progress', 'done'])
    .optional()
    .default('todo'),
  due_date: z
    .string()
    .nullable()
    .optional()
    .refine((date) => {
      if (!date) return true; // Allow null/undefined
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selectedDate >= today;
    }, {
      message: 'Due date cannot be in the past'
    }),
  estimated_hours: z
    .number()
    .min(0, 'Estimated hours cannot be negative')
    .max(1000, 'Estimated hours cannot exceed 1000')
    .nullable()
    .optional(),
  assignee_id: z
    .string()
    .uuid('Invalid assignee ID')
    .nullable()
    .optional(),
});

/**
 * Validation schema for subtask creation and editing
 */
export const subtaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Subtask title is required')
    .min(3, 'Subtask title must be at least 3 characters')
    .max(150, 'Subtask title must not exceed 150 characters'),
  description: z
    .string()
    .max(500, 'Description must not exceed 500 characters')
    .optional(),
  completed: z
    .boolean()
    .default(false),
});

/**
 * Quick edit schema for inline task updates
 */
export const quickEditTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Task title is required')
    .min(3, 'Task title must be at least 3 characters')
    .max(200, 'Task title must not exceed 200 characters'),
});

// Type inference from schemas
export type TaskFormData = z.infer<typeof taskSchema>;
export type SubtaskFormData = z.infer<typeof subtaskSchema>;
export type QuickEditTaskFormData = z.infer<typeof quickEditTaskSchema>;

// Form data with additional fields for creation
export type CreateTaskFormData = TaskFormData & {
  project_id: string;
};

// Form data for editing (all fields optional except id)
export type EditTaskFormData = Partial<TaskFormData> & {
  id: string;
}; 