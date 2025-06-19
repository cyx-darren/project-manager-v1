import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Unauthorized: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleGoBack = () => {
    navigate(-1) // Go back to the previous page
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Error Icon */}
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100">
          <svg 
            className="h-10 w-10 text-red-600" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
            />
          </svg>
        </div>

        {/* Error Content */}
        <div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Access Denied
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            You don't have permission to access this page.
          </p>
          
          {user && (
            <div className="mt-4 p-4 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Current role:</span> {user.role || 'Not assigned'}
              </p>
              {user.permissions && user.permissions.length > 0 && (
                <p className="text-sm text-blue-800 mt-1">
                  <span className="font-medium">Permissions:</span> {user.permissions.join(', ')}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 space-y-4">
          <button
            onClick={handleGoBack}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            Go Back
          </button>
          
          <Link
            to="/dashboard"
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            Return to Dashboard
          </Link>
        </div>

        {/* Help Text */}
        <div className="mt-6">
          <p className="text-xs text-gray-500">
            If you believe this is an error, please contact your administrator or{' '}
            <a 
              href="mailto:support@yourapp.com" 
              className="text-indigo-600 hover:text-indigo-500"
            >
              contact support
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  )
}

export default Unauthorized 