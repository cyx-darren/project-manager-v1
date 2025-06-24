import React, { useState } from 'react'
import { Plus, X, Check, Palette } from 'lucide-react'
import type { BoardColumn } from '../../types/supabase'
import { BoardColumnService } from '../../services/boardColumnService'

interface AddColumnButtonProps {
  projectId: string
  onColumnCreated: (column: BoardColumn) => void
  position: number
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
  { color: '#f43f5e', name: 'Rose' },
]

export const AddColumnButton: React.FC<AddColumnButtonProps> = ({
  projectId,
  onColumnCreated,
  position,
  isLoading = false
}) => {
  const [isCreating, setIsCreating] = useState(false)
  const [columnName, setColumnName] = useState('')
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0].color)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)

  const handleStartCreating = () => {
    setIsCreating(true)
    setColumnName('')
    setSelectedColor(PRESET_COLORS[0].color)
    setShowColorPicker(false)
  }

  const handleCancel = () => {
    setIsCreating(false)
    setColumnName('')
    setSelectedColor(PRESET_COLORS[0].color)
    setShowColorPicker(false)
  }

  const handleSubmit = async () => {
    const trimmedName = columnName.trim()
    if (!trimmedName || isSubmitting) return

    try {
      setIsSubmitting(true)
      const response = await BoardColumnService.createColumn({
        project_id: projectId,
        name: trimmedName,
        color: selectedColor,
        position
      })

      if (response.success && response.data) {
        onColumnCreated(response.data)
        setIsCreating(false)
        setColumnName('')
        setSelectedColor(PRESET_COLORS[0].color)
        setShowColorPicker(false)
      } else {
        console.error('Failed to create column:', response.error)
      }
    } catch (error) {
      console.error('Error creating column:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  const selectedColorName = PRESET_COLORS.find(c => c.color === selectedColor)?.name || 'Color'

  if (isCreating) {
    return (
      <div className="w-80 flex-shrink-0 bg-white border border-gray-200 rounded-xl shadow-sm p-6 animate-in fade-in-0 zoom-in-95 duration-200 sm:w-72 md:w-80 lg:w-80">
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">New Column</h3>
            <button
              onClick={handleCancel}
              disabled={isSubmitting}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors duration-150 disabled:opacity-50"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Column Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Column Name
            </label>
            <input
              type="text"
              value={columnName}
              onChange={(e) => setColumnName(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Enter column name..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-150"
              autoFocus
              maxLength={50}
              disabled={isSubmitting}
            />
            <div className="mt-1 text-xs text-gray-500">
              {columnName.length}/50 characters
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color Theme
            </label>
            
            {/* Selected Color Display */}
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              disabled={isSubmitting}
              className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:border-gray-400 transition-colors duration-150 disabled:opacity-50"
            >
              <div className="flex items-center space-x-3">
                <div
                  className="w-5 h-5 rounded-full shadow-sm"
                  style={{ backgroundColor: selectedColor }}
                />
                <span className="text-sm text-gray-700">{selectedColorName}</span>
              </div>
              <Palette className="h-4 w-4 text-gray-400" />
            </button>

            {/* Color Picker */}
            {showColorPicker && (
              <div className="mt-3 p-3 border border-gray-200 rounded-lg bg-gray-50 animate-in fade-in-0 slide-in-from-top-1 duration-150">
                <div className="grid grid-cols-8 gap-2">
                  {PRESET_COLORS.map((colorOption) => (
                    <button
                      key={colorOption.color}
                      onClick={() => {
                        setSelectedColor(colorOption.color)
                        setShowColorPicker(false)
                      }}
                      disabled={isSubmitting}
                      className={`
                        w-7 h-7 rounded-full border-2 hover:scale-110 transition-all duration-150 disabled:opacity-50
                        ${selectedColor === colorOption.color ? 'border-gray-800 shadow-md' : 'border-gray-300 hover:border-gray-400'}
                      `}
                      style={{ backgroundColor: colorOption.color }}
                      title={colorOption.name}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-xs text-gray-500 mb-2">Preview:</div>
            <div className="flex items-center space-x-3">
              <div
                className="w-3 h-3 rounded-full shadow-sm"
                style={{ backgroundColor: selectedColor }}
              />
              <span className="text-sm font-medium text-gray-900">
                {columnName || 'New Column'}
              </span>
              <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                0
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              onClick={handleCancel}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-150 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!columnName.trim() || isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-all duration-150 hover:scale-105 disabled:hover:scale-100"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>Create Column</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={handleStartCreating}
      disabled={isLoading}
      className={`
        w-80 flex-shrink-0 bg-white border-2 border-dashed border-gray-300 rounded-xl p-8 
        hover:border-gray-400 hover:bg-gray-50 hover:shadow-sm
        transition-all duration-200 group
        disabled:opacity-50 disabled:cursor-not-allowed
        sm:w-72 md:w-80 lg:w-80
        ${isLoading ? 'animate-pulse' : 'hover:scale-102'}
      `}
    >
      <div className="flex flex-col items-center justify-center text-gray-500 group-hover:text-gray-600">
        <div className="relative">
          <Plus className="h-8 w-8 mb-3 transition-transform duration-200 group-hover:scale-110" />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400" />
            </div>
          )}
        </div>
        <span className="text-sm font-semibold mb-1">
          {isLoading ? 'Loading...' : 'Add Column'}
        </span>
        <span className="text-xs text-gray-400 text-center">
          {isLoading ? 'Please wait' : 'Click to create a new column'}
        </span>
      </div>
    </button>
  )
} 