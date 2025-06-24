import React, { useState, useEffect } from 'react';
import { BoardColumnsSchemaValidator, type SchemaValidationResult } from '../utils/validateBoardColumnsSchema';

const SchemaValidationTest: React.FC = () => {
  const [validationResult, setValidationResult] = useState<SchemaValidationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runValidation = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await BoardColumnsSchemaValidator.validateSchema();
      setValidationResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const runQuickValidation = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const isValid = await BoardColumnsSchemaValidator.quickValidation();
      alert(`Quick Validation Result: ${isValid ? 'PASSED' : 'FAILED'}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Run validation on component mount
    runValidation();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Board Columns Schema Validation Test
            </h1>
            <p className="text-gray-600">
              This page tests the database schema migration for custom board columns functionality.
            </p>
          </div>

          <div className="flex gap-4 mb-6">
            <button
              onClick={runValidation}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md font-medium"
            >
              {isLoading ? 'Running...' : 'Run Full Validation'}
            </button>
            
            <button
              onClick={runQuickValidation}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-md font-medium"
            >
              {isLoading ? 'Running...' : 'Quick Validation'}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}

          {validationResult && (
            <div className="space-y-6">
              {/* Status Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className={`p-4 rounded-lg ${validationResult.tableExists ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex items-center">
                    <span className={`text-2xl mr-2 ${validationResult.tableExists ? 'text-green-600' : 'text-red-600'}`}>
                      {validationResult.tableExists ? '✅' : '❌'}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Table Exists</p>
                      <p className="text-xs text-gray-500">board_columns table</p>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-lg ${validationResult.columnIdExists ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex items-center">
                    <span className={`text-2xl mr-2 ${validationResult.columnIdExists ? 'text-green-600' : 'text-red-600'}`}>
                      {validationResult.columnIdExists ? '✅' : '❌'}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Column Added</p>
                      <p className="text-xs text-gray-500">column_id in tasks</p>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-lg ${validationResult.defaultColumnsExist ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex items-center">
                    <span className={`text-2xl mr-2 ${validationResult.defaultColumnsExist ? 'text-green-600' : 'text-red-600'}`}>
                      {validationResult.defaultColumnsExist ? '✅' : '❌'}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Default Columns</p>
                      <p className="text-xs text-gray-500">{validationResult.details.boardColumnsCount} columns</p>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-lg ${validationResult.migrationComplete ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                  <div className="flex items-center">
                    <span className={`text-2xl mr-2 ${validationResult.migrationComplete ? 'text-green-600' : 'text-yellow-600'}`}>
                      {validationResult.migrationComplete ? '✅' : '⚠️'}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Migration Status</p>
                      <p className="text-xs text-gray-500">{validationResult.migrationComplete ? 'Complete' : 'Incomplete'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Statistics */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Migration Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Board Columns</p>
                    <p className="text-2xl font-bold text-gray-900">{validationResult.details.boardColumnsCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Projects with Columns</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {validationResult.details.projectsWithColumns}/{validationResult.details.totalProjects}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tasks with column_id</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {validationResult.details.tasksWithColumnId}/{validationResult.details.totalTasks}
                    </p>
                  </div>
                </div>
              </div>

              {/* Errors */}
              {validationResult.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-red-800 mb-2">Issues Found</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {validationResult.errors.map((error, index) => (
                      <li key={index} className="text-sm text-red-700">{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Full Report */}
              <div className="bg-gray-900 rounded-lg p-4">
                <h3 className="text-lg font-medium text-white mb-2">Full Validation Report</h3>
                <pre className="text-sm text-green-400 whitespace-pre-wrap overflow-x-auto">
                  {BoardColumnsSchemaValidator.formatValidationReport(validationResult)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SchemaValidationTest; 