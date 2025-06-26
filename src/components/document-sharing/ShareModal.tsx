import React from 'react'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  entityType: 'task' | 'project' | 'attachment'
  entityId: string
  entityTitle: string
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  entityType,
  entityId,
  entityTitle
}) => {
  console.log('ShareModal rendering:', { isOpen, entityType, entityId, entityTitle })

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-semibold mb-4">Share {entityTitle}</h2>
        <p className="text-gray-600 mb-4">Share modal is working</p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Close
        </button>
      </div>
    </div>
  )
} 