import React, { useState } from 'react';
import { Clock, RotateCcw, GitBranch, Eye, User, Calendar, FileText, AlertCircle } from 'lucide-react';
import { useVersionHistory, type UseVersionHistoryProps } from '../../hooks/useVersionHistory';
import { VersionComparison } from './VersionComparison';
import { RollbackConfirmation } from './RollbackConfirmation';
import type { VersionComparison as VersionComparisonType } from '../../services/versionHistoryService';

interface VersionHistoryPanelProps extends UseVersionHistoryProps {
  className?: string;
  onRollback?: (versionNumber: number) => void;
}

export function VersionHistoryPanel({
  entityType,
  entityId,
  enabled = true,
  className = '',
  onRollback
}: VersionHistoryPanelProps) {
  const {
    versions,
    isLoading,
    error,
    hasHistory,
    rollbackToVersion,
    compareVersions
  } = useVersionHistory({ entityType, entityId, enabled });

  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [comparisonData, setComparisonData] = useState<VersionComparisonType[] | null>(null);
  const [showRollbackDialog, setShowRollbackDialog] = useState<number | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  const handleCompareWithCurrent = async (versionNumber: number) => {
    if (versions.length === 0) return;
    
    setIsComparing(true);
    try {
      const currentVersion = versions[0].version.version_number;
      const comparison = await compareVersions(versionNumber, currentVersion);
      setComparisonData(comparison);
      setSelectedVersion(versionNumber);
    } catch (err) {
      console.error('Error comparing versions:', err);
    } finally {
      setIsComparing(false);
    }
  };

  const handleRollback = async (versionNumber: number, summary?: string) => {
    try {
      await rollbackToVersion(versionNumber, summary);
      setShowRollbackDialog(null);
      onRollback?.(versionNumber);
    } catch (err) {
      console.error('Error rolling back:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getVersionIcon = (versionNumber: number) => {
    if (versions.length > 0 && versionNumber === versions[0].version.version_number) {
      return <GitBranch className="w-4 h-4 text-green-500" />;
    }
    return <Clock className="w-4 h-4 text-gray-400" />;
  };

  if (!enabled) {
    return null;
  }

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Loading version history...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg border border-red-200 p-6 ${className}`}>
        <div className="flex items-center text-red-600">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>Error loading version history: {error}</span>
        </div>
      </div>
    );
  }

  if (!hasHistory || versions.length === 0) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Version History</h3>
          <p className="text-gray-500">
            This {entityType} doesn't have any saved versions yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Clock className="w-5 h-5 text-gray-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Version History</h3>
          </div>
          <span className="text-sm text-gray-500">
            {versions.length} version{versions.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="space-y-4">
          {versions.map((entry, index) => (
            <div key={entry.version.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  {getVersionIcon(entry.version.version_number)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-gray-900">
                        Version {entry.version.version_number}
                      </span>
                      {index === 0 && (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 mb-2">
                      {entry.version.summary || 'No description'}
                    </p>
                    
                    <div className="flex items-center text-sm text-gray-500 space-x-4">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        <span>{entry.version.created_by || 'Unknown user'}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>{formatDate(entry.version.created_at || '')}</span>
                      </div>
                    </div>

                    {entry.changes && entry.changes.length > 0 && (
                      <div className="mt-3 text-sm">
                        <span className="text-gray-500">Changes: </span>
                        <span className="text-gray-700">
                          {entry.changes.length} field{entry.changes.length !== 1 ? 's' : ''} modified
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex space-x-2">
                  {index > 0 && (
                    <>
                      <button
                        onClick={() => handleCompareWithCurrent(entry.version.version_number)}
                        disabled={isComparing}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                      >
                        <Eye className="w-4 h-4 mr-1 inline" />
                        Compare
                      </button>
                      <button
                        onClick={() => setShowRollbackDialog(entry.version.version_number)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 text-orange-600 hover:bg-orange-50"
                      >
                        <RotateCcw className="w-4 h-4 mr-1 inline" />
                        Rollback
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Version Comparison Modal */}
      {comparisonData && selectedVersion && (
        <VersionComparison
          fromVersion={selectedVersion}
          toVersion={versions[0].version.version_number}
          differences={comparisonData}
          onClose={() => {
            setComparisonData(null);
            setSelectedVersion(null);
          }}
        />
      )}

      {/* Rollback Confirmation Dialog */}
      {showRollbackDialog && (
        <RollbackConfirmation
          versionNumber={showRollbackDialog}
          onConfirm={handleRollback}
          onCancel={() => setShowRollbackDialog(null)}
        />
      )}
    </div>
  );
} 