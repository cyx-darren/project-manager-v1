import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="text-center">
              <ExclamationTriangleIcon className="mx-auto h-16 w-16 text-red-500" />
              <h1 className="mt-4 text-3xl font-bold text-gray-900">Something went wrong</h1>
              <p className="mt-2 text-base text-gray-600">
                We're sorry, but something unexpected happened.
              </p>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 text-left bg-red-50 border border-red-200 rounded-md p-4">
                  <summary className="font-medium text-red-800 cursor-pointer">
                    Error Details (Development Only)
                  </summary>
                  <pre className="mt-2 text-sm text-red-700 whitespace-pre-wrap">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
              <div className="mt-6">
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 