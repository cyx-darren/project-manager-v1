import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LoginForm } from '../components/auth/LoginForm';
import { useAuth } from '../contexts/AuthContext';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading } = useAuth();

  // Get the intended destination from location state (set by ProtectedRoute)
  const from = location.state?.from?.pathname || '/dashboard';

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, from]);

  const handleLoginSuccess = () => {
    // Redirect to the originally intended destination or dashboard
    navigate(from, { replace: true });
  };

  const handleLoginError = (error: string) => {
    // Error handling is already handled in the LoginForm component
    console.error('Login error:', error);
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
            Your team's productivity hub
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <LoginForm 
          onSuccess={handleLoginSuccess}
          onError={handleLoginError}
        />
      </div>
    </div>
  );
}; 