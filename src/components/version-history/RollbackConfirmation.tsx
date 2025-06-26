import React, { useState } from 'react';
import { AlertTriangle, RotateCcw, X } from 'lucide-react';

interface RollbackConfirmationProps {
  versionNumber: number;
  onConfirm: (versionNumber: number, summary?: string) => void;
  onCancel: () => void;
}

export function RollbackConfirmation({
  versionNumber,
  onConfirm,
  onCancel
}: RollbackConfirmationProps) {
  const [summary, setSummary] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm(versionNumber, summary || undefined);
    } catch (error) {
      console.error('Error during rollback:', error);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <AlertTriangle className="w-6 h-6 text-orange-500 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">
              Confirm Rollback
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <p className="text-gray-600 mb-2">
              Are you sure you want to rollback to <strong>Version {versionNumber}</strong>?
            </p>
            <p className="text-sm text-gray-500">
              This will create a new version with the content from Version {versionNumber}. 
              The current version will be preserved in the history.
            </p>
          </div>

          <div className="mb-6">
            <label htmlFor="rollback-summary" className="block text-sm font-medium text-gray-700 mb-2">
              Rollback Summary (Optional)
            </label>
            <textarea
              id="rollback-summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Describe why you're rolling back to this version..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-md p-3 mb-6">
            <div className="flex">
              <AlertTriangle className="w-5 h-5 text-orange-400 mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-orange-700">
                <p className="font-medium mb-1">Important:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>This action cannot be undone automatically</li>
                  <li>You can rollback again if needed</li>
                  <li>All team members will see this change</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onCancel}
            disabled={isConfirming}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isConfirming}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 flex items-center"
          >
            {isConfirming ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Rolling back...
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4 mr-2" />
                Rollback to Version {versionNumber}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 