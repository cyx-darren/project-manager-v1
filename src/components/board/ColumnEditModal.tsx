import React, { useState, useEffect } from 'react'
import { X, Edit2, Trash2, Palette, AlertTriangle, Check } from 'lucide-react'
import type { BoardColumn } from '../../types/supabase'
import { BoardColumnService } from '../../services/boardColumnService'

interface ColumnEditModalProps {
  column: BoardColumn
  isOpen: boolean
  onClose: () => void
  onColumnUpdated: (column: BoardColumn) => void
  onColumnDeleted: (columnId: string) => void
  isLoading?: boolean
}

const PRESET_COLORS = [
  { color: '#6b7280', name: 'Gray' },
  { color: '#ef4444', name: 'Red' },
  { color: '#f97316', name: 'Orange' },
  { color: '#f59e0b', name: 'Amber' },
  { color: '#eab308', name: 'Yellow' },
  { color: '#84cc16', name: 'Lime' },
  { color: '#22c55e', name: 'Green' },
  { color: '#10b981', name: 'Emerald' },
  { color: '#06b6d4', name: 'Cyan' },
  { color: '#3b82f6', name: 'Blue' },
  { color: '#6366f1', name: 'Indigo' },
  { color: '#8b5cf6', name: 'Violet' },
  { color: '#a855f7', name: 'Purple' },
  { color: '#d946ef', name: 'Fuchsia' },
  { color: '#ec4899', name: 'Pink' },
  { color: '#f43f5e', name: 'Rose' }
]

export const ColumnEditModal: React.FC<ColumnEditModalProps> = ({
  column,
  isOpen,
  onClose,
  onColumnUpdated,
  onColumnDeleted,
  isLoading: _isLoading = false
}) => {
  const [name, setName] = useState(column.name)
  const [color, setColor] = useState(column.color)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  // Reset form when modal opens/closes or column changes
  useEffect(() => {
    if (isOpen) {
      setName(column.name)
      setColor(column.color)
      setError(null)
      setShowDeleteConfirm(false)
      setHasChanges(false)
    }
  }, [isOpen, column])

  // Track changes
  useEffect(() => {
    const changed = name !== column.name || color !== column.color
    setHasChanges(changed)
  }, [name, color, column])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false)
        } else {
          handleClose()
        }
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, showDeleteConfirm])

  const handleClose = () => {
    if (isUpdating || isDeleting) return
    onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  const handleUpdate = async () => {
    if (!hasChanges || isUpdating || !name.trim()) return

    setIsUpdating(true)
    setError(null)

    try {
      const response = await BoardColumnService.updateColumn(column.id, {
        name: name.trim(),
        color
      })

      if (response.success && response.data) {
        onColumnUpdated(response.data)
        onClose()
      } else {
        setError(response.error || 'Failed to update column')
      }
    } catch (error) {
      console.error('Failed to update column:', error)
      setError('Failed to update column')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async () => {
    if (isDeleting) return

    setIsDeleting(true)
    setError(null)

    try {
      const response = await BoardColumnService.deleteColumn(column.id)
      
      if (response.success) {
        onColumnDeleted(column.id)
        onClose()
      } else {
        setError(response.error || 'Failed to delete column')
      }
    } catch (error) {
      console.error('Failed to delete column:', error)
      setError('Failed to delete column')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleUpdate()
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-200 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div 
              className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: color }}
            />
            <h2 className="text-xl font-semibold text-gray-900">Edit Column</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isUpdating || isDeleting}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-150 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Column Name */}
          <div>
            <label htmlFor="column-name" className="block text-sm font-medium text-gray-700 mb-2">
              Column Name
            </label>
            <div className="relative">
              <Edit2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="column-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isUpdating || isDeleting}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-150"
                placeholder="Enter column name..."
                maxLength={50}
                required
              />
            </div>
            <div className="mt-1 text-xs text-gray-500">
              {name.length}/50 characters
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Palette className="inline h-4 w-4 mr-1" />
              Column Color
            </label>
            <div className="grid grid-cols-8 gap-2">
              {PRESET_COLORS.map((presetColor) => (
                <button
                  key={presetColor.color}
                  type="button"
                  onClick={() => setColor(presetColor.color)}
                  disabled={isUpdating || isDeleting}
                  className={`
                    w-8 h-8 rounded-lg border-2 transition-all duration-150 hover:scale-110 disabled:opacity-50 disabled:hover:scale-100
                    ${color === presetColor.color 
                      ? 'border-gray-800 ring-2 ring-blue-500 ring-offset-2' 
                      : 'border-gray-300 hover:border-gray-400'
                    }
                  `}
                  style={{ backgroundColor: presetColor.color }}
                  title={presetColor.name}
                >
                  {color === presetColor.color && (
                    <Check className="h-4 w-4 text-white mx-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-700 mb-2">Preview</div>
            <div 
              className="p-3 bg-white rounded-lg border-l-4 shadow-sm"
              style={{ borderLeftColor: color }}
            >
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="font-medium text-gray-900">{name || 'Column Name'}</span>
              </div>
              <div className="mt-2 text-xs text-gray-500">0 tasks</div>
            </div>
          </div>
        </form>

        {/* Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          {/* Delete Button */}
          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isUpdating || isDeleting}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 transition-all duration-150"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Column
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-red-700 font-medium">Delete this column?</span>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 transition-colors duration-150"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 transition-colors duration-150"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Save/Cancel Buttons */}
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isUpdating || isDeleting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-all duration-150"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleUpdate}
              disabled={!hasChanges || isUpdating || isDeleting || !name.trim()}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:bg-gray-400 transition-all duration-150"
            >
              {isUpdating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Update Column
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 