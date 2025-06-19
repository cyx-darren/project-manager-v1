import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SignupForm } from '../components/auth/SignupForm';
import { useAuth } from '../contexts/AuthContext';

export const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleSignupSuccess = () => {
    // Redirect to login page after successful signup
    // User will need to verify email before they can log in
    setTimeout(() => {
      navigate('/login');
    }, 3000); // Give user time to read the success message
  };

  const handleSignupError = (error: string) => {
    // Error handling is already handled in the SignupForm component
    console.error('Signup error:', error);
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Task Manager
          </h1>
          <p className="text-gray-600">
            Join your team's productivity hub
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <SignupForm 
          onSuccess={handleSignupSuccess}
          onError={handleSignupError}
        />
      </div>
    </div>
  );
}; 