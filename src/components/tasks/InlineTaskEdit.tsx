import React, { useState, useRef, useEffect } from 'react';
import { Check, X, Edit3 } from 'lucide-react';
import { useTaskContext } from '../../contexts/TaskContext';
import type { Task } from '../../types/supabase';

interface InlineTaskEditProps {
  task: Task;
  onTaskUpdated?: (task: Task) => void;
  className?: string;
}

const InlineTaskEdit: React.FC<InlineTaskEditProps> = ({
  task,
  onTaskUpdated,
  className = ''
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(task.title);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Use TaskContext for optimistic updates
  const { updateTask } = useTaskContext();

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleEdit = () => {
    setValue(task.title);
    setError(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setValue(task.title);
    setError(null);
    setIsEditing(false);
  };

  const handleSave = async () => {
    const trimmedValue = value.trim();
    
    if (!trimmedValue) {
      setError('Task title cannot be empty');
      return;
    }

    if (trimmedValue.length < 3) {
      setError('Task title must be at least 3 characters');
      return;
    }

    if (trimmedValue === task.title) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use TaskContext's updateTask for optimistic updates
      const updatedTask = await updateTask(task.id, {
        title: trimmedValue
      });

      if (updatedTask) {
        // Call the callback if provided (for any additional handling)
        onTaskUpdated?.(updatedTask);
        setIsEditing(false);
      } else {
        setError('Failed to update task');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      setError('Failed to update task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const handleBlur = () => {
    // Small delay to allow clicking save button
    setTimeout(() => {
      if (isEditing && !isLoading) {
        handleSave();
      }
    }, 150);
  };

  if (isEditing) {
    return (
      <div className={`relative ${className}`}>
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            disabled={isLoading}
            className={`flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            maxLength={200}
          />
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={isLoading}
              className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
              title="Save"
            >
              <Check size={14} />
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoading}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors disabled:opacity-50"
              title="Cancel"
            >
              <X size={14} />
            </button>
          </div>
        </div>
        {error && (
          <p className="mt-1 text-xs text-red-600">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className={`group relative ${className}`}>
      <div 
        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded px-1 py-0.5 transition-colors"
        onClick={handleEdit}
      >
        <span className="flex-1 text-sm">{task.title}</span>
        <Edit3 
          size={14} 
          className="opacity-0 group-hover:opacity-50 text-gray-400 transition-opacity" 
        />
      </div>
    </div>
  );
};

export default InlineTaskEdit; 