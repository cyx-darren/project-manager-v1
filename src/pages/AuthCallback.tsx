import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../config/supabase';
import LoadingSpinner from '../components/LoadingSpinner';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle the auth callback
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          setError(error.message);
          console.error('Auth callback error:', error);
          return;
        }

        // Check if there's a session (user is authenticated)
        if (data.session) {
          // Successful authentication - redirect to dashboard
          navigate('/dashboard', { replace: true });
        } else {
          // No session - redirect to login with message
          navigate('/login?message=Please sign in to continue', { replace: true });
        }
      } catch (err) {
        console.error('Unexpected error in auth callback:', err);
        setError('An unexpected error occurred. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    // Small delay to allow URL parameters to be processed
    const timer = setTimeout(handleAuthCallback, 100);
    
    return () => clearTimeout(timer);
  }, [navigate, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Processing authentication...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full mx-4">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.98-.833-2.75 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-gray-900">
                Authentication Error
              </h3>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            {error}
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  // This shouldn't be reached, but just in case
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}; 