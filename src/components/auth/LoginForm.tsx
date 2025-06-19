import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useZodForm } from '../../hooks/useZodForm';
import { InputField } from '../forms/InputField';
import { loginSchema, type LoginFormData } from '../../schemas/authSchemas';
import { useAuth } from '../../contexts/AuthContext';
import { processAuthError } from '../../utils/authErrorHandler';

interface LoginFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onError }) => {
  const [formError, setFormError] = useState<string | null>(null);
  const { signIn, loading } = useAuth();

  const { register, handleSubmit, formState: { errors } } = useZodForm(loginSchema);

  const onSubmit = async (data: LoginFormData) => {
    setFormError(null);

    try {
      const { error } = await signIn(data.email, data.password);

      if (error) {
        throw error;
      }

      // Handle successful login
      onSuccess?.();
    } catch (error: any) {
      const errorMessage = processAuthError(error, 'login');
      setFormError(errorMessage);
      onError?.(errorMessage);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white shadow-lg rounded-lg p-8">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
          <p className="mt-2 text-sm text-gray-600">Sign in to your account</p>
        </div>

        {formError && (
          <div 
            className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md" 
            role="alert"
          >
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm">{formError}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <InputField
            label="Email"
            name="email"
            type="email"
            register={register}
            error={errors.email}
            placeholder="Enter your email"
            required
            autoComplete="email"
          />

          <InputField
            label="Password"
            name="password"
            type="password"
            register={register}
            error={errors.password}
            placeholder="Enter your password"
            required
            autoComplete="current-password"
          />

          <div className="flex items-center justify-between mb-6">
            <div className="text-sm">
              <Link 
                to="/forgot-password" 
                className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:underline transition duration-150 ease-in-out"
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            } transition duration-150 ease-in-out`}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link 
              to="/signup" 
              className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:underline transition duration-150 ease-in-out"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}; 