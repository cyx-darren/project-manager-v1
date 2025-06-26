import React, { useState } from 'react';
import { Shield, Play, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { rlsTestingService, type RLSTestSuite } from '../services/rlsTestingService';
import { useToastContext } from '../contexts/ToastContext';

export const AdminRLSTesting: React.FC = () => {
  const [testResults, setTestResults] = useState<{
    suites: RLSTestSuite[];
    summary: {
      totalTests: number;
      passed: number;
      failed: number;
      successRate: number;
    };
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToastContext();

  const runRLSTests = async () => {
    try {
      setLoading(true);
      showToast('info', 'Running comprehensive RLS tests...');
      
      const results = await rlsTestingService.runComprehensiveTests();
      setTestResults(results);
      
      if (results.summary.successRate === 100) {
        showToast('success', `All ${results.summary.totalTests} RLS tests passed!`);
      } else {
        showToast('warning', `${results.summary.failed} of ${results.summary.totalTests} tests failed`);
      }
    } catch (error) {
      console.error('Failed to run RLS tests:', error);
      showToast('error', 'Failed to run RLS tests');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (passed: boolean) => {
    return passed ? (
      <CheckCircle className="w-5 h-5 text-green-600" />
    ) : (
      <XCircle className="w-5 h-5 text-red-600" />
    );
  };

  const getStatusColor = (passed: boolean) => {
    return passed ? 'text-green-600' : 'text-red-600';
  };

  const getSuiteStatusColor = (suite: RLSTestSuite) => {
    if (suite.failed === 0) return 'border-green-200 bg-green-50';
    if (suite.passed === 0) return 'border-red-200 bg-red-50';
    return 'border-yellow-200 bg-yellow-50';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Shield className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Row Level Security Testing</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Comprehensive testing suite for database Row Level Security (RLS) policies
          </p>
        </div>

        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">RLS Policy Validation</h2>
              <p className="text-gray-600">
                Test all database security policies to ensure proper data isolation and access control
              </p>
            </div>
            <button
              onClick={runRLSTests}
              disabled={loading}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Play className="w-5 h-5 mr-2" />
              )}
              {loading ? 'Running Tests...' : 'Run All Tests'}
            </button>
          </div>
        </div>

        {/* Test Results Summary */}
        {testResults && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Results Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center">
                  <div className="bg-blue-500 p-2 rounded-lg">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-blue-600">Total Tests</p>
                    <p className="text-2xl font-bold text-blue-900">{testResults.summary.totalTests}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center">
                  <div className="bg-green-500 p-2 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-green-600">Passed</p>
                    <p className="text-2xl font-bold text-green-900">{testResults.summary.passed}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <div className="flex items-center">
                  <div className="bg-red-500 p-2 rounded-lg">
                    <XCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-red-600">Failed</p>
                    <p className="text-2xl font-bold text-red-900">{testResults.summary.failed}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center">
                  <div className="bg-purple-500 p-2 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-purple-600">Success Rate</p>
                    <p className="text-2xl font-bold text-purple-900">{testResults.summary.successRate.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Test Results */}
        {testResults && (
          <div className="space-y-6">
            {testResults.suites.map((suite, index) => (
              <div
                key={index}
                className={`bg-white rounded-lg shadow-sm border-2 p-6 ${getSuiteStatusColor(suite)}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">{suite.category}</h3>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">
                      {suite.passed}/{suite.total} tests passed
                    </span>
                    <div className="flex items-center">
                      {suite.failed === 0 ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-600" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {suite.tests.map((test, testIndex) => (
                    <div
                      key={testIndex}
                      className="flex items-start justify-between p-4 bg-white rounded-lg border border-gray-200"
                    >
                      <div className="flex items-start">
                        <div className="mr-3 mt-0.5">
                          {getStatusIcon(test.passed)}
                        </div>
                        <div>
                          <h4 className={`font-medium ${getStatusColor(test.passed)}`}>
                            {test.test}
                          </h4>
                          {test.details && (
                            <p className="text-sm text-gray-600 mt-1">{test.details}</p>
                          )}
                          {test.error && (
                            <p className="text-sm text-red-600 mt-1 font-mono bg-red-50 p-2 rounded">
                              Error: {test.error}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results State */}
        {!testResults && !loading && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Test Results</h3>
            <p className="text-gray-600 mb-6">
              Click "Run All Tests" to validate your Row Level Security policies
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <RefreshCw className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Running RLS Tests</h3>
            <p className="text-gray-600">
              Testing database security policies... This may take a few moments.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}; 