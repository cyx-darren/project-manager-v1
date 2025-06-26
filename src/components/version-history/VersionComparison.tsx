import React from 'react';
import { X, Plus, Minus, Edit3 } from 'lucide-react';
import type { VersionComparison as VersionComparisonType } from '../../services/versionHistoryService';

interface VersionComparisonProps {
  fromVersion: number;
  toVersion: number;
  differences: VersionComparisonType[];
  onClose: () => void;
}

export function VersionComparison({
  fromVersion,
  toVersion,
  differences,
  onClose
}: VersionComparisonProps) {
  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'added':
        return <Plus className="w-4 h-4 text-green-500" />;
      case 'deleted':
        return <Minus className="w-4 h-4 text-red-500" />;
      case 'modified':
        return <Edit3 className="w-4 h-4 text-blue-500" />;
      default:
        return <Edit3 className="w-4 h-4 text-gray-500" />;
    }
  };

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'added':
        return 'bg-green-50 border-green-200';
      case 'deleted':
        return 'bg-red-50 border-red-200';
      case 'modified':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) {
      return '(empty)';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Compare Versions {fromVersion} → {toVersion}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {differences.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No differences found between these versions.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {differences.map((diff, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${getChangeColor(diff.change_type)}`}
                >
                  <div className="flex items-center mb-3">
                    {getChangeIcon(diff.change_type)}
                    <span className="ml-2 font-medium text-gray-900">
                      {diff.field_name}
                    </span>
                    <span className="ml-2 text-sm text-gray-500 capitalize">
                      ({diff.change_type})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {diff.change_type !== 'added' && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          Version {fromVersion} (Old)
                        </h4>
                        <div className="bg-white border border-gray-200 rounded p-3">
                          <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                            {formatValue(diff.old_value)}
                          </pre>
                        </div>
                      </div>
                    )}

                    {diff.change_type !== 'deleted' && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          Version {toVersion} (New)
                        </h4>
                        <div className="bg-white border border-gray-200 rounded p-3">
                          <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                            {formatValue(diff.new_value)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
} 